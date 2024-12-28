// Notice: Do NOT edit this generated file.
import type { JsDoc } from "@deno/doc";
import { walkJsDocTag } from "./walk-js-doc-tag.ts";

export function* walkJsDoc(node: JsDoc): Generator<unknown, void, unknown> {
  for (const value of node.tags ?? []) {
    yield value;
    yield* walkJsDocTag(value);
  }
}
