// Notice: Do NOT edit this generated file.
import type { TsIndexedAccessDef } from "@deno/doc";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";

export function* walkTsIndexedAccessDef(
  node: TsIndexedAccessDef,
): Generator<unknown, void, unknown> {
  yield node.objType;
  yield* walkTsTypeDef(node.objType);
  yield node.indexType;
  yield* walkTsTypeDef(node.indexType);
}
