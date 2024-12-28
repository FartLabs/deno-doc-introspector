import type { DocNodeFunction } from "@deno/doc";
import { walkFunctionDef } from "./walk-function-def.ts";

export function* walkDocNodeFunction(
  node: DocNodeFunction,
): Generator<unknown, void, unknown> {
  yield node.functionDef;
  yield* walkFunctionDef(node.functionDef);
}
