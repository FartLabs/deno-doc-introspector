// Notice: Do NOT edit this generated file.
import type { TsTypeArrayDef } from "@deno/doc";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";

export function* walkTsTypeArrayDef(
  node: TsTypeArrayDef,
): Generator<unknown, void, unknown> {
  yield node.array;
  yield* walkTsTypeDef(node.array);
}
