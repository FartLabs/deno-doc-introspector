// Notice: Do NOT edit this generated file.
import type { TsTypeConditionalDef } from "@deno/doc";
import { walkTsConditionalDef } from "./walk-ts-conditional-def.ts";

export function* walkTsTypeConditionalDef(
  node: TsTypeConditionalDef,
): Generator<unknown, void, unknown> {
  yield node.conditionalType;
  yield* walkTsConditionalDef(node.conditionalType);
}
