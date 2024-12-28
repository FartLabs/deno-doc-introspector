// Notice: Do NOT edit this generated file.
import type { DocNodeModuleDoc } from "@deno/doc";
import { walkJsDoc } from "./walk-js-doc.ts";

export function* walkDocNodeModuleDoc(
  node: DocNodeModuleDoc,
): Generator<unknown, void, unknown> {
  yield node.jsDoc;
  yield* walkJsDoc(node.jsDoc);
}
