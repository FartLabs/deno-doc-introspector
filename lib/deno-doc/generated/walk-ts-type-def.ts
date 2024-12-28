import type { TsTypeDef } from "@deno/doc";
import { walkTsTypeDefLiteral } from "./walk-ts-type-def-literal.ts";
import { walkTsTypeTypeRefDef } from "./walk-ts-type-type-ref-def.ts";
import { walkTsTypeUnionDef } from "./walk-ts-type-union-def.ts";
import { walkTsTypeIntersectionDef } from "./walk-ts-type-intersection-def.ts";
import { walkTsTypeArrayDef } from "./walk-ts-type-array-def.ts";
import { walkTsTypeTupleDef } from "./walk-ts-type-tuple-def.ts";
import { walkTsTypeTypeOperatorDef } from "./walk-ts-type-type-operator-def.ts";
import { walkTsTypeParenthesizedDef } from "./walk-ts-type-parenthesized-def.ts";
import { walkTsTypeRestDef } from "./walk-ts-type-rest-def.ts";
import { walkTsTypeOptionalDef } from "./walk-ts-type-optional-def.ts";
import { walkTsTypeFnOrConstructorDef } from "./walk-ts-type-fn-or-constructor-def.ts";
import { walkTsTypeConditionalDef } from "./walk-ts-type-conditional-def.ts";
import { walkTsTypeImportTypeDef } from "./walk-ts-type-import-type-def.ts";
import { walkTsTypeInferDef } from "./walk-ts-type-infer-def.ts";
import { walkTsTypeIndexedAccessDef } from "./walk-ts-type-indexed-access-def.ts";
import { walkTsTypeMappedDef } from "./walk-ts-type-mapped-def.ts";
import { walkTsTypeTypeLiteralDef } from "./walk-ts-type-type-literal-def.ts";
import { walkTsTypeTypePredicateDef } from "./walk-ts-type-type-predicate-def.ts";

export function* walkTsTypeDef(
  node: TsTypeDef,
): Generator<unknown, void, unknown> {
  if (node.kind === "literal") {
    return yield* walkTsTypeDefLiteral(node);
  }
  if (node.kind === "typeRef") {
    return yield* walkTsTypeTypeRefDef(node);
  }
  if (node.kind === "union") {
    return yield* walkTsTypeUnionDef(node);
  }
  if (node.kind === "intersection") {
    return yield* walkTsTypeIntersectionDef(node);
  }
  if (node.kind === "array") {
    return yield* walkTsTypeArrayDef(node);
  }
  if (node.kind === "tuple") {
    return yield* walkTsTypeTupleDef(node);
  }
  if (node.kind === "typeOperator") {
    return yield* walkTsTypeTypeOperatorDef(node);
  }
  if (node.kind === "parenthesized") {
    return yield* walkTsTypeParenthesizedDef(node);
  }
  if (node.kind === "rest") {
    return yield* walkTsTypeRestDef(node);
  }
  if (node.kind === "optional") {
    return yield* walkTsTypeOptionalDef(node);
  }
  if (node.kind === "fnOrConstructor") {
    return yield* walkTsTypeFnOrConstructorDef(node);
  }
  if (node.kind === "conditional") {
    return yield* walkTsTypeConditionalDef(node);
  }
  if (node.kind === "importType") {
    return yield* walkTsTypeImportTypeDef(node);
  }
  if (node.kind === "infer") {
    return yield* walkTsTypeInferDef(node);
  }
  if (node.kind === "indexedAccess") {
    return yield* walkTsTypeIndexedAccessDef(node);
  }
  if (node.kind === "mapped") {
    return yield* walkTsTypeMappedDef(node);
  }
  if (node.kind === "typeLiteral") {
    return yield* walkTsTypeTypeLiteralDef(node);
  }
  if (node.kind === "typePredicate") {
    return yield* walkTsTypeTypePredicateDef(node);
  }
}
