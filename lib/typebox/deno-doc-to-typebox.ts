import * as ts from "typescript";
import type {
  DocNode,
  DocNodeEnum,
  DocNodeInterface,
  DocNodeTypeAlias,
  InterfacePropertyDef,
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

export class TypeScriptToTypeBoxError extends Error {
  constructor(public readonly diagnostics: ts.Diagnostic[]) {
    super("");
  }
}

export interface DocNodesToTypeBoxOptions {
  // useExportEverything?: boolean;
  useTypeBoxImport?: boolean;
  // useIdentifiers?: boolean;

  // TODO: Add option useStaticType.
}

// TODO: Migrate to ts-morph for building TypeScript files.
export class DenoDocToTypeBox {
  private typenames = new Set<string>();
  private recursiveDeclaration: DocNodeTypeAlias | DocNodeInterface | null =
    null;
  // private blockLevel = 0;
  private useImports = true;
  private useOptions = false;
  private useGenerics = false;
  private useCloneType = false;
  // private useExportsEverything = false;
  // private useIdentifiers = false;
  private useTypeBoxImport = true;

  public constructor(options?: DocNodesToTypeBoxOptions) {
    // this.useExportsEverything = options?.useExportEverything ?? false;
    // this.useIdentifiers = options?.useIdentifiers ?? false;
    this.useTypeBoxImport = options?.useTypeBoxImport ?? true;
  }

  private findRecursiveParent(
    _recursiveTypeNode:
      | DocNodeInterface
      | DocNodeTypeAlias,
    _node: DocNode | TsTypeDef | InterfacePropertyDef,
  ): boolean {
    return false;

    // TODO: Fix this.
    // return (ts.isTypeReferenceNode(node) &&
    //   recursiveTypeNode.name.getText() === node.typeName.getText()) ||
    //   node.getChildren().some((node) => this.findRecursiveParent(recursiveTypeNode, node));
  }

  private findRecursiveThis(_node: DocNode | TsTypeDef): boolean {
    return false;
    // TODO: Fix this.
    // return node.getChildren().some((node) =>
    //   ts.isThisTypeNode(node) || this.findRecursiveThis(node)
    // );
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
    recursiveTypeNode: DocNodeInterface | DocNodeTypeAlias,
  ) {
    const check1 = recursiveTypeNode.kind === "typeAlias"
      ? [recursiveTypeNode.typeAliasDef.tsType].some((node) =>
        this.findRecursiveParent(recursiveTypeNode, node)
      )
      : recursiveTypeNode.interfaceDef.properties.some((node) =>
        this.findRecursiveParent(recursiveTypeNode, node)
      );
    const check2 = recursiveTypeNode.kind === "interface" &&
      this.findRecursiveThis(recursiveTypeNode);
    return check1 || check2;
  }

  // private isReadonlyProperty(node: ts.PropertySignature): boolean {
  //   return node.modifiers !== undefined &&
  //     node.modifiers.find((modifier) => modifier.getText() === "readonly") !==
  //       undefined;
  // }

  // private isOptionalProperty(node: ts.PropertySignature) {
  //   return node.questionToken !== undefined;
  // }

  // private isOptionalParameter(node: ts.ParameterDeclaration) {
  //   return node.questionToken !== undefined;
  // }

  // private isExport(
  //   node:
  //     | ts.InterfaceDeclaration
  //     | ts.TypeAliasDeclaration
  //     | ts.EnumDeclaration
  //     | ts.ModuleDeclaration,
  // ): boolean {
  //   return this.blockLevel === 0 &&
  //     (this.useExportsEverything ||
  //       (node.modifiers !== undefined &&
  //         node.modifiers.find((modifier) => modifier.getText() === "export") !==
  //           undefined));
  // }

  // private isNamespace(node: ts.ModuleDeclaration) {
  //   return node.flags === ts.NodeFlags.Namespace;
  // }

  // private resolveJsDocComment(
  //   node:
  //     | ts.TypeAliasDeclaration
  //     | ts.PropertySignature
  //     | ts.InterfaceDeclaration,
  // ): string {
  //   const content = node.getFullText().trim();
  //   const indices = [
  //     content.indexOf("/**"),
  //     content.indexOf("type"),
  //     content.indexOf("interface"),
  //   ].map((n) => (n === -1 ? Infinity : n));
  //   if (
  //     indices[0] === -1 || indices[1] < indices[0] || indices[2] < indices[0]
  //   ) {
  //     return ""; // no comment or declaration before comment
  //   }
  //   for (let i = indices[0]; i < content.length; i++) {
  //     if (content[i] === "*" && content[i + 1] === "/") {
  //       return content.slice(0, i + 2);
  //     }
  //   }
  //   return "";
  // }

  // private resolveOptions(
  //   _node:
  //     | ts.TypeAliasDeclaration
  //     | ts.PropertySignature
  //     | ts.InterfaceDeclaration,
  // ): Record<string, unknown> {
  //   // console.info({ resolveOptions: _node });
  //   return {};
  //   // const content = this.resolveJsDocComment(node);
  //   // return JsDoc.Parse(content);
  // }

  // private resolveIdentifier(
  //   node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration,
  // ) {
  //   function* resolve(node: ts.Node): IterableIterator<string> {
  //     if (node.parent) yield* resolve(node.parent);
  //     if (ts.isModuleDeclaration(node)) yield node.name.getText();
  //   }
  //   return [...resolve(node), node.name.getText()].join(".");
  // }

  private unwrapModifier(type: string) {
    for (let i = 0; i < type.length; i++) {
      if (type[i] === "(") {
        return type.slice(i + 1, type.length - 1);
      }
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

  // private *propertySignature(
  //   node: ts.PropertySignature,
  // ): IterableIterator<string> {
  //   const [readonly, optional] = [
  //     this.isReadonlyProperty(node),
  //     this.isOptionalProperty(node),
  //   ];
  //   const options = this.resolveOptions(node);
  //   const type_0 = this.collect(node.type);
  //   const type_1 = this.injectOptions(type_0, options);
  //   if (readonly && optional) {
  //     return yield `${node.name.getText()}: Type.ReadonlyOptional(${type_1})`;
  //   } else if (readonly) {
  //     return yield `${node.name.getText()}: Type.Readonly(${type_1})`;
  //   } else if (optional) {
  //     return yield `${node.name.getText()}: Type.Optional(${type_1})`;
  //   } else {
  //     return yield `${node.name.getText()}: ${type_1}`;
  //   }
  // }

  private *arrayTypeNode(node: TsTypeArrayDef): IterableIterator<string> {
    const type = this.collect(node);
    yield `Type.Array(${type})`;
  }

  // private *block(node: ts.Block): IterableIterator<string> {
  //   this.blockLevel += 1;
  //   const statements = node.statements.map((statement) =>
  //     this.collect(statement)
  //   ).join("\n\n");
  //   this.blockLevel -= 1;
  //   yield `{\n${statements}\n}`;
  // }

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
    const isReadonlyTokenMinus = false; // TODO: Implement.
    const isQuestionTokenMinus = false; // TODO: Implement.
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

  // private *methodSignature(node: ts.MethodSignature): IterableIterator<string> {
  //   const parameters = node.parameters.map((
  //     parameter,
  //   ) => (parameter.dotDotDotToken !== undefined
  //     ? `...Type.Rest(${this.collect(parameter)})`
  //     : this.collect(parameter))
  //   ).join(", ");
  //   const returnType = node.type === undefined
  //     ? `Type.Unknown()`
  //     : this.collect(node.type);
  //   yield `${node.name.getText()}: Type.Function([${parameters}], ${returnType})`;
  // }

  // private *templateLiteralTypeNode(node: ts.TemplateLiteralTypeNode) {
  //   const collect = node.getChildren().map((node) => this.collect(node)).join(
  //     "",
  //   );
  //   yield `Type.TemplateLiteral([${collect.slice(0, collect.length - 2)}])`;
  // }

  // private *templateLiteralTypeSpan(node: ts.TemplateLiteralTypeSpan) {
  //   const collect = node.getChildren().map((node) => this.collect(node)).join(
  //     ", ",
  //   );
  //   if (collect.length > 0) yield `${collect}`;
  // }

  // private *templateHead(node: ts.TemplateHead) {
  //   if (node.text.length > 0) yield `Type.Literal('${node.text}'), `;
  // }

  // private *templateMiddle(node: ts.TemplateMiddle) {
  //   if (node.text.length > 0) yield `Type.Literal('${node.text}'), `;
  // }

  // private *templateTail(node: ts.TemplateTail) {
  //   if (node.text.length > 0) yield `Type.Literal('${node.text}'), `;
  // }

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

  // private *parameter(node: ts.ParameterDeclaration): IterableIterator<string> {
  //   yield this.isOptionalParameter(node)
  //     ? `Type.Optional(${this.collect(node.type)})`
  //     : this.collect(node.type);
  // }

  private *functionTypeNode(
    node: TsTypeFnOrConstructorDef,
  ): IterableIterator<string> {
    const parameters = node.fnOrConstructor.params.map((
      parameter,
    ) => (parameter.kind === "rest"
      ? `...Type.Rest(${this.collect(parameter.tsType)})`
      : this.collect(parameter.tsType))
    ).join(", ");
    const returns = this.collect(node.fnOrConstructor.tsType);
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
    yield [enumType, "", staticType, type].join("\n");
  }

  private propertiesFromTypeElementArray(
    members: LiteralPropertyDef[],
  ): string {
    const properties = members
      .filter((member) => member.tsType?.kind !== "indexedAccess");
    const indexers = members
      .filter((member) => member.tsType?.kind === "indexedAccess");
    const propertyCollect = properties
      .map((property) => `${property.name}: ${this.collect(property.tsType)}`)
      .join(",\n");
    const indexer = indexers.length > 0
      ? this.collect(indexers[indexers.length - 1]?.tsType)
      : "";
    // TODO: Fix additionalProperties.
    if (properties.length === 0 && indexer.length > 0) {
      return `{},\n{\nadditionalProperties: ${indexer}\n }`;
    } else if (properties.length > 0 && indexer.length > 0) {
      return `{\n${propertyCollect}\n},\n{\nadditionalProperties: ${indexer}\n }`;
    } else {
      return `{\n${propertyCollect}\n}`;
    }
  }

  private *typeLiteralNode(
    node: TsTypeTypeLiteralDef,
  ): IterableIterator<string> {
    const members = this.propertiesFromTypeElementArray(
      node.typeLiteral.properties,
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
    if (node.interfaceDef.typeParams.length > 0) {
      this.useGenerics = true;
      const exports = node.declarationKind === "export" ? "export " : "";

      // const identifier = node.name;
      // const options = this.useIdentifiers
      //   ? { ...this.resolveOptions(node), $id: identifier }
      //   : { ...this.resolveOptions(node) };

      const constraints = node.interfaceDef.typeParams
        .map((param) => `${this.collect(param.constraint)} extends TSchema`)
        .join(", ");
      const parameters = node.interfaceDef.typeParams
        .map((param) =>
          `${this.collect(param.constraint)}: ${this.collect(param.constraint)}`
        )
        .join(", ");

      // console.log({ properties: node.interfaceDef.properties });
      const members = this.propertiesFromTypeElementArray(
        node.interfaceDef.properties,
      );

      // console.log({ members });

      const names = node.interfaceDef.typeParams
        .map((param) => `${this.collect(param.constraint)}`)
        .join(", ");
      const staticDeclaration =
        `${exports}type ${node.name}<${constraints}> = Static<ReturnType<typeof ${node.name}<${names}>>>`;
      const rawTypeExpression = this.isRecursiveType(node)
        ? `Type.Recursive(This => Type.Object(${members}))`
        : `Type.Object(${members})`;
      const typeExpression = heritage.length === 0
        ? rawTypeExpression
        : `Type.Composite([${heritage.join(", ")}, ${rawTypeExpression}])`;
      // const type = this.injectOptions(typeExpression, options);
      const typeDeclaration =
        `${exports}const ${node.name} = <${constraints}>(${parameters}) => ${typeExpression}`;
      yield `${staticDeclaration}\n${typeDeclaration}`;
    } else {
      const exports = node.declarationKind === "export" ? "export " : "";
      // const identifier = this.resolveIdentifier(node);
      // const options = this.useIdentifiers
      //   ? { ...this.resolveOptions(node), $id: identifier }
      //   : { ...this.resolveOptions(node) };
      // console.log({ properties: node.interfaceDef.properties });
      const members = this.propertiesFromTypeElementArray(
        node.interfaceDef.properties,
      );
      const staticDeclaration =
        `${exports}type ${node.name} = Static<typeof ${node.name}>`;
      const rawTypeExpression = this.isRecursiveType(node)
        ? `Type.Recursive(This => Type.Object(${members}))`
        : `Type.Object(${members})`;
      const typeExpression = heritage.length === 0
        ? rawTypeExpression
        : `Type.Composite([${heritage.join(", ")}, ${rawTypeExpression}])`;
      // const type = this.injectOptions(typeExpression, options);
      const typeDeclaration =
        `${exports}const ${node.name} = ${typeExpression}`;
      yield `${staticDeclaration}\n${typeDeclaration}`;
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
      // const options = this.useIdentifiers
      //   ? { $id: this.resolveIdentifier(node) }
      //   : {};
      const constraints = node.typeAliasDef.typeParams.map((param) =>
        `${this.collect(param.constraint)} extends TSchema`
      ).join(", ");
      const parameters = node.typeAliasDef.typeParams.map((param) =>
        `${this.collect(param.constraint)}: ${this.collect(param.constraint)}`
      ).join(", ");
      const type_0 = this.collect(node.typeAliasDef.tsType);
      const type_1 = isRecursiveType
        ? `Type.Recursive(This => ${type_0})`
        : type_0;
      // const type_2 = this.injectOptions(type_1, options);
      const names = node.typeAliasDef.typeParams
        .map((param) => this.collect(param.constraint))
        .join(", ");
      const staticDeclaration =
        `${exports}type ${node.name}<${constraints}> = Static<ReturnType<typeof ${node.name}<${names}>>>`;
      const typeDeclaration =
        `${exports}const ${node.name} = <${constraints}>(${parameters}) => ${type_1}`;

      yield `${staticDeclaration}\n${typeDeclaration}`;
    } else {
      const exports = node.declarationKind === "export" ? "export " : "";
      // const options = this.useIdentifiers
      //   ? { $id: this.resolveIdentifier(node), ...this.resolveOptions(node) }
      //   : { ...this.resolveOptions(node) };
      const type_0 = this.collect(node.typeAliasDef.tsType);
      const type_1 = isRecursiveType
        ? `Type.Recursive(This => ${type_0})`
        : type_0;
      // const type_2 = this.injectOptions(type_1, options);
      const staticDeclaration =
        `${exports}type ${node.name} = Static<typeof ${node.name}>`;
      const typeDeclaration = `${exports}const ${node.name} = ${type_1}`;

      yield `${staticDeclaration}\n${typeDeclaration}`;
    }

    this.recursiveDeclaration = null;
  }

  // private *heritageClause(node: ts.HeritageClause): IterableIterator<string> {
  //   const types = node.types.map((node) => this.collect(node));
  //   yield types.join(", ");
  // }

  // private *indexedAccessType(
  //   node: ts.IndexedAccessTypeNode,
  // ): IterableIterator<string> {
  //   const obj = node.objectType.getText();
  //   const key = this.collect(node.indexType);
  //   yield `Type.Index(${obj}, ${key})`;
  // }

  // private *expressionWithTypeArguments(
  //   node: ts.ExpressionWithTypeArguments,
  // ): IterableIterator<string> {
  //   const name = this.collect(node.expression);
  //   const typeArguments = node.typeArguments === undefined
  //     ? []
  //     : node.typeArguments.map((node) => this.collect(node));
  //   return yield typeArguments.length === 0
  //     ? `${name}`
  //     : `${name}(${typeArguments.join(", ")})`;
  // }

  // private *typeParameterDeclaration(
  //   node: ts.TypeParameterDeclaration,
  // ): IterableIterator<string> {
  //   yield node.name.getText();
  // }

  private *parenthesizedTypeNode(
    node: TsTypeParenthesizedDef,
  ): IterableIterator<string> {
    yield this.collect(node.parenthesized);
  }

  // private *propertyAccessExpression(
  //   node: ts.PropertyAccessExpression,
  // ): IterableIterator<string> {
  //   yield node.getText();
  // }

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

  // private *isIndexSignatureDeclaration(node: ts.IndexSignatureDeclaration) {
  //   yield this.collect(node.type);
  // }

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
    // if (
    //   this.findTypeName(node.getSourceFile(), name) &&
    //   args.length === 0
    // ) {
    //   return yield `${name}${args}`;
    // }
    if (name in globalThis) return yield `Type.Never()`;
    return yield `${name}${args}`;
  }

  private *literalTypeNode(node: TsTypeDefLiteral): IterableIterator<string> {
    if (node.repr === "null") {
      return yield `Type.Null()`;
    }

    yield `Type.Literal(${node.repr})`;
  }

  // private *namedTupleMember(
  //   node: ts.NamedTupleMember,
  // ): IterableIterator<string> {
  //   yield* this.collect(node.type);
  // }

  // private *moduleDeclaration(
  //   node: ts.ModuleDeclaration,
  // ): IterableIterator<string> {
  //   const exportSpecifier = this.isExport(node) ? "export " : "";
  //   const moduleSpecifier = this.isNamespace(node) ? "namespace" : "module";
  //   yield `${exportSpecifier}${moduleSpecifier} ${node.name.getText()} {`;
  //   yield* this.visit(node.body);
  //   yield `}`;
  // }

  // private *moduleBlock(node: ts.ModuleBlock): IterableIterator<string> {
  //   for (const statement of node.statements) {
  //     yield* this.visit(statement);
  //   }
  // }

  private *functionDeclaration(
    _node: ts.FunctionDeclaration,
  ): IterableIterator<string> {
  }

  private *classDeclaration(
    _node: ts.ClassDeclaration,
  ): IterableIterator<string> {
  }

  private *keyword(node: TsTypeKeywordDef): IterableIterator<string> {
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
        return yield* this.keyword(node);
      }

      default: {
        // if (ts.isTypeParameterDeclaration(node)) {
        //   return yield* this.typeParameterDeclaration(node);
        // }
        // if (ts.isSourceFile(node)) return yield* this.sourceFile(node);

        // TODO: Fix.
        // if (node.kind === ts.SyntaxKind.ExportKeyword) return yield `export`;
        // if (node.kind === ts.SyntaxKind.KeyOfKeyword) {
        //   return yield `Type.KeyOf()`;
        // }
        // if (node.kind === ts.SyntaxKind.NumberKeyword) {
        //   return yield `Type.Number()`;
        // }
        // if (node.kind === ts.SyntaxKind.BigIntKeyword) {
        //   return yield `Type.BigInt()`;
        // }
        // if (node.kind === ts.SyntaxKind.StringKeyword) {
        //   return yield `Type.String()`;
        // }
        // if (node.kind === ts.SyntaxKind.SymbolKeyword) {
        //   return yield `Type.Symbol()`;
        // }
        // if (node.kind === ts.SyntaxKind.BooleanKeyword) {
        //   return yield `Type.Boolean()`;
        // }
        // if (node.kind === ts.SyntaxKind.UndefinedKeyword) {
        //   return yield `Type.Undefined()`;
        // }
        // if (node.kind === ts.SyntaxKind.UnknownKeyword) {
        //   return yield `Type.Unknown()`;
        // }
        // if (node.kind === ts.SyntaxKind.AnyKeyword) return yield `Type.Any()`;
        // if (node.kind === ts.SyntaxKind.NeverKeyword) {
        //   return yield `Type.Never()`;
        // }
        // if (node.kind === ts.SyntaxKind.NullKeyword) return yield `Type.Null()`;
        // if (node.kind === ts.SyntaxKind.VoidKeyword) return yield `Type.Void()`;
        // if (node.kind === ts.SyntaxKind.EndOfFileToken) return;
        // if (node.kind === ts.SyntaxKind.SyntaxList) {
        //   for (const child of node.getChildren()) {
        //     yield* this.visit(child);
        //   }
        //   return;
        // }
        //

        console.warn("Unhandled:", node);
        // throw new Error(`Unhandled node: ${node.kind}`);
      }
    }
  }

  private importStatement(): string {
    if (!(this.useImports && this.useTypeBoxImport)) {
      return "";
    }

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
    // this.blockLevel = 0;
    const declarations = nodes
      .flatMap((node) => [...this.visit(node)])
      .join("\n\n");
    const imports = this.importStatement();
    const typescript = [imports, "", "", declarations].join("\n");
    return typescript;
  }
}
