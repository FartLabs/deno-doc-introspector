import type {
  ClassConstructorDef,
  DocNode,
  DocNodeClass,
  DocNodeEnum,
  DocNodeFunction,
  DocNodeInterface,
  DocNodeTypeAlias,
  InterfaceIndexSignatureDef,
  LiteralMethodDef,
  LiteralPropertyDef,
  TsTypeArrayDef,
  TsTypeConditionalDef,
  TsTypeDef,
  TsTypeDefLiteral,
  TsTypeFnOrConstructorDef,
  TsTypeIntersectionDef,
  TsTypeKeywordDef,
  TsTypeMappedDef,
  TsTypeParenthesizedDef,
  TsTypeRestDef,
  TsTypeThisDef,
  TsTypeTupleDef,
  TsTypeTypeLiteralDef,
  TsTypeTypeOperatorDef,
  TsTypeTypeRefDef,
  TsTypeUnionDef,
} from "@deno/doc";
import { checkRecursive } from "#/lib/deno-doc/check-recursive.ts";

export class TypeScriptToTypeBoxError extends Error {
  constructor() {
    super("");
  }
}

export interface DocNodesToTypeBoxOptions {
  useTypeBoxImport?: boolean;
  useStaticType?: boolean;

  // useExportEverything?: boolean;
  // useIdentifiers?: boolean;
}

// TODO: Migrate to ts-morph for building TypeScript files, once tests pass!
export class DenoDocToTypeBox {
  private typenames = new Set<string>();
  private recursiveDeclaration:
    | DocNodeTypeAlias
    | DocNodeInterface
    | DocNodeClass
    | null = null;
  private useImports = true;
  private useOptions = false;
  private useGenerics = false;
  private useCloneType = false;
  private useTypeBoxImport = true;
  private useStaticType = true;

  public constructor(options?: DocNodesToTypeBoxOptions) {
    this.useTypeBoxImport = options?.useTypeBoxImport ?? true;
    this.useStaticType = options?.useStaticType ?? true;
  }

  // https://github.com/sinclairzx81/typebox-codegen/blob/7a859390ab29032156d8da260038b45cf63fc5a4/src/typescript/typescript-to-typebox.ts#L111
  private isRecursiveType(
    node: DocNodeInterface | DocNodeTypeAlias | DocNodeClass,
  ): boolean {
    return checkRecursive(node);
  }

  private unwrapModifier(type: string) {
    for (let i = 0; i < type.length; i++) {
      if (type[i] === "(") {
        return type.slice(i + 1, type.length - 1);
      }
    }

    return type;
  }

  private unwrapType(type: string): string {
    if (type.startsWith("Type.ReadonlyOptional")) {
      return `Type.ReadonlyOptional(${
        this.unwrapType(this.unwrapModifier(type))
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
    const types = node.tuple
      .map((type) => this.collect(type))
      .join(",\n");
    yield `Type.Tuple([\n${types}\n])`;
  }

  private *unionTypeNode(node: TsTypeUnionDef): IterableIterator<string> {
    const types = node.union
      .map((type) => this.collect(type))
      .join(",\n");
    yield `Type.Union([\n${types}\n])`;
  }

  private *mappedTypeNode(node: TsTypeMappedDef): IterableIterator<string> {
    const K = this.collect(node.mappedType.typeParam.default);
    const T = this.collect(node.mappedType.tsType);
    const C = this.collect(node.mappedType.typeParam.constraint);
    const readonly = node.mappedType.readonly !== undefined;
    const optional = node.mappedType.optional !== undefined;

    // TODO: Add test case with mapped type with readonly and optional.
    const isReadonlyTokenMinus = node.mappedType.readonly?.valueOf() === "-";
    const isQuestionTokenMinus = node.mappedType.optional?.valueOf() === "-";
    const readonlySubtractive = readonly && isReadonlyTokenMinus;
    const optionalSubtractive = optional && isQuestionTokenMinus;
    return yield (
      (readonly && optional)
        ? (
          (readonlySubtractive && optionalSubtractive)
            ? `Type.Mapped(${C}, ${K} => Type.Readonly(Type.Optional(${T}, false), false))`
            : readonlySubtractive
            ? `Type.Mapped(${C}, ${K} => Type.Readonly(Type.Optional(${T}), false))`
            : optionalSubtractive
            ? `Type.Mapped(${C}, ${K} => Type.Readonly(Type.Optional(${T}, false)))`
            : `Type.Mapped(${C}, ${K} => Type.Readonly(Type.Optional(${T})))`
        )
        : readonly
        ? (
          readonlySubtractive
            ? `Type.Mapped(${C}, ${K} => Type.Readonly(${T}, false))`
            : `Type.Mapped(${C}, ${K} => Type.Readonly(${T}))`
        )
        : optional
        ? (
          optionalSubtractive
            ? `Type.Mapped(${C}, ${K} => Type.Optional(${T}, false))`
            : `Type.Mapped(${C}, ${K} => Type.Optional(${T}))`
        )
        : `Type.Mapped(${C}, ${K} => ${T})`
    );
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
      .map((
        parameter,
      ) => (parameter.kind === "rest"
        ? `...Type.Rest(${this.collect(parameter.tsType)})`
        : this.collect(parameter.tsType))
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
    this.useImports = true;
    const exports = node.declarationKind === "export" ? "export " : "";
    const members = node.enumDef.members
      .map((member) => member.name)
      .join(", ");
    const enumType = `${exports}enum Enum${node.name} { ${members} }`;
    const staticType =
      `${exports}type ${node.name} = Static<typeof ${node.name}>`;
    const type = `${exports}const ${node.name} = Type.Enum(Enum${node.name})`;
    yield [enumType, "", this.useStaticType ? staticType : "", type].join("\n");
  }

  private membersFromDefs(
    propertyDefs: LiteralPropertyDef[],
    methodDefs: LiteralMethodDef[],
    indexSignatureDefs: InterfaceIndexSignatureDef[],
    constructorDefs?: ClassConstructorDef[],
  ): string {
    const memberCollect = [
      ...propertyDefs
        .filter((member) => member.tsType?.kind !== "indexedAccess")
        .map((property) =>
          `${property.name}: ${this.literalProperty(property)}`
        ),
      ...methodDefs.map((method) =>
        `${method.name}: ${
          this.collect(
            {
              repr: "",
              kind: "fnOrConstructor",
              fnOrConstructor: {
                constructor: false,
                params: method.params,
                typeParams: method.typeParams,
                tsType: method.returnType!,
              },
            } satisfies TsTypeFnOrConstructorDef,
          )
        }`
      ),
      ...constructorDefs
        ?.slice(0, 1)
        .flatMap((constructorDef) =>
          constructorDef.params
            // Only public constructor params are included in the plain object.
            .filter((param) => param.accessibility === "public")
            .map((param) =>
              //  Why is name not a property of param?
              `${(param as { name: string }).name}: ${
                this.collect(param.tsType)
              }`
            )
            .filter((constructorDef) => constructorDef !== undefined)
        ) ?? [],
    ].join(",\n");

    const indexer = indexSignatureDefs.length > 0
      ? this.collect(indexSignatureDefs.at(-1)?.tsType)
      : "";

    return `{${memberCollect ? `\n${memberCollect}\n` : ""}}${
      indexer ? `,\n{\nadditionalProperties: ${indexer}\n }` : ""
    }`;
  }

  private *typeLiteralNode(
    node: TsTypeTypeLiteralDef,
  ): IterableIterator<string> {
    const members = this.membersFromDefs(
      node.typeLiteral.properties,
      node.typeLiteral.methods,
      node.typeLiteral.indexSignatures,
    );
    yield* `Type.Object(${members})`;
  }

  private *interfaceDeclaration(
    node: DocNodeInterface,
  ): IterableIterator<string> {
    this.useImports = true;

    const isRecursiveType = this.isRecursiveType(node);
    if (isRecursiveType) {
      this.recursiveDeclaration = node;
    }

    const heritage = node.interfaceDef.extends
      .map((node) => this.collect(node));

    if (node.interfaceDef.typeParams.length === 0) {
      const exports = node.declarationKind === "export" ? "export " : "";
      const members = this.membersFromDefs(
        node.interfaceDef.properties,
        node.interfaceDef.methods,
        node.interfaceDef.indexSignatures,
      );
      const staticDeclaration =
        `${exports}type ${node.name} = Static<typeof ${node.name}>`;
      const rawTypeExpression = this.isRecursiveType(node)
        ? `Type.Recursive(This => Type.Object(${members}))`
        : `Type.Object(${members})`;
      const typeExpression = heritage.length === 0
        ? rawTypeExpression
        : `Type.Composite([${heritage.join(", ")}, ${rawTypeExpression}])`;

      const type = this.unwrapType(typeExpression);
      const typeDeclaration = `${exports}const ${node.name} = ${type}`;
      yield `${
        this.useStaticType ? staticDeclaration : ""
      }\n${typeDeclaration}`;
    }

    this.recursiveDeclaration = null;
  }

  private *typeAliasDeclaration(
    node: DocNodeTypeAlias,
  ): IterableIterator<string> {
    this.useImports = true;
    const isRecursiveType = this.isRecursiveType(node);
    if (isRecursiveType) {
      this.recursiveDeclaration = node;
    }

    if (node.typeAliasDef.typeParams.length > 0) {
      this.useGenerics = true;
      const exports = node.declarationKind === "export" ? "export " : "";
      const constraints = node.typeAliasDef.typeParams
        .map((param) => `${param.name} extends TSchema`)
        .join(", ");
      const parameters = node.typeAliasDef.typeParams
        .map((param) => `${param.name}: ${param.name}`)
        .join(", ");
      const type0 = this.collect(node.typeAliasDef.tsType);
      const type1 = isRecursiveType
        ? `Type.Recursive(This => ${type0})`
        : type0;
      const names = node.typeAliasDef.typeParams
        .map((param) => param.name)
        .join(", ");
      const staticDeclaration =
        `${exports}type ${node.name}<${constraints}> = Static<ReturnType<typeof ${node.name}<${names}>>>`;
      const typeDeclaration =
        `${exports}const ${node.name} = <${constraints}>(${parameters}) => ${type1}`;

      yield `${
        this.useStaticType ? staticDeclaration : ""
      }\n${typeDeclaration}`;
    } else {
      const exports = node.declarationKind === "export" ? "export " : "";
      const type0 = this.collect(node.typeAliasDef.tsType);
      const type1 = isRecursiveType
        ? `Type.Recursive(This => ${type0})`
        : type0;
      const staticDeclaration =
        `${exports}type ${node.name} = Static<typeof ${node.name}>`;
      const typeDeclaration = `${exports}const ${node.name} = ${type1}`;

      yield `${
        this.useStaticType ? staticDeclaration : ""
      }\n${typeDeclaration}`;
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

  private *typeReferenceNode(
    node: TsTypeTypeRefDef,
  ): IterableIterator<string> {
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
  ): IterableIterator<string> {
  }

  private *classDeclaration(node: DocNodeClass): IterableIterator<string> {
    this.useImports = true;

    const isRecursiveType = this.isRecursiveType(node);
    if (isRecursiveType) {
      this.recursiveDeclaration = node;
    }

    if (node.classDef.typeParams.length === 0) {
      const exports = node.declarationKind === "export" ? "export " : "";
      const members = this.membersFromDefs(
        node.classDef.properties as unknown as LiteralPropertyDef[],
        node.classDef.methods as unknown as LiteralMethodDef[],
        node.classDef.indexSignatures,
        node.classDef.constructors,
      );

      const staticDeclaration =
        `${exports}type ${node.name} = Static<typeof ${node.name}>`;
      const typeExpression = this.isRecursiveType(node)
        ? `Type.Recursive(This => Type.Object(${members}))`
        : `Type.Object(${members})`;

      const type = this.unwrapType(typeExpression);
      const typeDeclaration = `${exports}const ${node.name} = ${type}`;
      yield `${
        this.useStaticType ? staticDeclaration : ""
      }\n${typeDeclaration}`;
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

  private collect(node: DocNode | TsTypeDef | undefined): string {
    return `${[...this.visit(node)].join("")}`;
  }

  private *visit(
    node: DocNode | TsTypeDef | undefined,
  ): IterableIterator<string> {
    if (node === undefined) {
      return;
    }

    switch (node.kind) {
      case "array": {
        return yield* this.arrayTypeNode(node);
      }
      case "conditional": {
        return yield* this.conditionalTypeNode(node);
      }
      case "fnOrConstructor": {
        return yield* node.fnOrConstructor.constructor
          ? this.constructorTypeNode(node)
          : this.functionTypeNode(node);
      }
      case "enum": {
        return yield* this.enumDeclaration(node);
      }
      case "interface": {
        return yield* this.interfaceDeclaration(node);
      }
      case "literal": {
        return yield* this.literalTypeNode(node);
      }
      case "intersection": {
        return yield* this.intersectionTypeNode(node);
      }
      case "union": {
        return yield* this.unionTypeNode(node);
      }
      case "mapped": {
        return yield* this.mappedTypeNode(node);
      }
      case "parenthesized": {
        return yield* this.parenthesizedTypeNode(node);
      }
      case "rest": {
        return yield* this.restTypeNode(node);
      }
      case "tuple": {
        return yield* this.tupleTypeNode(node);
      }
      case "this": {
        return yield* this.thisTypeNode(node);
      }
      case "typeAlias": {
        return yield* this.typeAliasDeclaration(node);
      }
      case "typeLiteral": {
        return yield* this.typeLiteralNode(node);
      }
      case "typeOperator": {
        return yield* this.typeOperatorNode(node);
      }
      case "typeRef": {
        return yield* this.typeReferenceNode(node);
      }
      case "keyword": {
        return yield* this.keywordNode(node);
      }
      case "function": {
        return yield* this.functionDeclaration(node);
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

  private importStatement(): string {
    if (!(this.useImports && this.useTypeBoxImport)) {
      return "";
    }

    const set = new Set<string>(["Type"]);
    if (this.useStaticType) {
      set.add("Static");
    }

    if (this.useGenerics) {
      set.add("TSchema");
    }

    if (this.useOptions) {
      set.add("SchemaOptions");
    }

    if (this.useCloneType) {
      set.add("CloneType");
    }

    const imports = [...set].join(", ");
    return `import { ${imports} } from '@sinclair/typebox'`;
  }

  public generate(nodes: DocNode[]): string {
    this.typenames.clear();
    this.useImports = false;
    this.useOptions = false;
    this.useGenerics = false;
    this.useCloneType = false;
    const declarations = nodes
      .flatMap((node) => [...this.visit(node)])
      .join("\n\n");
    const imports = this.importStatement();
    const typescript = [imports, "", "", declarations].join("\n");
    return typescript;
  }
}
