import type { TsTypeUnionDef } from "@deno/doc";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";

export function* walkTsTypeUnionDef(
  node: TsTypeUnionDef,
): Generator<unknown, void, unknown> {
  for (const value of node.union) {
    yield value;
    yield* walkTsTypeDef(value);
  }
}
