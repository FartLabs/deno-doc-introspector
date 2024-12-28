// Notice: Do NOT edit this generated file.
import type { DocNodeNamespace } from "@deno/doc";
import { walkNamespaceDef } from "./walk-namespace-def.ts";

export function* walkDocNodeNamespace(
  node: DocNodeNamespace,
): Generator<unknown, void, unknown> {
  yield node.namespaceDef;
  yield* walkNamespaceDef(node.namespaceDef);
}
