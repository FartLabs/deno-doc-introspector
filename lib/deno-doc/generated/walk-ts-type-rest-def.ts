// Notice: Do NOT edit this generated file.
import type { TsTypeRestDef } from "@deno/doc";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";

export function* walkTsTypeRestDef(
  node: TsTypeRestDef,
): Generator<unknown, void, unknown> {
  yield node.rest;
  yield* walkTsTypeDef(node.rest);
}
