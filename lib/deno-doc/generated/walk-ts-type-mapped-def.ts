import type { TsTypeMappedDef } from "@deno/doc";
import { walkTsMappedTypeDef } from "./walk-ts-mapped-type-def.ts";

export function* walkTsTypeMappedDef(
  node: TsTypeMappedDef,
): Generator<unknown, void, unknown> {
  yield node.mappedType;
  yield* walkTsMappedTypeDef(node.mappedType);
}
