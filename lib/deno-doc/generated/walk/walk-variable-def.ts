// Notice: Do NOT edit this generated file.
import type { VariableDef } from "@deno/doc";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";

export function* walkVariableDef(
  node: VariableDef,
): Generator<unknown, void, unknown> {
  if (node.tsType !== undefined) {
    yield node.tsType;
    yield* walkTsTypeDef(node.tsType);
  }
}
