// Notice: Do NOT edit this generated file.
import type { TsTypeIntersectionDef } from "@deno/doc";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";

export function* walkTsTypeIntersectionDef(
  node: TsTypeIntersectionDef,
): Generator<unknown, void, unknown> {
  for (const value of node.intersection) {
    yield value;
    yield* walkTsTypeDef(value);
  }
}
