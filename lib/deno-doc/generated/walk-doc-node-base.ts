import type { DocNodeBase } from "@deno/doc";
import { walkJsDoc } from "./walk-js-doc.ts";

export function* walkDocNodeBase(
  node: DocNodeBase,
): Generator<unknown, void, unknown> {
  if (node.jsDoc !== undefined) {
    yield node.jsDoc;
    yield* walkJsDoc(node.jsDoc);
  }
}
