import * as ts from "typescript";
import type {
  DocNode,
  TsTypeArrayDef,
  TsTypeConditionalDef,
  TsTypeDef,
  TsTypeFnOrConstructorDef,
} from "@deno/doc";

export class TypeScriptToTypeBoxError extends Error {
  constructor(public readonly diagnostics: ts.Diagnostic[]) {
    super("");
  }
}

export interface DocNodesToTypeBoxOptions {
  useExportEverything?: boolean;
  useTypeBoxImport?: boolean;
  useIdentifiers?: boolean;

  // TODO: Add option useStaticType.
}

export class DocNodesToTypeBox {
  private typenames = new Set<string>();
  private recursiveDeclaration:
    | ts.TypeAliasDeclaration
    | ts.InterfaceDeclaration
    | null = null;
  private blockLevel = 0;
  private useImports = false;
  private useOptions = false;
  private useGenerics = false;
  private useCloneType = false;
  private useExportsEverything = false;
  private useIdentifiers = false;
  private useTypeBoxImport = true;

  public constructor(options?: DocNodesToTypeBoxOptions) {
    this.useExportsEverything = options?.useExportEverything ?? false;
    this.useIdentifiers = options?.useIdentifiers ?? false;
    this.useTypeBoxImport = options?.useTypeBoxImport ?? true;
  }

  private findRecursiveParent(
    decl: ts.InterfaceDeclaration | ts.TypeAliasDeclaration,
    node: ts.Node,
  ): boolean {
    return (ts.isTypeReferenceNode(node) &&
      decl.name.getText() === node.typeName.getText()) ||
      node.getChildren().some((node) => this.findRecursiveParent(decl, node));
  }

  private findRecursiveThis(node: ts.Node): boolean {
    return node.getChildren().some((node) =>
      ts.isThisTypeNode(node) || this.findRecursiveThis(node)
    );
  }

  private findTypeName(node: ts.Node, name: string): boolean {
    const found = this.typenames.has(name) ||
      node.getChildren().some((node) => {
        return ((ts.isInterfaceDeclaration(node) ||
          ts.isTypeAliasDeclaration(node)) && node.name.getText() === name) ||
          this.findTypeName(node, name);
      });
    if (found) this.typenames.add(name);
    return found;
  }

  private isRecursiveType(
    decl: ts.InterfaceDeclaration | ts.TypeAliasDeclaration,
  ) {
    const check1 = ts.isTypeAliasDeclaration(decl)
      ? [decl.type].some((node) => this.findRecursiveParent(decl, node))
      : decl.members.some((node) => this.findRecursiveParent(decl, node));
    const check2 = ts.isInterfaceDeclaration(decl) &&
      this.findRecursiveThis(decl);
    return check1 || check2;
  }

  private isReadonlyProperty(node: ts.PropertySignature): boolean {
    return node.modifiers !== undefined &&
      node.modifiers.find((modifier) => modifier.getText() === "readonly") !==
        undefined;
  }

  private isOptionalProperty(node: ts.PropertySignature) {
    return node.questionToken !== undefined;
  }

  private isOptionalParameter(node: ts.ParameterDeclaration) {
    return node.questionToken !== undefined;
  }

  private isExport(
    node:
      | ts.InterfaceDeclaration
      | ts.TypeAliasDeclaration
      | ts.EnumDeclaration
      | ts.ModuleDeclaration,
  ): boolean {
    return this.blockLevel === 0 &&
      (this.useExportsEverything ||
        (node.modifiers !== undefined &&
          node.modifiers.find((modifier) => modifier.getText() === "export") !==
            undefined));
  }

  private isNamespace(node: ts.ModuleDeclaration) {
    return node.flags === ts.NodeFlags.Namespace;
  }

  private resolveJsDocComment(
    node:
      | ts.TypeAliasDeclaration
      | ts.PropertySignature
      | ts.InterfaceDeclaration,
  ): string {
    const content = node.getFullText().trim();
    const indices = [
      content.indexOf("/**"),
      content.indexOf("type"),
      content.indexOf("interface"),
    ].map((n) => (n === -1 ? Infinity : n));
    if (
      indices[0] === -1 || indices[1] < indices[0] || indices[2] < indices[0]
    ) {
      return ""; // no comment or declaration before comment
    }
    for (let i = indices[0]; i < content.length; i++) {
      if (content[i] === "*" && content[i + 1] === "/") {
        return content.slice(0, i + 2);
      }
    }
    return "";
  }

  private resolveOptions(
    _node:
      | ts.TypeAliasDeclaration
      | ts.PropertySignature
      | ts.InterfaceDeclaration,
  ): Record<string, unknown> {
    // console.info({ resolveOptions: _node });
    return {};
    // const content = this.resolveJsDocComment(node);
    // return JsDoc.Parse(content);
  }

  private resolveIdentifier(
    node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration,
  ) {
    function* resolve(node: ts.Node): IterableIterator<string> {
      if (node.parent) yield* resolve(node.parent);
      if (ts.isModuleDeclaration(node)) yield node.name.getText();
    }
    return [...resolve(node), node.name.getText()].join(".");
  }

  private unwrapModifier(type: string) {
    for (let i = 0; i < type.length; i++) {
      if (type[i] === "(") return type.slice(i + 1, type.length - 1);
    }
    return type;
  }

  private injectOptions(
    type: string,
    options: Record<string, unknown>,
  ): string {
    if (globalThis.Object.keys(options).length === 0) return type;
    if (type.indexOf("Type.ReadonlyOptional") === 0) {
      return `Type.ReadonlyOptional(${
        this.injectOptions(this.unwrapModifier(type), options)
      })`;
    }
    if (type.indexOf("Type.Readonly") === 0) {
      return `Type.Readonly(${
        this.injectOptions(this.unwrapModifier(type), options)
      })`;
    }
    if (type.indexOf("Type.Optional") === 0) {
      return `Type.Optional(${
        this.injectOptions(this.unwrapModifier(type), options)
      })`;
    }
    const encoded = JSON.stringify(options);
    if (type.lastIndexOf("]") === type.length - 1) this.useCloneType = true;
    if (type.lastIndexOf("]") === type.length - 1) {
      return `CloneType(${type}, ${encoded})`;
    }
    if (type.indexOf("(") === -1) {
      this.useCloneType = true;
      return `CloneType(${type}, ${encoded})`;
    }
    if (type.lastIndexOf("()") === type.length - 2) {
      return type.slice(0, type.length - 1) + `${encoded})`;
    }
    if (type.lastIndexOf("})") === type.length - 2) {
      return type.slice(0, type.length - 1) + `, ${encoded})`;
    }
    if (type.lastIndexOf("])") === type.length - 2) {
      return type.slice(0, type.length - 1) + `, ${encoded})`;
    }
    if (type.lastIndexOf(")") === type.length - 1) {
      return type.slice(0, type.length - 1) + `, ${encoded})`;
    }
    return type;
  }

  private *sourceFile(nodes: DocNode[]): IterableIterator<string> {
    for (const node of nodes) {
      yield* this.visit(node);
    }
  }

  private *propertySignature(
    node: ts.PropertySignature,
  ): IterableIterator<string> {
    const [readonly, optional] = [
      this.isReadonlyProperty(node),
      this.isOptionalProperty(node),
    ];
    const options = this.resolveOptions(node);
    const type_0 = this.collect(node.type);
    const type_1 = this.injectOptions(type_0, options);
    if (readonly && optional) {
      return yield `${node.name.getText()}: Type.ReadonlyOptional(${type_1})`;
    } else if (readonly) {
      return yield `${node.name.getText()}: Type.Readonly(${type_1})`;
    } else if (optional) {
      return yield `${node.name.getText()}: Type.Optional(${type_1})`;
    } else {
      return yield `${node.name.getText()}: ${type_1}`;
    }
  }

  private *arrayTypeNode(node: TsTypeArrayDef): IterableIterator<string> {
    const type = this.collect(node.elementType);
    yield `Type.Array(${type})`;
  }

  private *block(node: ts.Block): IterableIterator<string> {
    this.blockLevel += 1;
    const statements = node.statements.map((statement) =>
      this.collect(statement)
    ).join("\n\n");
    this.blockLevel -= 1;
    yield `{\n${statements}\n}`;
  }

  private *tupleTypeNode(node: ts.TupleTypeNode): IterableIterator<string> {
    const types = node.elements.map((type) => this.collect(type)).join(",\n");
    yield `Type.Tuple([\n${types}\n])`;
  }

  private *unionTypeNode(node: ts.UnionTypeNode): IterableIterator<string> {
    const types = node.types.map((type) => this.collect(type)).join(",\n");
    yield `Type.Union([\n${types}\n])`;
  }

  private *mappedTypeNode(node: ts.MappedTypeNode): IterableIterator<string> {
    const K = this.collect(node.typeParameter);
    const T = this.collect(node.type);
    const C = this.collect(node.typeParameter.constraint);
    const readonly = node.readonlyToken !== undefined;
    const optional = node.questionToken !== undefined;
    const readonlySubtractive = readonly && ts.isMinusToken(node.readonlyToken);
    const optionalSubtractive = optional && ts.isMinusToken(node.questionToken);
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

  private *methodSignature(node: ts.MethodSignature): IterableIterator<string> {
    const parameters = node.parameters.map((
      parameter,
    ) => (parameter.dotDotDotToken !== undefined
      ? `...Type.Rest(${this.collect(parameter)})`
      : this.collect(parameter))
    ).join(", ");
    const returnType = node.type === undefined
      ? `Type.Unknown()`
      : this.collect(node.type);
    yield `${node.name.getText()}: Type.Function([${parameters}], ${returnType})`;
  }

  private *templateLiteralTypeNode(node: ts.TemplateLiteralTypeNode) {
    const collect = node.getChildren().map((node) => this.collect(node)).join(
      "",
    );
    yield `Type.TemplateLiteral([${collect.slice(0, collect.length - 2)}])`;
  }

  private *templateLiteralTypeSpan(node: ts.TemplateLiteralTypeSpan) {
    const collect = node.getChildren().map((node) => this.collect(node)).join(
      ", ",
    );
    if (collect.length > 0) yield `${collect}`;
  }

  private *templateHead(node: ts.TemplateHead) {
    if (node.text.length > 0) yield `Type.Literal('${node.text}'), `;
  }

  private *templateMiddle(node: ts.TemplateMiddle) {
    if (node.text.length > 0) yield `Type.Literal('${node.text}'), `;
  }

  private *templateTail(node: ts.TemplateTail) {
    if (node.text.length > 0) yield `Type.Literal('${node.text}'), `;
  }

  private *thisTypeNode(_node: ts.ThisTypeNode) {
    yield `This`;
  }

  private *intersectionTypeNode(
    node: ts.IntersectionTypeNode,
  ): IterableIterator<string> {
    const types = node.types.map((type) => this.collect(type)).join(",\n");
    yield `Type.Intersect([\n${types}\n])`;
  }

  private *typeOperatorNode(
    node: ts.TypeOperatorNode,
  ): IterableIterator<string> {
    if (node.operator === ts.SyntaxKind.KeyOfKeyword) {
      const type = this.collect(node.type);
      yield `Type.KeyOf(${type})`;
    }
    if (node.operator === ts.SyntaxKind.ReadonlyKeyword) {
      yield `Type.Readonly(${this.collect(node.type)})`;
    }
  }

  private *parameter(node: ts.ParameterDeclaration): IterableIterator<string> {
    yield this.isOptionalParameter(node)
      ? `Type.Optional(${this.collect(node.type)})`
      : this.collect(node.type);
  }

  private *functionTypeNode(
    node: ts.FunctionTypeNode,
  ): IterableIterator<string> {
    const parameters = node.parameters.map((
      parameter,
    ) => (parameter.dotDotDotToken !== undefined
      ? `...Type.Rest(${this.collect(parameter)})`
      : this.collect(parameter))
    ).join(", ");
    const returns = this.collect(node.type);
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

  private *enumDeclaration(node: ts.EnumDeclaration): IterableIterator<string> {
    this.useImports = true;
    const exports = this.isExport(node) ? "export " : "";
    const members = node.members.map((member) => member.getText()).join(", ");
    const enumType = `${exports}enum Enum${node.name.getText()} { ${members} }`;
    const staticType =
      `${exports}type ${node.name.getText()} = Static<typeof ${node.name.getText()}>`;
    const type =
      `${exports}const ${node.name.getText()} = Type.Enum(Enum${node.name.getText()})`;
    yield [enumType, "", staticType, type].join("\n");
  }

  private propertiesFromTypeElementArray(
    members: ts.NodeArray<ts.TypeElement>,
  ): string {
    const properties = members.filter((member) =>
      !ts.isIndexSignatureDeclaration(member)
    );
    const indexers = members.filter((member) =>
      ts.isIndexSignatureDeclaration(member)
    );
    const propertyCollect = properties.map((property) => this.collect(property))
      .join(",\n");
    const indexer = indexers.length > 0
      ? this.collect(indexers[indexers.length - 1])
      : "";
    if (properties.length === 0 && indexer.length > 0) {
      return `{},\n{\nadditionalProperties: ${indexer}\n }`;
    } else if (properties.length > 0 && indexer.length > 0) {
      return `{\n${propertyCollect}\n},\n{\nadditionalProperties: ${indexer}\n }`;
    } else {
      return `{\n${propertyCollect}\n}`;
    }
  }

  private *typeLiteralNode(node: ts.TypeLiteralNode): IterableIterator<string> {
    const members = this.propertiesFromTypeElementArray(node.members);
    yield* `Type.Object(${members})`;
  }

  private *interfaceDeclaration(
    node: ts.InterfaceDeclaration,
  ): IterableIterator<string> {
    this.useImports = true;
    const isRecursiveType = this.isRecursiveType(node);
    if (isRecursiveType) this.recursiveDeclaration = node;
    const heritage = node.heritageClauses !== undefined
      ? node.heritageClauses.flatMap((node) => this.collect(node))
      : [];
    if (node.typeParameters) {
      this.useGenerics = true;
      const exports = this.isExport(node) ? "export " : "";
      const identifier = this.resolveIdentifier(node);
      const options = this.useIdentifiers
        ? { ...this.resolveOptions(node), $id: identifier }
        : { ...this.resolveOptions(node) };
      const constraints = node.typeParameters.map((param) =>
        `${this.collect(param)} extends TSchema`
      ).join(", ");
      const parameters = node.typeParameters.map((param) =>
        `${this.collect(param)}: ${this.collect(param)}`
      ).join(", ");
      const members = this.propertiesFromTypeElementArray(node.members);
      const names = node.typeParameters.map((param) => `${this.collect(param)}`)
        .join(", ");
      const staticDeclaration =
        `${exports}type ${node.name.getText()}<${constraints}> = Static<ReturnType<typeof ${node.name.getText()}<${names}>>>`;
      const rawTypeExpression = this.isRecursiveType(node)
        ? `Type.Recursive(This => Type.Object(${members}))`
        : `Type.Object(${members})`;
      const typeExpression = heritage.length === 0
        ? rawTypeExpression
        : `Type.Composite([${heritage.join(", ")}, ${rawTypeExpression}])`;
      const type = this.injectOptions(typeExpression, options);
      const typeDeclaration =
        `${exports}const ${node.name.getText()} = <${constraints}>(${parameters}) => ${type}`;
      yield `${staticDeclaration}\n${typeDeclaration}`;
    } else {
      const exports = this.isExport(node) ? "export " : "";
      const identifier = this.resolveIdentifier(node);
      const options = this.useIdentifiers
        ? { ...this.resolveOptions(node), $id: identifier }
        : { ...this.resolveOptions(node) };
      const members = this.propertiesFromTypeElementArray(node.members);
      const staticDeclaration =
        `${exports}type ${node.name.getText()} = Static<typeof ${node.name.getText()}>`;
      const rawTypeExpression = this.isRecursiveType(node)
        ? `Type.Recursive(This => Type.Object(${members}))`
        : `Type.Object(${members})`;
      const typeExpression = heritage.length === 0
        ? rawTypeExpression
        : `Type.Composite([${heritage.join(", ")}, ${rawTypeExpression}])`;
      const type = this.injectOptions(typeExpression, options);
      const typeDeclaration =
        `${exports}const ${node.name.getText()} = ${type}`;
      yield `${staticDeclaration}\n${typeDeclaration}`;
    }
    this.recursiveDeclaration = null;
  }

  private *typeAliasDeclaration(
    node: ts.TypeAliasDeclaration,
  ): IterableIterator<string> {
    this.useImports = true;
    const isRecursiveType = this.isRecursiveType(node);
    if (isRecursiveType) this.recursiveDeclaration = node;
    if (node.typeParameters) {
      this.useGenerics = true;
      const exports = this.isExport(node) ? "export " : "";
      const options = this.useIdentifiers
        ? { $id: this.resolveIdentifier(node) }
        : {};
      const constraints = node.typeParameters.map((param) =>
        `${this.collect(param)} extends TSchema`
      ).join(", ");
      const parameters = node.typeParameters.map((param) =>
        `${this.collect(param)}: ${this.collect(param)}`
      ).join(", ");
      const type_0 = this.collect(node.type);
      const type_1 = isRecursiveType
        ? `Type.Recursive(This => ${type_0})`
        : type_0;
      const type_2 = this.injectOptions(type_1, options);
      const names = node.typeParameters.map((param) => this.collect(param))
        .join(", ");
      const staticDeclaration =
        `${exports}type ${node.name.getText()}<${constraints}> = Static<ReturnType<typeof ${node.name.getText()}<${names}>>>`;
      const typeDeclaration =
        `${exports}const ${node.name.getText()} = <${constraints}>(${parameters}) => ${type_2}`;
      yield `${staticDeclaration}\n${typeDeclaration}`;
    } else {
      const exports = this.isExport(node) ? "export " : "";
      const options = this.useIdentifiers
        ? { $id: this.resolveIdentifier(node), ...this.resolveOptions(node) }
        : { ...this.resolveOptions(node) };
      const type_0 = this.collect(node.type);
      const type_1 = isRecursiveType
        ? `Type.Recursive(This => ${type_0})`
        : type_0;
      const type_2 = this.injectOptions(type_1, options);
      const staticDeclaration =
        `${exports}type ${node.name.getText()} = Static<typeof ${node.name.getText()}>`;
      const typeDeclaration =
        `${exports}const ${node.name.getText()} = ${type_2}`;
      yield `${staticDeclaration}\n${typeDeclaration}`;
    }
    this.recursiveDeclaration = null;
  }

  private *heritageClause(node: ts.HeritageClause): IterableIterator<string> {
    const types = node.types.map((node) => this.collect(node));
    yield types.join(", ");
  }

  private *indexedAccessType(
    node: ts.IndexedAccessTypeNode,
  ): IterableIterator<string> {
    const obj = node.objectType.getText();
    const key = this.collect(node.indexType);
    yield `Type.Index(${obj}, ${key})`;
  }

  private *expressionWithTypeArguments(
    node: ts.ExpressionWithTypeArguments,
  ): IterableIterator<string> {
    const name = this.collect(node.expression);
    const typeArguments = node.typeArguments === undefined
      ? []
      : node.typeArguments.map((node) => this.collect(node));
    return yield typeArguments.length === 0
      ? `${name}`
      : `${name}(${typeArguments.join(", ")})`;
  }

  private *typeParameterDeclaration(
    node: ts.TypeParameterDeclaration,
  ): IterableIterator<string> {
    yield node.name.getText();
  }

  private *parenthesizedTypeNode(
    node: ts.ParenthesizedTypeNode,
  ): IterableIterator<string> {
    yield this.collect(node.type);
  }

  private *propertyAccessExpression(
    node: ts.PropertyAccessExpression,
  ): IterableIterator<string> {
    yield node.getText();
  }

  private *restTypeNode(node: ts.RestTypeNode): IterableIterator<string> {
    yield `...Type.Rest(${node.type.getText()})`;
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

  private *isIndexSignatureDeclaration(node: ts.IndexSignatureDeclaration) {
    yield this.collect(node.type);
  }

  private *typeReferenceNode(
    node: ts.TypeReferenceNode,
  ): IterableIterator<string> {
    const name = node.typeName.getText();
    const args = node.typeArguments
      ? `(${node.typeArguments.map((type) => this.collect(type)).join(", ")})`
      : "";
    if (name === "Date") return yield `Type.Date()`;
    if (name === "Uint8Array") return yield `Type.Uint8Array()`;
    if (name === "String") return yield `Type.String()`;
    if (name === "Number") return yield `Type.Number()`;
    if (name === "Boolean") return yield `Type.Boolean()`;
    if (name === "Function") return yield `Type.Function([], Type.Unknown())`;
    if (name === "Array") return yield `Type.Array${args}`;
    if (name === "Record") return yield `Type.Record${args}`;
    if (name === "Partial") return yield `Type.Partial${args}`;
    if (name === "Required") return yield `Type.Required${args}`;
    if (name === "Omit") return yield `Type.Omit${args}`;
    if (name === "Pick") return yield `Type.Pick${args}`;
    if (name === "Promise") return yield `Type.Promise${args}`;
    if (name === "ReturnType") return yield `Type.ReturnType${args}`;
    if (name === "InstanceType") return yield `Type.InstanceType${args}`;
    if (name === "Parameters") return yield `Type.Parameters${args}`;
    if (name === "AsyncIterableIterator") {
      return yield `Type.AsyncIterator${args}`;
    }
    if (name === "IterableIterator") return yield `Type.Iterator${args}`;
    if (name === "ConstructorParameters") {
      return yield `Type.ConstructorParameters${args}`;
    }
    if (name === "Exclude") return yield `Type.Exclude${args}`;
    if (name === "Extract") return yield `Type.Extract${args}`;
    if (name === "Awaited") return yield `Type.Awaited${args}`;
    if (name === "Uppercase") return yield `Type.Uppercase${args}`;
    if (name === "Lowercase") return yield `Type.Lowercase${args}`;
    if (name === "Capitalize") return yield `Type.Capitalize${args}`;
    if (name === "Uncapitalize") return yield `Type.Uncapitalize${args}`;
    if (
      this.recursiveDeclaration !== null &&
      this.findRecursiveParent(this.recursiveDeclaration, node)
    ) return yield `This`;
    if (
      this.findTypeName(node.getSourceFile(), name) &&
      args.length === 0
    ) {
      return yield `${name}${args}`;
    }
    if (name in globalThis) return yield `Type.Never()`;
    return yield `${name}${args}`;
  }

  private *literalTypeNode(node: ts.LiteralTypeNode): IterableIterator<string> {
    const text = node.getText();
    if (text === "null") return yield `Type.Null()`;
    yield `Type.Literal(${node.getText()})`;
  }

  private *namedTupleMember(
    node: ts.NamedTupleMember,
  ): IterableIterator<string> {
    yield* this.collect(node.type);
  }

  private *moduleDeclaration(
    node: ts.ModuleDeclaration,
  ): IterableIterator<string> {
    const exportSpecifier = this.isExport(node) ? "export " : "";
    const moduleSpecifier = this.isNamespace(node) ? "namespace" : "module";
    yield `${exportSpecifier}${moduleSpecifier} ${node.name.getText()} {`;
    yield* this.visit(node.body);
    yield `}`;
  }

  private *moduleBlock(node: ts.ModuleBlock): IterableIterator<string> {
    for (const statement of node.statements) {
      yield* this.visit(statement);
    }
  }

  private *functionDeclaration(
    _node: ts.FunctionDeclaration,
  ): IterableIterator<string> {
  }

  private *classDeclaration(
    _node: ts.ClassDeclaration,
  ): IterableIterator<string> {
  }

  private collect(node: DocNode | TsTypeDef | undefined): string {
    return `${[...this.visit(node)].join("")}`;
  }

  private *visit(
    node: DocNode | TsTypeDef | undefined,
  ): IterableIterator<string> {
    if (node === undefined) return;

    if (node.kind === "array") return yield* this.arrayTypeNode(node);
    // if (ts.isBlock(node)) return yield* this.block(node); // TODO: Remove.
    // if (ts.isClassDeclaration(node)) return yield* this.classDeclaration(node); // TODO: Implement.
    if (node.kind === "conditional") {
      return yield* this.conditionalTypeNode(node);
    }
    if (node.kind === "fnOrConstructor" && node.fnOrConstructor.constructor) {
      return yield* this.constructorTypeNode(node);
    }

    // TODO: Resume here, with enumDeclaration.
    if (ts.isEnumDeclaration(node)) return yield* this.enumDeclaration(node);
    if (ts.isExpressionWithTypeArguments(node)) {
      return yield* this.expressionWithTypeArguments(node);
    }
    if (ts.isFunctionDeclaration(node)) {
      return yield* this.functionDeclaration(node);
    }
    if (ts.isFunctionTypeNode(node)) return yield* this.functionTypeNode(node);
    if (ts.isHeritageClause(node)) return yield* this.heritageClause(node);
    if (ts.isIndexedAccessTypeNode(node)) {
      return yield* this.indexedAccessType(node);
    }
    if (ts.isIndexSignatureDeclaration(node)) {
      return yield* this.isIndexSignatureDeclaration(node);
    }
    if (ts.isInterfaceDeclaration(node)) {
      return yield* this.interfaceDeclaration(node);
    }
    if (ts.isLiteralTypeNode(node)) return yield* this.literalTypeNode(node);
    if (ts.isNamedTupleMember(node)) return yield* this.namedTupleMember(node);
    if (ts.isPropertySignature(node)) {
      return yield* this.propertySignature(node);
    }
    if (ts.isModuleDeclaration(node)) {
      return yield* this.moduleDeclaration(node);
    }
    if (ts.isIdentifier(node)) return yield node.getText();
    if (ts.isIntersectionTypeNode(node)) {
      return yield* this.intersectionTypeNode(node);
    }
    if (ts.isUnionTypeNode(node)) return yield* this.unionTypeNode(node);
    if (ts.isMappedTypeNode(node)) return yield* this.mappedTypeNode(node);
    if (ts.isMethodSignature(node)) return yield* this.methodSignature(node);
    if (ts.isModuleBlock(node)) return yield* this.moduleBlock(node);
    if (ts.isParameter(node)) return yield* this.parameter(node);
    if (ts.isParenthesizedTypeNode(node)) {
      return yield* this.parenthesizedTypeNode(node);
    }
    if (ts.isPropertyAccessExpression(node)) {
      return yield* this.propertyAccessExpression(node);
    }
    if (ts.isRestTypeNode(node)) return yield* this.restTypeNode(node);
    if (ts.isTupleTypeNode(node)) return yield* this.tupleTypeNode(node);
    if (ts.isTemplateLiteralTypeNode(node)) {
      return yield* this.templateLiteralTypeNode(node);
    }
    if (ts.isTemplateLiteralTypeSpan(node)) {
      return yield* this.templateLiteralTypeSpan(node);
    }
    if (ts.isTemplateHead(node)) return yield* this.templateHead(node);
    if (ts.isTemplateMiddle(node)) return yield* this.templateMiddle(node);
    if (ts.isTemplateTail(node)) return yield* this.templateTail(node);
    if (ts.isThisTypeNode(node)) return yield* this.thisTypeNode(node);
    if (ts.isTypeAliasDeclaration(node)) {
      return yield* this.typeAliasDeclaration(node);
    }
    if (ts.isTypeLiteralNode(node)) return yield* this.typeLiteralNode(node);
    if (ts.isTypeOperatorNode(node)) return yield* this.typeOperatorNode(node);
    if (ts.isTypeParameterDeclaration(node)) {
      return yield* this.typeParameterDeclaration(node);
    }
    if (ts.isTypeReferenceNode(node)) {
      return yield* this.typeReferenceNode(node);
    }
    if (ts.isSourceFile(node)) return yield* this.sourceFile(node);
    if (node.kind === ts.SyntaxKind.ExportKeyword) return yield `export`;
    if (node.kind === ts.SyntaxKind.KeyOfKeyword) return yield `Type.KeyOf()`;
    if (node.kind === ts.SyntaxKind.NumberKeyword) return yield `Type.Number()`;
    if (node.kind === ts.SyntaxKind.BigIntKeyword) return yield `Type.BigInt()`;
    if (node.kind === ts.SyntaxKind.StringKeyword) return yield `Type.String()`;
    if (node.kind === ts.SyntaxKind.SymbolKeyword) return yield `Type.Symbol()`;
    if (node.kind === ts.SyntaxKind.BooleanKeyword) {
      return yield `Type.Boolean()`;
    }
    if (node.kind === ts.SyntaxKind.UndefinedKeyword) {
      return yield `Type.Undefined()`;
    }
    if (node.kind === ts.SyntaxKind.UnknownKeyword) {
      return yield `Type.Unknown()`;
    }
    if (node.kind === ts.SyntaxKind.AnyKeyword) return yield `Type.Any()`;
    if (node.kind === ts.SyntaxKind.NeverKeyword) return yield `Type.Never()`;
    if (node.kind === ts.SyntaxKind.NullKeyword) return yield `Type.Null()`;
    if (node.kind === ts.SyntaxKind.VoidKeyword) return yield `Type.Void()`;
    if (node.kind === ts.SyntaxKind.EndOfFileToken) return;
    if (node.kind === ts.SyntaxKind.SyntaxList) {
      for (const child of node.getChildren()) {
        yield* this.visit(child);
      }
      return;
    }
    console.warn("Unhandled:", ts.SyntaxKind[node.kind], node.getText());
  }

  private importStatement(): string {
    if (!(this.useImports && this.useTypeBoxImport)) return "";
    // TODO: Add option useStaticType.
    const set = new Set<string>(["Type", "Static"]);
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
    this.blockLevel = 0;
    const declarations = nodes.map((node) => this.visit(node)).join("\n\n");
    const imports = this.importStatement();
    const typescript = [imports, "", "", declarations].join("\n");
    return typescript;
  }
}
