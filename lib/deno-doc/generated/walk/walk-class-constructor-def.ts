// Notice: Do NOT edit this generated file.
import type { ClassConstructorDef } from "@deno/doc";
import { walkJsDoc } from "./walk-js-doc.ts";
import { walkClassConstructorParamDef } from "./walk-class-constructor-param-def.ts";

export function* walkClassConstructorDef(
  node: ClassConstructorDef,
): Generator<unknown, void, unknown> {
  if (node.jsDoc !== undefined) {
    yield node.jsDoc;
    yield* walkJsDoc(node.jsDoc);
  }
  for (const value of node.params) {
    yield value;
    yield* walkClassConstructorParamDef(value);
  }
}
