import { exists } from "@std/fs/exists";
import { toKebabCase } from "@std/text";
import type { DocNode } from "@deno/doc";
import type { SourceFile } from "ts-morph";
import { Project } from "ts-morph";
import { findDocNode } from "#/lib/deno-doc/find.ts";
import { readDenoDoc, writeDenoDoc } from "./fs.ts";
import { generateDocNodes } from "#/lib/deno-doc/generate-doc-nodes.ts";

const typesDtsURL =
  "https://github.com/denoland/deno_doc/raw/2c0ff7c0eee0ebd8e865ca8284e5e1b03f3f008c/js/types.d.ts";
const downloadTypesDts = false;
const typesDtsFile = new URL(import.meta.resolve("./types.json"));
const typesDtsDocNodes = downloadTypesDts
  ? await generateDocNodes(typesDtsURL)
  : await readDenoDoc(typesDtsFile);
if (downloadTypesDts) {
  await writeDenoDoc(typesDtsFile, typesDtsDocNodes);
}

const destinationDir = "./lib/deno-doc/generated/walk";

if (import.meta.main) {
  const project = new Project();
  const dtsDocNodes = parseTypeReferenceNodes(typesDtsDocNodes);
  if (await exists(destinationDir)) {
    await Deno.remove(destinationDir, { recursive: true });
  }

  // For each symbol, codegen a generator function that finds all references of that type in a node, recursively.
  for (const symbol of dtsDocNodes.keys()) {
    createWalkFile(project, dtsDocNodes, symbol);
  }

  await project.save();
}

function createWalkFile(
  project: Project,
  nodeMap: TypeReferenceNodeMap,
  symbol: string,
): SourceFile {
  const nodes = nodeMap.get(symbol);
  if (nodes === undefined) {
    throw new Error(`node not found for symbol: ${symbol}`);
  }

  const walkFnIdentifier = makeWalkFnIdentifier(symbol);
  const sourceFile = project.createSourceFile(
    `${destinationDir}/${toKebabCase(walkFnIdentifier)}.ts`,
    "",
    { overwrite: true },
  );

  sourceFile.addImportDeclaration({
    isTypeOnly: true,
    namedImports: [symbol],
    moduleSpecifier: "@deno/doc",
  });

  const walkFn = sourceFile.addFunction({
    name: walkFnIdentifier,
    parameters: [{ name: "node", type: symbol }],
    isExported: true,
    isGenerator: true,
    returnType: "Generator<unknown, void, unknown>",
  });

  const importedWalkFnIdentifiers = new Set<string>();
  if (symbol !== "LiteralDef") {
    for (const node of nodes) {
      for (let i = 0; i < (node.typeNames?.length ?? 0); i++) {
        const typeName = node.typeNames?.[i];
        if (typeName === undefined || !nodeMap.has(typeName)) {
          continue;
        }

        const currentNode = findDocNode(typesDtsDocNodes, { name: typeName });
        if (currentNode === undefined) {
          throw new Error(`node not found for type name: ${typeName}`);
        }

        const walkFnIdentifier = makeWalkFnIdentifier(typeName);
        importedWalkFnIdentifiers.add(walkFnIdentifier);

        for (const kind of node.kinds?.[i]!) {
          walkFn.addStatements([
            `if (node.kind === "${kind}") {`,
            `return yield* ${walkFnIdentifier}(node);`,
            `}`,
          ]);
        }
      }

      for (const property of node.properties ?? []) {
        if (!nodeMap.has(property.typeName)) {
          continue;
        }

        const walkFnIdentifier = makeWalkFnIdentifier(property.typeName);
        importedWalkFnIdentifiers.add(walkFnIdentifier);
        if (property.multiple) {
          const iterableString = `node.${property.property}${
            property.optional ? " ?? []" : ""
          }`;
          const yieldString = `yield value; yield* ${walkFnIdentifier}(value);`;
          walkFn.addStatements([
            `for (const value of ${iterableString}) {`,
            yieldString,
            `}`,
          ]);
        } else {
          const yieldString =
            `yield node.${property.property}; yield* ${walkFnIdentifier}(node.${property.property});`;
          if (property.optional) {
            walkFn.addStatements([
              `if (node.${property.property} !== undefined) {`,
              yieldString,
              `}`,
            ]);
          } else {
            walkFn.addStatements(yieldString);
          }
        }
      }
    }
  }

  const bodyText = walkFn.getBodyText();
  if (bodyText === undefined || bodyText === "") {
    const unusedParameter = walkFn.getParameter("node");
    if (unusedParameter === undefined) {
      throw new Error(`expected parameter node not found`);
    }

    unusedParameter.rename("_node");
  }

  for (const importedWalkFnIdentifier of importedWalkFnIdentifiers) {
    sourceFile.addImportDeclaration({
      namedImports: [importedWalkFnIdentifier],
      moduleSpecifier: `./${toKebabCase(importedWalkFnIdentifier)}.ts`,
    });
  }

  sourceFile.insertText(0, "// Notice: Do NOT edit this generated file.\n");
  return sourceFile;
}

function makeWalkFnIdentifier(symbol: string): string {
  return `walk${symbol}`;
}

function parseTypeReferenceNodes(docNodes: DocNode[]): TypeReferenceNodeMap {
  const referenceNodes = docNodes.reduce((result, docNode) => {
    const typeReferenceNode = parseTypeReferenceNode(docNode);
    return result.set(
      docNode.name,
      [...result.get(docNode.name) ?? [], typeReferenceNode],
    );
  }, new Map<string, TypeReferenceNode[]>());

  referenceNodes.forEach((nodes, key) => {
    for (const node of nodes) {
      node.properties = node.properties
        ?.filter((property) => referenceNodes.has(property.typeName));
      node.typeNames = node.typeNames
        ?.filter((typeName) => referenceNodes.has(typeName));
      node.kinds = node.typeNames?.map((typeName) => {
        const currentNode = findDocNode(docNodes, { name: typeName });
        if (currentNode === undefined) {
          throw new Error(`node not found for type name: ${typeName}`);
        }

        if (currentNode.kind === "interface") {
          const kind = currentNode.interfaceDef.properties
            .find((property) => property.name === "kind")?.tsType?.repr!;
          return [kind];
        }

        if (
          currentNode.kind === "typeAlias" &&
          currentNode.typeAliasDef.tsType.kind === "union"
        ) {
          return currentNode.typeAliasDef.tsType.union.map((tsTypeDef) => {
            if (tsTypeDef.kind !== "typeRef") {
              throw new Error(
                `unexpected ts type def kind: ${tsTypeDef.kind}`,
              );
            }

            const currentCurrentNode = findDocNode(
              docNodes,
              { name: tsTypeDef.typeRef.typeName },
            );
            if (
              currentCurrentNode === undefined ||
              currentCurrentNode.kind !== "interface"
            ) {
              throw new Error(
                `node not found for type name: ${tsTypeDef.typeRef.typeName}`,
              );
            }

            return currentCurrentNode.interfaceDef.properties
              .find((property) => property.name === "kind")?.tsType?.repr!;
          });
        }

        throw new Error(`node not found for type name: ${typeName}`);
      });
    }

    if (nodes.every((node) => isEmpty(node))) {
      referenceNodes.delete(key);
    }
  });

  return referenceNodes;
}

// parseTypeReferenceNode parses top-level type references from the given doc node.
function parseTypeReferenceNode(docNode: DocNode): TypeReferenceNode {
  switch (docNode.kind) {
    case "typeAlias": {
      switch (docNode.typeAliasDef.tsType.kind) {
        case "intersection": {
          const typeNames: string[] = [];
          const properties: TypeReferenceNodeInterfaceProperty[] = [];
          for (const tsTypeDef of docNode.typeAliasDef.tsType.intersection) {
            switch (tsTypeDef.kind) {
              case "typeRef": {
                typeNames.push(tsTypeDef.typeRef.typeName);
                break;
              }

              case "typeLiteral": {
                for (const property of tsTypeDef.typeLiteral.properties) {
                  if (property.tsType?.kind !== "typeRef") {
                    continue;
                  }

                  properties.push({
                    multiple: false,
                    optional: property.optional,
                    property: property.name,
                    typeName: property.tsType.typeRef.typeName,
                  });
                }

                break;
              }
            }
          }

          return { typeNames, properties };
        }

        case "union": {
          const typeNames = docNode.typeAliasDef.tsType.union
            .filter((tsTypeDef) => tsTypeDef.kind === "typeRef")
            .map((tsTypeDef) => tsTypeDef.typeRef.typeName);

          // TODO: Add kinds.
          return { typeNames };
        }
      }

      break;
    }

    case "interface": {
      const properties: TypeReferenceNodeInterfaceProperty[] = [];
      for (const interfacePropertyDef of docNode.interfaceDef.properties) {
        switch (interfacePropertyDef.tsType?.kind) {
          case "array": {
            if (interfacePropertyDef.tsType.array.kind !== "typeRef") {
              break;
            }

            properties.push({
              multiple: true,
              optional: interfacePropertyDef.optional,
              property: interfacePropertyDef.name,
              typeName: interfacePropertyDef.tsType.array.typeRef.typeName,
            });

            break;
          }

          case "typeRef": {
            properties.push({
              multiple: false,
              optional: interfacePropertyDef.optional,
              property: interfacePropertyDef.name,
              typeName: interfacePropertyDef.tsType.typeRef.typeName,
            });

            break;
          }
        }
      }

      return { properties };
    }
  }

  throw new Error(`unexpected doc node kind: ${docNode.kind}`);
}

type TypeReferenceNodeMap = Map<string, TypeReferenceNode[]>;

interface TypeReferenceNode {
  typeNames?: string[];
  kinds?: string[][];
  properties?: TypeReferenceNodeInterfaceProperty[];
}

interface TypeReferenceNodeInterfaceProperty {
  optional: boolean;
  multiple: boolean;
  property: string;
  typeName: string;
}

function isEmpty(referenceNode: TypeReferenceNode): boolean {
  return (
    (referenceNode.typeNames === undefined ||
      referenceNode.typeNames.length === 0) &&
    (referenceNode.properties === undefined ||
      referenceNode.properties.length === 0)
  );
}
