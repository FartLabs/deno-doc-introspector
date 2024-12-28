import type { EnumMemberDef } from "@deno/doc";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";
import { walkJsDoc } from "./walk-js-doc.ts";

export function* walkEnumMemberDef(
  node: EnumMemberDef,
): Generator<unknown, void, unknown> {
  if (node.init !== undefined) {
    yield node.init;
    yield* walkTsTypeDef(node.init);
  }
  if (node.jsDoc !== undefined) {
    yield node.jsDoc;
    yield* walkJsDoc(node.jsDoc);
  }
}
