import type {
  ClassConstructorDef,
  DocNode,
  DocNodeClass,
  DocNodeEnum,
  DocNodeFunction,
  DocNodeInterface,
  DocNodeTypeAlias,
  InterfaceIndexSignatureDef,
  LiteralPropertyDef,
  TsTypeArrayDef,
  TsTypeConditionalDef,
  TsTypeDef,
  TsTypeDefLiteral,
  TsTypeFnOrConstructorDef,
  TsTypeIntersectionDef,
  TsTypeKeywordDef,
  TsTypeParenthesizedDef,
  TsTypeRestDef,
  TsTypeThisDef,
  TsTypeTupleDef,
  TsTypeTypeLiteralDef,
  TsTypeTypeOperatorDef,
  TsTypeTypeRefDef,
  TsTypeUnionDef,
} from "@deno/doc";
import type { SourceFile } from "ts-morph";
import { checkRecursive } from "#/lib/deno-doc/check-recursive.ts";
import { renderTsTypeDef } from "#/lib/deno-doc/ts-type.ts";

export interface DocNodesToClassOptions {
  generateOptions?: (
    node: DocNodeInterface | DocNodeTypeAlias | DocNodeClass,
  ) => DocNodeToClassOptions | undefined;
}

export interface DocNodeToClassOptions {
  decorators?: string;
}

export class DenoDocToClass {
  private recursiveDeclaration:
    | DocNodeTypeAlias
    | DocNodeInterface
    | DocNodeClass
    | null = null;

  public constructor(public options?: DocNodesToClassOptions) {}

  private isRecursiveType(
    node: DocNodeInterface | DocNodeTypeAlias | DocNodeClass,
  ): boolean {
    return checkRecursive(node);
  }

  private unwrapModifier(typeString: string) {
    for (let i = 0; i < typeString.length; i++) {
      if (typeString[i] === "(") {
        return typeString.slice(i + 1, typeString.length - 1);
      }
    }

    return typeString;
  }

  private unwrapType(type: string): string {
    if (type.startsWith("Type.ReadonlyOptional")) {
      return `Type.ReadonlyOptional(${
        this.unwrapType(
          this.unwrapModifier(type),
        )
      })`;
    }

    if (type.startsWith("Type.Readonly")) {
      return `Type.Readonly(${this.unwrapType(this.unwrapModifier(type))})`;
    }

    if (type.startsWith("Type.Optional")) {
      return `Type.Optional(${this.unwrapType(this.unwrapModifier(type))})`;
    }

    return type;
  }

  private *arrayTypeNode(node: TsTypeArrayDef): IterableIterator<string> {
    const type = this.collect(node);
    yield `Type.Array(${type})`;
  }

  private *tupleTypeNode(node: TsTypeTupleDef): IterableIterator<string> {
    const types = node.tuple.map((type) => this.collect(type)).join(",\n");
    yield `Type.Tuple([\n${types}\n])`;
  }

  private *unionTypeNode(node: TsTypeUnionDef): IterableIterator<string> {
    const types = node.union.map((type) => this.collect(type)).join(",\n");
    yield `Type.Union([\n${types}\n])`;
  }

  private *thisTypeNode(_node: TsTypeThisDef) {
    yield `This`;
  }

  private *intersectionTypeNode(
    node: TsTypeIntersectionDef,
  ): IterableIterator<string> {
    const types = node.intersection
      .map((typeDef) => this.collect(typeDef))
      .join(",\n");
    yield `Type.Intersect([\n${types}\n])`;
  }

  private *typeOperatorNode(
    node: TsTypeTypeOperatorDef,
  ): IterableIterator<string> {
    if (node.typeOperator.operator === "keyof") {
      const type = this.collect(node.typeOperator.tsType);
      yield `Type.KeyOf(${type})`;
    }

    if (node.typeOperator.operator === "readonly") {
      yield `Type.Readonly(${this.collect(node.typeOperator.tsType)})`;
    }
  }

  private literalProperty(node: LiteralPropertyDef): string {
    return node.optional
      ? `Type.Optional(${this.collect(node.tsType)})`
      : this.collect(node.tsType);
  }

  private *functionTypeNode(
    node: TsTypeFnOrConstructorDef,
  ): IterableIterator<string> {
    const parameters = node.fnOrConstructor.params
      .map((parameter) =>
        parameter.kind === "rest"
          ? `...Type.Rest(${this.collect(parameter.tsType)})`
          : this.collect(parameter.tsType)
      )
      .join(", ");
    const returns = node.fnOrConstructor.tsType
      ? this.collect(node.fnOrConstructor.tsType)
      : "Type.Unknown()";
    yield `Type.Function([${parameters}], ${returns})`;
  }

  private *constructorTypeNode(
    node: TsTypeFnOrConstructorDef,
  ): IterableIterator<string> {
    const parameters = node.fnOrConstructor.params
      .map((param) => this.collect(param.tsType))
      .join(", ");
    const returns = this.collect(node.fnOrConstructor.tsType);
    yield `Type.Constructor([${parameters}], ${returns})`;
  }

  private *enumDeclaration(node: DocNodeEnum): IterableIterator<string> {
    // this.useImports = true;
    const exports = node.declarationKind === "export" ? "export " : "";
    const members = node.enumDef.members
      .map((member) => member.name)
      .join(", ");
    const enumType = `${exports}enum Enum${node.name} { ${members} }`;
    // const staticType = `${exports}type ${node.name} = Static<typeof ${node.name}>`;
    const type = `${exports}const ${node.name} = Type.Enum(Enum${node.name})`;
    yield [
      enumType,
      "",
      //  this.useStaticType  ? staticType : "",
      type,
    ].join("\n");
  }

  private membersFromDefs(
    propertyDefs: LiteralPropertyDef[],
    _indexSignatureDefs: InterfaceIndexSignatureDef[],
    constructorDefs?: ClassConstructorDef[],
  ): Array<[string, string, boolean]> {
    return [
      ...propertyDefs
        .filter((member) => member.tsType?.kind !== "indexedAccess")
        .map((property): [string, string, boolean] => {
          return [
            property.name,
            property.tsType !== undefined
              ? renderTsTypeDef(property.tsType)
              : "",
            property.optional,
          ];
        }),
      ...(constructorDefs?.slice(0, 1).flatMap((constructorDef) =>
        constructorDef.params
          // Only public constructor params are included in the plain object.
          .filter((param) => param.accessibility === "public")
          .map((param): [string, string, boolean] => {
            if (param.tsType === undefined) {
              throw new Error("Expected defined tsType.");
            }

            return [
              // Why is name not a property of param?
              (param as { name: string }).name,
              param.tsType !== undefined ? renderTsTypeDef(param.tsType) : "",
              // Why is optional not a property of param?
              (param as { optional: boolean })?.optional, // ?? false,
            ];
          })
          .filter((constructorDef) => constructorDef !== undefined)
      ) ?? []),
    ];
  }

  private *typeLiteralNode(
    node: TsTypeTypeLiteralDef,
  ): IterableIterator<string> {
    const members = this.membersFromDefs(
      node.typeLiteral.properties,
      node.typeLiteral.indexSignatures,
    );
    yield* `Type.Object(${members})`;
  }

  private *interfaceDeclaration(
    node: DocNodeInterface,
  ): IterableIterator<string> {
    const isRecursiveType = this.isRecursiveType(node);
    if (isRecursiveType) {
      this.recursiveDeclaration = node;
    }

    // const heritage = node.interfaceDef.extends
    //   .map((node) => this.collect(node));
    if (node.interfaceDef.typeParams.length === 0) {
      const nodeOptions = this.options?.generateOptions?.(node);
      const decorators = nodeOptions?.decorators !== undefined
        ? `${nodeOptions.decorators}\n`
        : "";
      const exports = node.declarationKind === "export" ? "export " : "";
      const members = this.membersFromDefs(
        node.interfaceDef.properties,
        node.interfaceDef.indexSignatures,
      );
      if (members.length === 0) {
        return `${decorators}${exports}class ${node.name} {}`;
      }

      // const rawTypeExpression = this.isRecursiveType(node)
      //   ? `Type.Recursive(This => Type.Object(${members}))`
      //   : `Type.Object(${members})`;
      // const typeExpression = heritage.length === 0
      //   ? rawTypeExpression
      //   : `Type.Composite([${heritage.join(", ")}, ${rawTypeExpression}])`;
      // const type = this.unwrapType(typeExpression);

      const typeDeclaration = `${decorators}${exports}class ${node.name} {
${
        members
          .map(
            ([memberName, memberType, memberOptional]) =>
              `  public ${memberName}${
                memberOptional ? "?" : ""
              }: ${memberType};\n`,
          )
          .join("")
      }
  public constructor(data: ${node.name}) {
${
        members
          .map(([memberName]) => `    this.${memberName} = data.${memberName};`)
          .join("\n")
      }
  }
}`;
      yield typeDeclaration;
    }

    this.recursiveDeclaration = null;
  }

  private *typeAliasDeclaration(
    node: DocNodeTypeAlias,
  ): IterableIterator<string> {
    const isRecursiveType = this.isRecursiveType(node);
    if (isRecursiveType) {
      this.recursiveDeclaration = node;
    }

    if (node.typeAliasDef.typeParams.length > 0) {
      // const exports = node.declarationKind === "export" ? "export " : "";
      // const constraints = node.typeAliasDef.typeParams
      //   .map((param) => `${param.name} extends TSchema`)
      //   .join(", ");
      // const parameters = node.typeAliasDef.typeParams
      //   .map((param) => `${param.name}: ${param.name}`)
      //   .join(", ");
      // const type0 = this.collect(node.typeAliasDef.tsType);
      // const type1 = isRecursiveType
      //   ? `Type.Recursive(This => ${type0})`
      //   : type0;
      // const typeDeclaration =
      //   `${exports}const ${node.name} = <${constraints}>(${parameters}) => ${type1}`;
      // yield typeDeclaration;
      yield "todo";
    } else {
      const exports = node.declarationKind === "export" ? "export " : "";
      // const type0 = this.collect(node.typeAliasDef.tsType);
      // const type1 = isRecursiveType
      //   ? `Type.Recursive(This => ${type0})`
      //   : type0;
      // const staticDeclaration =
      //   `${exports}type ${node.name} = Static<typeof ${node.name}>`;
      const typeDeclaration = `${exports}class ${node.name} {}`;
      yield typeDeclaration;
    }

    this.recursiveDeclaration = null;
  }

  private *parenthesizedTypeNode(
    node: TsTypeParenthesizedDef,
  ): IterableIterator<string> {
    yield this.collect(node.parenthesized);
  }

  private *restTypeNode(node: TsTypeRestDef): IterableIterator<string> {
    yield `...Type.Rest(${node.repr})`;
  }

  private *conditionalTypeNode(
    node: TsTypeConditionalDef,
  ): IterableIterator<string> {
    const checkType = this.collect(node.conditionalType.checkType);
    const extendsType = this.collect(node.conditionalType.extendsType);
    const trueType = this.collect(node.conditionalType.trueType);
    const falseType = this.collect(node.conditionalType.falseType);
    yield `Type.Extends(${checkType}, ${extendsType}, ${trueType}, ${falseType})`;
  }

  private *typeReferenceNode(node: TsTypeTypeRefDef): IterableIterator<string> {
    const name = node.typeRef.typeName;
    const args = node.typeRef.typeParams !== undefined
      ? `(${
        node.typeRef.typeParams
          .map((typeParam) => this.collect(typeParam))
          .join(", ")
      })`
      : "";

    switch (name) {
      case "Date": {
        return yield `Type.Date()`;
      }
      case "Uint8Array": {
        return yield `Type.Uint8Array()`;
      }
      case "String": {
        return yield `Type.String()`;
      }
      case "Number": {
        return yield `Type.Number()`;
      }
      case "Boolean": {
        return yield `Type.Boolean()`;
      }
      case "Function": {
        return yield `Type.Function([], Type.Unknown())`;
      }
      case "Array": {
        return yield `Type.Array${args}`;
      }
      case "Record": {
        return yield `Type.Record${args}`;
      }
      case "Partial": {
        return yield `Type.Partial${args}`;
      }
      case "Required": {
        return yield `Type.Required${args}`;
      }
      case "Omit": {
        return yield `Type.Omit${args}`;
      }
      case "Pick": {
        return yield `Type.Pick${args}`;
      }
      case "Promise": {
        return yield `Type.Promise${args}`;
      }
      case "ReturnType": {
        return yield `Type.ReturnType${args}`;
      }
      case "InstanceType": {
        return yield `Type.InstanceType${args}`;
      }
      case "Parameters": {
        return yield `Type.Parameters${args}`;
      }
      case "AsyncIterableIterator": {
        return yield `Type.AsyncIterator${args}`;
      }
      case "IterableIterator": {
        return yield `Type.Iterator${args}`;
      }
      case "ConstructorParameters": {
        return yield `Type.ConstructorParameters${args}`;
      }
      case "Exclude": {
        return yield `Type.Exclude${args}`;
      }
      case "Extract": {
        return yield `Type.Extract${args}`;
      }
      case "Awaited": {
        return yield `Type.Awaited${args}`;
      }
      case "Uppercase": {
        return yield `Type.Uppercase${args}`;
      }
      case "Lowercase": {
        return yield `Type.Lowercase${args}`;
      }
      case "Capitalize": {
        return yield `Type.Capitalize${args}`;
      }
      case "Uncapitalize": {
        return yield `Type.Uncapitalize${args}`;
      }
      default: {
        if (
          this.recursiveDeclaration !== null &&
          this.recursiveDeclaration.name === node.typeRef.typeName
        ) {
          return yield `This`;
        }

        if (name in globalThis) {
          return yield `Type.Never()`;
        }

        return yield `${name}${args}`;
      }
    }
  }

  private *literalTypeNode(node: TsTypeDefLiteral): IterableIterator<string> {
    if (node.repr === "null") {
      return yield `Type.Null()`;
    }

    yield `Type.Literal(${node.repr})`;
  }

  private *functionDeclaration(
    _node: DocNodeFunction,
  ): IterableIterator<string> {}

  private *classDeclaration(node: DocNodeClass): IterableIterator<string> {
    const isRecursiveType = this.isRecursiveType(node);
    if (isRecursiveType) {
      this.recursiveDeclaration = node;
    }

    if (node.classDef.typeParams.length === 0) {
      const exports = node.declarationKind === "export" ? "export " : "";
      // const members = this.membersFromDefs(
      //   node.classDef.properties as unknown as LiteralPropertyDef[],
      //   node.classDef.indexSignatures,
      //   node.classDef.constructors,
      // );
      // const typeExpression = this.isRecursiveType(node)
      //   ? `Type.Recursive(This => Type.Object(${members}))`
      //   : `Type.Object(${members})`;
      // const type = this.unwrapType(typeExpression);
      const typeDeclaration = `${exports}class ${node.name} {}`;
      yield typeDeclaration;
    }

    this.recursiveDeclaration = null;
  }

  private *keywordNode(node: TsTypeKeywordDef): IterableIterator<string> {
    switch (node.keyword) {
      case "string": {
        return yield `Type.String()`;
      }
      case "number": {
        return yield `Type.Number()`;
      }
      case "boolean": {
        return yield `Type.Boolean()`;
      }
      case "null": {
        return yield `Type.Null()`;
      }
      case "undefined": {
        return yield `Type.Undefined()`;
      }
      case "unknown": {
        return yield `Type.Unknown()`;
      }
      case "void": {
        return yield `Type.Void()`;
      }
      case "never": {
        return yield `Type.Never()`;
      }
      case "bigint": {
        return yield `Type.BigInt()`;
      }
      case "any": {
        return yield `Type.Any()`;
      }
      case "symbol": {
        return yield `Type.Symbol()`;
      }
      case "keyof": {
        return yield `Type.KeyOf()`;
      }

      default: {
        throw new Error(`Unhandled keyword: ${node.keyword}`);
      }
    }
  }

  private *visit(
    node: DocNode | TsTypeDef | undefined,
  ): IterableIterator<string> {
    if (node === undefined) {
      return;
    }

    switch (node.kind) {
      // case "array": {
      //   return yield* this.arrayTypeNode(node);
      // }
      // case "conditional": {
      //   return yield* this.conditionalTypeNode(node);
      // }
      // case "fnOrConstructor": {
      //   return yield* node.fnOrConstructor.constructor
      //     ? this.constructorTypeNode(node)
      //     : this.functionTypeNode(node);
      // }
      // case "enum": {
      //   return yield* this.enumDeclaration(node);
      // }
      case "interface": {
        return yield* this.interfaceDeclaration(node);
      }
      // case "literal": {
      //   return yield* this.literalTypeNode(node);
      // }
      // case "intersection": {
      //   return yield* this.intersectionTypeNode(node);
      // }
      // case "union": {
      //   return yield* this.unionTypeNode(node);
      // }
      // case "parenthesized": {
      //   return yield* this.parenthesizedTypeNode(node);
      // }
      // case "rest": {
      //   return yield* this.restTypeNode(node);
      // }
      // case "tuple": {
      //   return yield* this.tupleTypeNode(node);
      // }
      // case "this": {
      //   return yield* this.thisTypeNode(node);
      // }
      case "typeAlias": {
        return yield* this.typeAliasDeclaration(node);
      }
      // case "typeLiteral": {
      //   return yield* this.typeLiteralNode(node);
      // }
      // case "typeOperator": {
      //   return yield* this.typeOperatorNode(node);
      // }
      // case "typeRef": {
      //   return yield* this.typeReferenceNode(node);
      // }
      // case "keyword": {
      //   return yield* this.keywordNode(node);
      // }
      // case "function": {
      //   return yield* this.functionDeclaration(node);
      // }
      case "class": {
        return yield* this.classDeclaration(node);
      }

      default: {
        console.warn("Unhandled:", node);
        // throw new Error(`Unhandled node: ${node.kind}`);
      }
    }
  }

  private collect(node: DocNode | TsTypeDef | undefined): string {
    return `${[...this.visit(node)].join("")}`;
  }

  public generate(sourceFile: SourceFile, nodes: DocNode[]): void {
    nodes.flatMap((node) =>
      sourceFile.addStatements(Array.from(this.visit(node)))
    );

    // TODO: Add imports to sourceFile.
  }
}
