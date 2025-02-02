import type {
  ClassConstructorDef,
  DocNode,
  DocNodeClass,
  DocNodeInterface,
  DocNodeTypeAlias,
  InterfaceIndexSignatureDef,
  LiteralPropertyDef,
  TsTypeDef,
} from "@deno/doc";
import type { SourceFile } from "ts-morph";
import { renderTsTypeDef } from "#/lib/deno-doc/ts-type.ts";

export type DocNodeStructure =
  | DocNodeInterface
  | DocNodeTypeAlias
  | DocNodeClass;

export interface DocNodesToClassOptions {
  generateOptions?: (
    node: DocNodeStructure
  ) => DocNodeToClassOptions | undefined;
}

export interface DocNodeToClassOptions {
  decorators?: string;
}

export class DenoDocToClass {
  public constructor(public options?: DocNodesToClassOptions) {}

  private membersFromDefs(
    propertyDefs: LiteralPropertyDef[],
    _indexSignatureDefs: InterfaceIndexSignatureDef[],
    constructorDefs?: ClassConstructorDef[]
  ): Array<{ name: string; type: string; optional: boolean }> {
    const propertyMembers = propertyDefs
      .filter((member) => member.tsType?.kind !== "indexedAccess")
      .map((property): { name: string; type: string; optional: boolean } => ({
        name: property.name,
        type: property.tsType ? renderTsTypeDef(property.tsType) : "",
        optional: property.optional,
      }));

    const constructorMembers =
      constructorDefs?.slice(0, 1).flatMap((constructorDef) =>
        constructorDef.params
          .filter((param) => param.accessibility === "public")
          .map((param): { name: string; type: string; optional: boolean } => {
            if (!param.tsType) {
              throw new Error("Expected defined tsType.");
            }

            // Type assertion is still needed if the types don't actually have these properties
            const paramWithName = param as { name: string };
            const paramWithOptional = param as { optional: boolean };

            return {
              name: paramWithName.name,
              type: renderTsTypeDef(param.tsType),
              optional: paramWithOptional.optional ?? false, // Provide a default value
            };
          })
      ) ?? [];

    return [...propertyMembers, ...constructorMembers];
  }

  private *interfaceDeclaration(
    node: DocNodeInterface
  ): IterableIterator<string> {
    if (node.interfaceDef.typeParams.length === 0) {
      const nodeOptions = this.options?.generateOptions?.(node);
      const decorators =
        nodeOptions?.decorators !== undefined
          ? `${nodeOptions.decorators}\n`
          : "";
      const exports = node.declarationKind === "export" ? "export " : "";
      const members = this.membersFromDefs(
        node.interfaceDef.properties,
        node.interfaceDef.indexSignatures
      );
      if (members.length === 0) {
        return `${decorators}${exports}class ${node.name} {}`;
      }
      const extendsString = node.interfaceDef.extends
        .map((tsTypeDef) => renderTsTypeDef(tsTypeDef))
        .join(", ");
      const typeDeclaration = `${decorators}${exports}class ${node.name}${
        extendsString.length > 0 ? ` extends ${extendsString}` : ""
      } {
${members
  .map(
    (member) =>
      `  public ${member.name}${member.optional ? "?" : ""}: ${member.type};\n`
  )
  .join("")}
  public constructor(data: ${node.name}) {
${members
  .map((member) => `    this.${member.name} = data.${member.name};`)
  .join("\n")}
  }
}`;
      yield typeDeclaration;
    }
  }

  private *typeAliasDeclaration(
    node: DocNodeTypeAlias
  ): IterableIterator<string> {
    if (node.typeAliasDef.typeParams.length > 0) {
      yield "todo";
    } else {
      const exports = node.declarationKind === "export" ? "export " : "";
      const typeDeclaration = `${exports}class ${node.name} {}`;
      yield typeDeclaration;
    }
  }

  private *classDeclaration(node: DocNodeClass): IterableIterator<string> {
    if (node.classDef.typeParams.length === 0) {
      const exports = node.declarationKind === "export" ? "export " : "";
      const typeDeclaration = `${exports}class ${node.name} {}`;
      yield typeDeclaration;
    }
  }

  private *visit(
    node: DocNode | TsTypeDef | undefined
  ): IterableIterator<string> {
    if (node === undefined) {
      return;
    }

    switch (node.kind) {
      case "interface": {
        return yield* this.interfaceDeclaration(node);
      }
      case "typeAlias": {
        return yield* this.typeAliasDeclaration(node);
      }
      case "class": {
        return yield* this.classDeclaration(node);
      }

      default: {
        console.warn("Unhandled:", node);
        // throw new Error(`Unhandled node: ${node.kind}`);
      }
    }
  }

  public generate(sourceFile: SourceFile, nodes: DocNode[]): void {
    nodes.flatMap((node) =>
      sourceFile.addStatements(Array.from(this.visit(node)))
    );

    // TODO: Add imports to sourceFile.
  }
}
