// Notice: Do NOT edit this generated file.
import type { DocNodeTypeAlias } from "@deno/doc";
import { walkTypeAliasDef } from "./walk-type-alias-def.ts";

export function* walkDocNodeTypeAlias(
  node: DocNodeTypeAlias,
): Generator<unknown, void, unknown> {
  yield node.typeAliasDef;
  yield* walkTypeAliasDef(node.typeAliasDef);
}
