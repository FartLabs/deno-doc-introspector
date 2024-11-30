import type {
  DeclarationKind,
  DocNode,
  DocNodeInterface,
  DocNodeTypeAlias,
  LiteralPropertyDef,
} from "@deno/doc";

export class TypeScriptToTypeBoxError extends Error {}

export interface TypeScriptToTypeBoxOptions {
  /**
   * Setting this to true will ensure all types are exports as const values. This setting is
   * used by the TypeScriptToTypeBoxModel to gather TypeBox definitions during runtime eval
   * pass. The default is false
   */
  useExportEverything?: boolean;
  /**
   * Specifies if the output code should specify a default `import` statement. For TypeScript
   * generated code this is typically desirable, but for Model generated code, the `Type`
   * build is passed in into scope as a variable. The default is true.
   */
  useTypeBoxImport?: boolean;
  /**
   * Specifies if the output types should include an identifier associated with the assigned
   * variable name. This is useful for remapping model types to targets, but optional for
   * for TypeBox which can operate on vanilla JS references. The default is false.
   */
  useIdentifiers?: boolean;
}

// const transpilerOptions: ts.TranspileOptions = {
//   compilerOptions: {
//     strict: true,
//     target: ts.ScriptTarget.ES2022,
//   },
// };

// (auto) tracked on calls to find type name
const typenames = new Set<string>();

// (auto) tracked for recursive types and used to associate This type references
let recursiveDeclaration:
  | DocNodeTypeAlias
  | DocNodeInterface
  | null = null;

// (auto) tracked for scoped block level definitions and used to prevent `export` emit when not in global scope.
let blockLevel: number = 0;

// (auto) tracked for injecting typebox import statements
let useImports = false;

// (auto) tracked for injecting JSON schema optios
let useOptions = false;

// (auto) tracked for injecting TSchema import statements
let useGenerics = false;

// (auto) tracked for cases where composition requires deep clone
let useCloneType = false;

// (option) export override to ensure all schematics
let useExportsEverything = false;

// (option) inject identifiers
let useIdentifiers = false;

// (option) specifies if typebox imports should be included
let useTypeBoxImport = true;

function findRecursiveParent(
  _decl: DocNodeInterface | DocNodeTypeAlias,
  _node: DocNode,
): boolean {
  return false;
  //   return (ts.isTypeReferenceNode(node) &&
  //     decl.name.getText() === node.typeName.getText()) ||
  //     node.getChildren().some((node) => findRecursiveParent(decl, node));
}

function findRecursiveThis(_node: DocNode): boolean {
  return false;
  //   return node.getChildren().some((node) =>
  //     ts.isThisTypeNode(node) || findRecursiveThis(node)
  //   );
}

function findTypeName(node: DocNode, name: string): boolean {
  return false;
  //   const found = typenames.has(name) ||
  //     node.getChildren().some((node) => {
  //       return ((ts.isInterfaceDeclaration(node) ||
  //         ts.isTypeAliasDeclaration(node)) && node.name.getText() === name) ||
  //         findTypeName(node, name);
  //     });
  //   if (found) typenames.add(name);
  //   return found;
}

function checkIsRecursiveType(
  _decl: DocNodeInterface | DocNodeTypeAlias,
) {
  return false;
  //   const check1 = ts.isTypeAliasDeclaration(decl)
  //     ? [decl.type].some((node) => findRecursiveParent(decl, node))
  //     : decl.members.some((node) => findRecursiveParent(decl, node));
  //   const check2 = ts.isInterfaceDeclaration(decl) && findRecursiveThis(decl);
  //   return check1 || check2;
}

// function checkIsReadonlyProperty(_node: ts.PropertySignature): boolean {
//   return false;
//   //   return node.modifiers !== undefined &&
//   //     node.modifiers.find((modifier) => modifier.getText() === "readonly") !==
//   //       undefined;
// }

// function checkIsOptionalProperty(node: ts.PropertySignature) {
//   return node.questionToken !== undefined;
// }

// function checkIsOptionalParameter(node: ts.ParameterDeclaration) {
//   return node.questionToken !== undefined;
// }

function checkIsExport(kind: DeclarationKind): boolean {
  return kind === "export";
}

// function checkIsNamespace(node: ts.ModuleDeclaration) {
//   return node.flags === ts.NodeFlags.Namespace;
// }

// function ResolveJsDocComment(
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
//   ) return ""; // no comment or declaration before comment
//   for (let i = indices[0]; i < content.length; i++) {
//     if (content[i] === "*" && content[i + 1] === "/") {
//       return content.slice(0, i + 2);
//     }
//   }
//   return "";
// }

function resolveOptions(
  _node:
    | DocNodeTypeAlias
    // | ts.PropertySignature
    | DocNodeInterface,
): Record<string, unknown> {
  return {};
  //   const content = ResolveJsDocComment(node);
  //   return JsDoc.Parse(content);
}

function resolveIdentifier(
  _node: DocNodeTypeAlias | DocNodeInterface,
) {
  return "";
  //   function* resolve(node: ts.Node): IterableIterator<string> {
  //     if (node.parent) {
  //       yield* resolve(node.parent);
  //     }

  //     if (ts.isModuleDeclaration(node)) {
  //       yield node.name.getText();
  //     }
  //   }

  //   return [...resolve(node), node.name.getText()].join(".");
}

function unwrapModifier(type: string) {
  for (let i = 0; i < type.length; i++) {
    if (type[i] === "(") return type.slice(i + 1, type.length - 1);
  }
  return type;
}

// Note: This function is only called when 'useIdentifiers' is true. What we're trying to achieve with
// identifier injection is a referential type model over the default inline model. For the purposes of
// code generation, we tend to prefer referential types as these can be both inlined or referenced in
// the codegen target; and where different targets may have different referential requirements. It
// should be possible to implement a more robust injection mechanism however. For review.
// prettier-ignore
function injectOptions(
  type: string,
  options: Record<string, unknown>,
): string {
  if (globalThis.Object.keys(options).length === 0) {
    return type;
  }

  // unwrap for modifiers
  if (type.indexOf("Type.ReadonlyOptional") === 0) {
    return `Type.ReadonlyOptional( ${
      injectOptions(unwrapModifier(type), options)
    } )`;
  }

  if (type.indexOf("Type.Readonly") === 0) {
    return `Type.Readonly( ${injectOptions(unwrapModifier(type), options)} )`;
  }

  if (type.indexOf("Type.Optional") === 0) {
    return `Type.Optional( ${injectOptions(unwrapModifier(type), options)} )`;
  }

  const encoded = JSON.stringify(options);

  // indexer type
  if (type.lastIndexOf("]") === type.length - 1) {
    useCloneType = true;
  }

  if (type.lastIndexOf("]") === type.length - 1) {
    return `CloneType(${type}, ${encoded})`;
  }

  // referenced type
  if (type.indexOf("(") === -1) {
    useCloneType = true;
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

function* generateSourceFile(nodes: DocNode[]): IterableIterator<string> {
  for (const node of nodes) {
    yield* visitNode(node);
  }
}

function* generatePropertySignature(
  def: LiteralPropertyDef,
): IterableIterator<string> {
  //   const [readonly, optional] = [
  //     checkIsReadonlyProperty(def),
  //     checkIsOptionalProperty(def),
  //   ];
  //   const options = resolveOptions(def);
  const type_0 = collectNode(def.type);
  const type_1 = injectOptions(type_0, options);
  if (readonly && optional) {
    return yield `${def.name}: Type.ReadonlyOptional(${type_1})`;
  } else if (readonly) {
    return yield `${def.name}: Type.Readonly(${type_1})`;
  } else if (optional) {
    return yield `${def.name}: Type.Optional(${type_1})`;
  } else {
    return yield `${def.name}: ${type_1}`;
  }
}

function* generateArrayTypeNode(
  node: ts.ArrayTypeNode,
): IterableIterator<string> {
  const type = collectNode(node.elementType);
  yield `Type.Array(${type})`;
}

function* generateBlock(node: ts.Block): IterableIterator<string> {
  blockLevel += 1;
  const statments = node.statements.map((statement) => collectNode(statement))
    .join("\n\n");
  blockLevel -= 1;
  yield `{\n${statments}\n}`;
}

function* generateTupleTypeNode(
  node: ts.TupleTypeNode,
): IterableIterator<string> {
  const types = node.elements.map((type) => collectNode(type)).join(",\n");
  yield `Type.Tuple([\n${types}\n])`;
}

function* generateUnionTypeNode(
  node: ts.UnionTypeNode,
): IterableIterator<string> {
  const types = node.types.map((type) => collectNode(type)).join(",\n");
  yield `Type.Union([\n${types}\n])`;
}

function* generateMappedTypeNode(
  node: ts.MappedTypeNode,
): IterableIterator<string> {
  const K = collectNode(node.typeParameter);
  const T = collectNode(node.type);
  const C = collectNode(node.typeParameter.constraint);
  const readonly = node.readonlyToken !== undefined;
  const optional = node.questionToken !== undefined;
  const readonly_subtractive = readonly &&
    ts.isMinusToken(node.readonlyToken);
  const optional_subtractive = optional &&
    ts.isMinusToken(node.questionToken);
  return yield (
    (readonly && optional)
      ? (
        (readonly_subtractive && optional_subtractive)
          ? `Type.Mapped(${C}, ${K} => Type.Readonly(Type.Optional(${T}, false), false))`
          : readonly_subtractive
          ? `Type.Mapped(${C}, ${K} => Type.Readonly(Type.Optional(${T}), false))`
          : optional_subtractive
          ? `Type.Mapped(${C}, ${K} => Type.Readonly(Type.Optional(${T}, false)))`
          : `Type.Mapped(${C}, ${K} => Type.Readonly(Type.Optional(${T})))`
      )
      : readonly
      ? (
        readonly_subtractive
          ? `Type.Mapped(${C}, ${K} => Type.Readonly(${T}, false))`
          : `Type.Mapped(${C}, ${K} => Type.Readonly(${T}))`
      )
      : optional
      ? (
        optional_subtractive
          ? `Type.Mapped(${C}, ${K} => Type.Optional(${T}, false))`
          : `Type.Mapped(${C}, ${K} => Type.Optional(${T}))`
      )
      : `Type.Mapped(${C}, ${K} => ${T})`
  );
}

function* generateMethodSignature(
  node: ts.MethodSignature,
): IterableIterator<string> {
  const parameters = node.parameters.map((
    parameter,
  ) => (parameter.dotDotDotToken !== undefined
    ? `...Type.Rest(${collectNode(parameter)})`
    : collectNode(parameter))
  ).join(", ");
  const returnType = node.type === undefined
    ? `Type.Unknown()`
    : collectNode(node.type);
  yield `${node.name.getText()}: Type.Function([${parameters}], ${returnType})`;
}

function* generateTemplateLiteralTypeNode(node: ts.TemplateLiteralTypeNode) {
  const collect = node.getChildren().map((node) => collectNode(node)).join("");
  yield `Type.TemplateLiteral([${collect.slice(0, collect.length - 2)}])`; // can't remove trailing here
}

function* generateTemplateLiteralTypeSpan(node: ts.TemplateLiteralTypeSpan) {
  const collect = node.getChildren().map((node) => collectNode(node)).join(
    ", ",
  );
  if (collect.length > 0) {
    yield `${collect}`;
  }
}

function* generateTemplateHead(node: ts.TemplateHead) {
  if (node.text.length > 0) {
    yield `Type.Literal('${node.text}'), `;
  }
}

function* generateTemplateMiddle(node: ts.TemplateMiddle) {
  if (node.text.length > 0) {
    yield `Type.Literal('${node.text}'), `;
  }
}

function* generateTemplateTail(node: ts.TemplateTail) {
  if (node.text.length > 0) {
    yield `Type.Literal('${node.text}'), `;
  }
}

function* generateThisTypeNode(_node: ts.ThisTypeNode) {
  yield `This`;
}

function* generateIntersectionTypeNode(
  node: ts.IntersectionTypeNode,
): IterableIterator<string> {
  const types = node.types.map((type) => collectNode(type)).join(",\n");
  yield `Type.Intersect([\n${types}\n])`;
}

function* generateTypeOperatorNode(
  node: ts.TypeOperatorNode,
): IterableIterator<string> {
  if (node.operator === ts.SyntaxKind.KeyOfKeyword) {
    const type = collectNode(node.type);
    yield `Type.KeyOf(${type})`;
  }

  if (node.operator === ts.SyntaxKind.ReadonlyKeyword) {
    yield `Type.Readonly(${collectNode(node.type)})`;
  }
}

function* generateParameter(
  node: ts.ParameterDeclaration,
): IterableIterator<string> {
  yield checkIsOptionalParameter(node)
    ? `Type.Optional(${collectNode(node.type)})`
    : collectNode(node.type);
}

function* generateFunctionTypeNode(
  node: ts.FunctionTypeNode,
): IterableIterator<string> {
  const parameters = node.parameters.map((
    parameter,
  ) => (parameter.dotDotDotToken !== undefined
    ? `...Type.Rest(${collectNode(parameter)})`
    : collectNode(parameter))
  ).join(", ");
  const returns = collectNode(node.type);
  yield `Type.Function([${parameters}], ${returns})`;
}

function* generateConstructorTypeNode(
  node: ts.ConstructorTypeNode,
): IterableIterator<string> {
  const parameters = node.parameters.map((param) => collectNode(param)).join(
    ", ",
  );
  const returns = collectNode(node.type);
  yield `Type.Constructor([${parameters}], ${returns})`;
}

function* generateEnumDeclaration(
  node: ts.EnumDeclaration,
): IterableIterator<string> {
  useImports = true;
  const exports = checkIsExport(node) ? "export " : "";
  const members = node.members.map((member) => member.getText()).join(", ");
  const enumType = `${exports}enum Enum${node.name.getText()} { ${members} }`;
  const staticType =
    `${exports}type ${node.name.getText()} = Static<typeof ${node.name.getText()}>`;
  const type =
    `${exports}const ${node.name.getText()} = Type.Enum(Enum${node.name.getText()})`;
  yield [enumType, "", staticType, type].join("\n");
}

function generatePropertiesFromTypeElementArray(
  members: DocNodeArray<ts.TypeElement>,
): string {
  const properties = members.filter((member) =>
    !ts.isIndexSignatureDeclaration(member)
  );
  const indexers = members.filter((member) =>
    ts.isIndexSignatureDeclaration(member)
  );
  const propertyCollect = properties.map((property) => collectNode(property))
    .join(",\n");
  const indexer = indexers.length > 0
    ? collectNode(indexers[indexers.length - 1])
    : "";
  if (properties.length === 0 && indexer.length > 0) {
    return `{},\n{\nadditionalProperties: ${indexer}\n }`;
  } else if (properties.length > 0 && indexer.length > 0) {
    return `{\n${propertyCollect}\n},\n{\nadditionalProperties: ${indexer}\n }`;
  } else {
    return `{\n${propertyCollect}\n}`;
  }
}

function* generateTypeLiteralNode(
  node: ts.TypeLiteralNode,
): IterableIterator<string> {
  const members = generatePropertiesFromTypeElementArray(node.members);
  yield* `Type.Object(${members})`;
}

// TODO: Implement.
function* generateInterfaceDeclaration(
  node: DocNodeInterface,
): IterableIterator<string> {
  useImports = true;
  const isRecursiveType = checkIsRecursiveType(node);
  if (isRecursiveType) {
    recursiveDeclaration = node;
  }

  // const heritage = node.heritageClauses !== undefined
  //   ? node.heritageClauses.flatMap((node) => collectNode(node))
  //   : [];
  if (node.interfaceDef.typeParams.length > 0) {
    useGenerics = true;
    const exports = checkIsExport(node.declarationKind) ? "export " : "";
    // const identifier = resolveIdentifier(node);
    // const options = useIdentifiers
    //   ? { ...resolveOptions(node), $id: identifier }
    //   : { ...resolveOptions(node) };

    // TODO: Fix.
    const constraints = node.interfaceDef.typeParams.map((param) =>
      `${collectNode(param)} extends TSchema`
    ).join(", ");
    const parameters = node.typeParameters.map((param) =>
      `${collectNode(param)}: ${collectNode(param)}`
    ).join(", ");
    const members = generatePropertiesFromTypeElementArray(node.members);
    const names = node.typeParameters.map((param) => `${collectNode(param)}`)
      .join(", ");
    const staticDeclaration =
      `${exports}type ${node.name.getText()}<${constraints}> = Static<ReturnType<typeof ${node.name.getText()}<${names}>>>`;
    const rawTypeExpression = checkIsRecursiveType(node)
      ? `Type.Recursive(This => Type.Object(${members}))`
      : `Type.Object(${members})`;
    const typeExpression = heritage.length === 0
      ? rawTypeExpression
      : `Type.Composite([${heritage.join(", ")}, ${rawTypeExpression}])`;
    const type = injectOptions(typeExpression, options);
    const typeDeclaration =
      `${exports}const ${node.name.getText()} = <${constraints}>(${parameters}) => ${type}`;
    yield `${staticDeclaration}\n${typeDeclaration}`;
  } else {
    const exports = checkIsExport(node) ? "export " : "";
    const identifier = resolveIdentifier(node);
    const options = useIdentifiers
      ? { ...resolveOptions(node), $id: identifier }
      : { ...resolveOptions(node) };
    const members = generatePropertiesFromTypeElementArray(node.members);
    const staticDeclaration =
      `${exports}type ${node.name.getText()} = Static<typeof ${node.name.getText()}>`;
    const rawTypeExpression = checkIsRecursiveType(node)
      ? `Type.Recursive(This => Type.Object(${members}))`
      : `Type.Object(${members})`;
    const typeExpression = heritage.length === 0
      ? rawTypeExpression
      : `Type.Composite([${heritage.join(", ")}, ${rawTypeExpression}])`;
    const type = injectOptions(typeExpression, options);
    const typeDeclaration = `${exports}const ${node.name.getText()} = ${type}`;
    yield `${staticDeclaration}\n${typeDeclaration}`;
  }

  recursiveDeclaration = null;
}

function* generateTypeAliasDeclaration(
  node: ts.TypeAliasDeclaration,
): IterableIterator<string> {
  useImports = true;
  const isRecursiveType = checkIsRecursiveType(node);
  if (isRecursiveType) {
    recursiveDeclaration = node;
  }

  // Generics case.
  if (node.typeParameters) {
    useGenerics = true;
    const exports = checkIsExport(node) ? "export " : "";
    const options = useIdentifiers ? { $id: resolveIdentifier(node) } : {};
    const constraints = node.typeParameters.map((param) =>
      `${collectNode(param)} extends TSchema`
    ).join(", ");
    const parameters = node.typeParameters.map((param) =>
      `${collectNode(param)}: ${collectNode(param)}`
    ).join(", ");
    const type_0 = collectNode(node.type);
    const type_1 = isRecursiveType
      ? `Type.Recursive(This => ${type_0})`
      : type_0;
    const type_2 = injectOptions(type_1, options);
    const names = node.typeParameters.map((param) => collectNode(param)).join(
      ", ",
    );
    const staticDeclaration =
      `${exports}type ${node.name.getText()}<${constraints}> = Static<ReturnType<typeof ${node.name.getText()}<${names}>>>`;
    const typeDeclaration =
      `${exports}const ${node.name.getText()} = <${constraints}>(${parameters}) => ${type_2}`;
    yield `${staticDeclaration}\n${typeDeclaration}`;
  } else {
    const exports = checkIsExport(node) ? "export " : "";
    const options = useIdentifiers
      ? { $id: resolveIdentifier(node), ...resolveOptions(node) }
      : { ...resolveOptions(node) };
    const type_0 = collectNode(node.type);
    const type_1 = isRecursiveType
      ? `Type.Recursive(This => ${type_0})`
      : type_0;
    const type_2 = injectOptions(type_1, options);
    const staticDeclaration =
      `${exports}type ${node.name.getText()} = Static<typeof ${node.name.getText()}>`;
    const typeDeclaration =
      `${exports}const ${node.name.getText()} = ${type_2}`;
    yield `${staticDeclaration}\n${typeDeclaration}`;
  }

  recursiveDeclaration = null;
}

function* generateHeritageClause(
  node: ts.HeritageClause,
): IterableIterator<string> {
  const types = node.types.map((node) => collectNode(node));
  // Note: Heritage clauses are only used in interface extends cases. We expect the
  // outer type to be a Composite, and where this type will be prepended before the
  // interface definition.
  yield types.join(", ");
}

function* generateIndexedAccessType(
  node: ts.IndexedAccessTypeNode,
): IterableIterator<string> {
  const obj = node.objectType.getText();
  const key = collectNode(node.indexType);
  yield `Type.Index(${obj}, ${key})`;
}

function* generateExpressionWithTypeArguments(
  node: ts.ExpressionWithTypeArguments,
): IterableIterator<string> {
  const name = collectNode(node.expression);
  const typeArguments = node.typeArguments === undefined
    ? []
    : node.typeArguments.map((node) => collectNode(node));
  // todo: default type argument (resolve `= number` from `type Foo<T = number>`)
  return yield typeArguments.length === 0
    ? `${name}`
    : `${name}(${typeArguments.join(", ")})`;
}

function* generateTypeParameterDeclaration(
  node: ts.TypeParameterDeclaration,
): IterableIterator<string> {
  yield node.name.getText();
}

function* generateParenthesizedTypeNode(
  node: ts.ParenthesizedTypeNode,
): IterableIterator<string> {
  yield collectNode(node.type);
}

function* generatePropertyAccessExpression(
  node: ts.PropertyAccessExpression,
): IterableIterator<string> {
  yield node.getText();
}

function* generateRestTypeNode(
  node: ts.RestTypeNode,
): IterableIterator<string> {
  yield `...Type.Rest(${node.type.getText()})`;
}

function* generateConditionalTypeNode(
  node: ts.ConditionalTypeNode,
): IterableIterator<string> {
  const checkType = collectNode(node.checkType);
  const extendsType = collectNode(node.extendsType);
  const trueType = collectNode(node.trueType);
  const falseType = collectNode(node.falseType);
  yield `Type.Extends(${checkType}, ${extendsType}, ${trueType}, ${falseType})`;
}

function* isIndexSignatureDeclaration(node: ts.IndexSignatureDeclaration) {
  // note: we ignore the key and just return the type. this is a mismatch between
  // object and record types. Address in TypeBox by unifying validation paths
  // for objects and record types.
  yield collectNode(node.type);
}

function* TypeReferenceNode(
  node: ts.TypeReferenceNode,
): IterableIterator<string> {
  const name = node.typeName.getText();
  const args = node.typeArguments
    ? `(${node.typeArguments.map((type) => collectNode(type)).join(", ")})`
    : "";
  // --------------------------------------------------------------
  // Instance Types
  // --------------------------------------------------------------
  if (name === "Date") return yield `Type.Date()`;
  if (name === "Uint8Array") return yield `Type.Uint8Array()`;
  if (name === "String") return yield `Type.String()`;
  if (name === "Number") return yield `Type.Number()`;
  if (name === "Boolean") return yield `Type.Boolean()`;
  if (name === "Function") return yield `Type.Function([], Type.Unknown())`;

  // --------------------------------------------------------------
  // Types
  // --------------------------------------------------------------
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
    recursiveDeclaration !== null &&
    findRecursiveParent(recursiveDeclaration, node)
  ) return yield `This`;
  if (
    findTypeName(node.getSourceFile(), name) &&
    args.length === 0 /** non-resolvable */
  ) {
    return yield `${name}${args}`;
  }

  if (name in globalThis) {
    return yield `Type.Never()`;
  }

  return yield `${name}${args}`;
}

function* generateLiteralTypeNode(
  node: ts.LiteralTypeNode,
): IterableIterator<string> {
  const text = node.getText();
  if (text === "null") {
    return yield `Type.Null()`;
  }

  yield `Type.Literal(${node.getText()})`;
}

function* generateNamedTupleMember(
  node: ts.NamedTupleMember,
): IterableIterator<string> {
  yield* collectNode(node.type);
}

function* generateModuleDeclaration(
  node: ts.ModuleDeclaration,
): IterableIterator<string> {
  const export_specifier = checkIsExport(node) ? "export " : "";
  const module_specifier = checkIsNamespace(node) ? "namespace" : "module";
  yield `${export_specifier}${module_specifier} ${node.name.getText()} {`;
  yield* visitNode(node.body);
  yield `}`;
}

function* generateModuleBlock(node: ts.ModuleBlock): IterableIterator<string> {
  for (const statement of node.statements) {
    yield* visitNode(statement);
  }
}

function* generateFunctionDeclaration(
  _node: ts.FunctionDeclaration,
): IterableIterator<string> {
  // ignore
}

function* generateClassDeclaration(
  _node: ts.ClassDeclaration,
): IterableIterator<string> {
  // ignore
}

/**
 * collectNode collects the TypeScript AST node and returns the TypeBox
 * representation as a string.
 */
function collectNode(node: DocNode | undefined): string {
  return `${[...visitNode(node)].join("")}`;
}

/**
 * visitNode generates the TypeBox representation of the TypeScript AST node.
 */
function* visitNode(node: DocNode | undefined): IterableIterator<string> {
  if (node === undefined) {
    return;
  }

  switch (node.kind) {
    case "class": {
      return yield* generateClassDeclaration(node);
    }

    case "function": {
      return yield* generateFunctionDeclaration(node);
    }

    case "enum": {
      return yield* generateEnumDeclaration(node);
    }

    case "typeAlias": {
      return yield* generateTypeAliasDeclaration(node);
    }

    case "interface": {
      return yield* generateInterfaceDeclaration(node);
    }

    default: {
      throw new Error(`Unhandled node type: ${node.kind}`);
    }
  }
}

function makeImportStatement(): string {
  if (!(useImports && useTypeBoxImport)) return "";
  const set = new Set<string>(["Type", "Static"]);
  if (useGenerics) {
    set.add("TSchema");
  }
  if (useOptions) {
    set.add("SchemaOptions");
  }
  if (useCloneType) {
    set.add("CloneType");
  }
  const imports = [...set].join(", ");
  return `import { ${imports} } from '@sinclair/typebox'`;
}

/** generate generates TypeBox types from TypeScript interface and type definitions */
export function generate(
  typescriptCode: string,
  options?: TypeScriptToTypeBoxOptions,
) {
  useExportsEverything = options?.useExportEverything ?? false;
  useIdentifiers = options?.useIdentifiers ?? false;
  useTypeBoxImport = options?.useTypeBoxImport ?? true;
  typenames.clear();
  useImports = false;
  useOptions = false;
  useGenerics = false;
  useCloneType = false;
  blockLevel = 0;
  const source = ts.createSourceFile(
    "types.ts",
    typescriptCode,
    ts.ScriptTarget.ESNext,
    true,
  );
  const declarations = [...visitNode(source)].join("\n\n");
  const imports = makeImportStatement();
  const typescript = [imports, "", "", declarations].join("\n");
  const assertion = ts.transpileModule(typescript, transpilerOptions);
  if (assertion.diagnostics && assertion.diagnostics.length > 0) {
    throw new TypeScriptToTypeBoxError(assertion.diagnostics);
  }

  return typescript;
}
