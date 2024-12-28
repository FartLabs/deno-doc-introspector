import type { LiteralIndexSignatureDef } from "@deno/doc";
import { walkParamDef } from "./walk-param-def.ts";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";

export function* walkLiteralIndexSignatureDef(
  node: LiteralIndexSignatureDef,
): Generator<unknown, void, unknown> {
  for (const value of node.params) {
    yield value;
    yield* walkParamDef(value);
  }
  if (node.tsType !== undefined) {
    yield node.tsType;
    yield* walkTsTypeDef(node.tsType);
  }
}
