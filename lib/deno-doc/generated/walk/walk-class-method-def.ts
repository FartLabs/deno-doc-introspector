// Notice: Do NOT edit this generated file.
import type { ClassMethodDef } from "@deno/doc";
import { walkJsDoc } from "./walk-js-doc.ts";
import { walkFunctionDef } from "./walk-function-def.ts";

export function* walkClassMethodDef(
  node: ClassMethodDef,
): Generator<unknown, void, unknown> {
  if (node.jsDoc !== undefined) {
    yield node.jsDoc;
    yield* walkJsDoc(node.jsDoc);
  }
  yield node.functionDef;
  yield* walkFunctionDef(node.functionDef);
}
