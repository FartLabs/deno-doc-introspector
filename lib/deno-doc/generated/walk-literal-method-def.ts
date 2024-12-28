import type { LiteralMethodDef } from "@deno/doc";
import { walkParamDef } from "./walk-param-def.ts";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";
import { walkTsTypeParamDef } from "./walk-ts-type-param-def.ts";

export function* walkLiteralMethodDef(
  node: LiteralMethodDef,
): Generator<unknown, void, unknown> {
  for (const value of node.params) {
    yield value;
    yield* walkParamDef(value);
  }
  if (node.returnType !== undefined) {
    yield node.returnType;
    yield* walkTsTypeDef(node.returnType);
  }
  for (const value of node.typeParams) {
    yield value;
    yield* walkTsTypeParamDef(value);
  }
}
