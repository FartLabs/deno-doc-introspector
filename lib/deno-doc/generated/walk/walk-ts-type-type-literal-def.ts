// Notice: Do NOT edit this generated file.
import type { TsTypeTypeLiteralDef } from "@deno/doc";
import { walkTsTypeLiteralDef } from "./walk-ts-type-literal-def.ts";

export function* walkTsTypeTypeLiteralDef(
  node: TsTypeTypeLiteralDef,
): Generator<unknown, void, unknown> {
  yield node.typeLiteral;
  yield* walkTsTypeLiteralDef(node.typeLiteral);
}
