// Notice: Do NOT edit this generated file.
import type { TsTypeParenthesizedDef } from "@deno/doc";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";

export function* walkTsTypeParenthesizedDef(
  node: TsTypeParenthesizedDef,
): Generator<unknown, void, unknown> {
  yield node.parenthesized;
  yield* walkTsTypeDef(node.parenthesized);
}
