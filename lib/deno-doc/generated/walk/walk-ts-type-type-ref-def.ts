// Notice: Do NOT edit this generated file.
import type { TsTypeTypeRefDef } from "@deno/doc";
import { walkTsTypeRefDef } from "./walk-ts-type-ref-def.ts";

export function* walkTsTypeTypeRefDef(
  node: TsTypeTypeRefDef,
): Generator<unknown, void, unknown> {
  yield node.typeRef;
  yield* walkTsTypeRefDef(node.typeRef);
}
