// Notice: Do NOT edit this generated file.
import type { LiteralCallSignatureDef } from "@deno/doc";
import { walkParamDef } from "./walk-param-def.ts";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";
import { walkTsTypeParamDef } from "./walk-ts-type-param-def.ts";

export function* walkLiteralCallSignatureDef(
  node: LiteralCallSignatureDef,
): Generator<unknown, void, unknown> {
  for (const value of node.params) {
    yield value;
    yield* walkParamDef(value);
  }
  if (node.tsType !== undefined) {
    yield node.tsType;
    yield* walkTsTypeDef(node.tsType);
  }
  for (const value of node.typeParams) {
    yield value;
    yield* walkTsTypeParamDef(value);
  }
}
