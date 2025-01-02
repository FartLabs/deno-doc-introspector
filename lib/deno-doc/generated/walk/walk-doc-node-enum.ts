// Notice: Do NOT edit this generated file.
import type { DocNodeEnum } from "@deno/doc";
import { walkEnumDef } from "./walk-enum-def.ts";

export function* walkDocNodeEnum(
  node: DocNodeEnum,
): Generator<unknown, void, unknown> {
  yield node.enumDef;
  yield* walkEnumDef(node.enumDef);
}
