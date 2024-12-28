import type { DocNodeVariable } from "@deno/doc";
import { walkVariableDef } from "./walk-variable-def.ts";

export function* walkDocNodeVariable(
  node: DocNodeVariable,
): Generator<unknown, void, unknown> {
  yield node.variableDef;
  yield* walkVariableDef(node.variableDef);
}
