import type { TsTypePredicateDef } from "@deno/doc";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";

export function* walkTsTypePredicateDef(
  node: TsTypePredicateDef,
): Generator<unknown, void, unknown> {
  if (node.type !== undefined) {
    yield node.type;
    yield* walkTsTypeDef(node.type);
  }
}
