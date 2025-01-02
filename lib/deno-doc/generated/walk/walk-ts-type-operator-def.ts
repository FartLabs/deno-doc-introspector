// Notice: Do NOT edit this generated file.
import type { TsTypeOperatorDef } from "@deno/doc";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";

export function* walkTsTypeOperatorDef(
  node: TsTypeOperatorDef,
): Generator<unknown, void, unknown> {
  yield node.tsType;
  yield* walkTsTypeDef(node.tsType);
}
