// Notice: Do NOT edit this generated file.
import type { TsTypeTypePredicateDef } from "@deno/doc";
import { walkTsTypePredicateDef } from "./walk-ts-type-predicate-def.ts";

export function* walkTsTypeTypePredicateDef(
  node: TsTypeTypePredicateDef,
): Generator<unknown, void, unknown> {
  yield node.typePredicate;
  yield* walkTsTypePredicateDef(node.typePredicate);
}
