// Notice: Do NOT edit this generated file.
import type { TsFnOrConstructorDef } from "@deno/doc";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";
import { walkParamDef } from "./walk-param-def.ts";
import { walkTsTypeParamDef } from "./walk-ts-type-param-def.ts";

export function* walkTsFnOrConstructorDef(
  node: TsFnOrConstructorDef,
): Generator<unknown, void, unknown> {
  yield node.tsType;
  yield* walkTsTypeDef(node.tsType);
  for (const value of node.params) {
    yield value;
    yield* walkParamDef(value);
  }
  for (const value of node.typeParams) {
    yield value;
    yield* walkTsTypeParamDef(value);
  }
}
