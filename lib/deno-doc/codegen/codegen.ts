import type { DocNode } from "@deno/doc";
import { doc } from "@deno/doc";
import { Project } from "ts-morph";
import { readDenoDoc, writeDenoDoc } from "./fs.ts";

const typesDtsURL =
  "https://github.com/denoland/deno_doc/raw/2c0ff7c0eee0ebd8e865ca8284e5e1b03f3f008c/js/types.d.ts";
const downloadTypesDts = false;
const typesDtsFile = new URL(import.meta.resolve("./types.json"));
const typesDtsDocNodes = downloadTypesDts
  ? await doc(typesDtsURL)
  : await readDenoDoc(typesDtsFile);
if (downloadTypesDts) {
  await writeDenoDoc(typesDtsFile, typesDtsDocNodes);
}

if (import.meta.main) {
  const project = new Project();
  const sourceFile = project.createSourceFile(
    "./lib/deno-doc/walk.ts",
    "",
    { overwrite: true },
  );

  sourceFile.addImportDeclaration({
    isTypeOnly: true,
    namedImports: ["DocNode"],
    moduleSpecifier: "@deno/doc",
  });

  const dtsDocNodes = Object.fromEntries(
    typesDtsDocNodes.map((docNode) => [docNode.name, parse(docNode)]),
  );
  await Deno.writeTextFile(
    "./lib/deno-doc/example.json",
    JSON.stringify(dtsDocNodes, null, 2),
  );

  sourceFile.addFunction({
    name: "walk",
    parameters: [{ name: "node", type: "DocNode" }],
    isExported: true,
    statements: [
      `switch (node.kind) {`,
      `}`,
    ],
  });

  // for (const symbol of dts) {
  // }

  await sourceFile.save();
}

// parse parses top-level type references from the given doc node.
function parse(docNode: DocNode): DocNodeTypeReference[] {
  const nodes: DocNodeTypeReference[] = [];
  switch (docNode.kind) {
    case "typeAlias": {
      if (docNode.typeAliasDef.tsType.kind !== "union") {
        break;
      }

      for (const tsTypeDef of docNode.typeAliasDef.tsType.union) {
        if (tsTypeDef.kind !== "typeRef") {
          continue;
        }

        nodes.push({ typeName: tsTypeDef.typeRef.typeName });
      }

      break;
    }

    case "interface": {
      for (const interfacePropertyDef of docNode.interfaceDef.properties) {
        switch (interfacePropertyDef.tsType?.kind) {
          case "array": {
            if (interfacePropertyDef.tsType.array.kind !== "typeRef") {
              break;
            }

            nodes.push({
              multiple: true,
              optional: interfacePropertyDef.optional,
              property: interfacePropertyDef.name,
              typeName: interfacePropertyDef.tsType.array.typeRef.typeName,
            });

            break;
          }

          case "typeRef": {
            nodes.push({
              optional: interfacePropertyDef.optional,
              property: interfacePropertyDef.name,
              typeName: interfacePropertyDef.tsType.typeRef.typeName,
            });

            break;
          }
        }
      }

      break;
    }
  }

  return nodes;
}

interface DocNodeTypeReference {
  optional?: boolean;
  multiple?: boolean;
  property?: string;
  typeName: string;
}
