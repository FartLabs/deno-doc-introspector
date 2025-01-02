// Notice: Do NOT edit this generated file.
import type { ClassPropertyDef } from "@deno/doc";
import { walkJsDoc } from "./walk-js-doc.ts";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";
import { walkDecoratorDef } from "./walk-decorator-def.ts";

export function* walkClassPropertyDef(
  node: ClassPropertyDef,
): Generator<unknown, void, unknown> {
  if (node.jsDoc !== undefined) {
    yield node.jsDoc;
    yield* walkJsDoc(node.jsDoc);
  }
  if (node.tsType !== undefined) {
    yield node.tsType;
    yield* walkTsTypeDef(node.tsType);
  }
  for (const value of node.decorators ?? []) {
    yield value;
    yield* walkDecoratorDef(value);
  }
}
