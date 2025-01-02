// Notice: Do NOT edit this generated file.
import type { TsMappedTypeDef } from "@deno/doc";
import { walkTsTypeParamDef } from "./walk-ts-type-param-def.ts";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";

export function* walkTsMappedTypeDef(
  node: TsMappedTypeDef,
): Generator<unknown, void, unknown> {
  yield node.typeParam;
  yield* walkTsTypeParamDef(node.typeParam);
  if (node.nameType !== undefined) {
    yield node.nameType;
    yield* walkTsTypeDef(node.nameType);
  }
  if (node.tsType !== undefined) {
    yield node.tsType;
    yield* walkTsTypeDef(node.tsType);
  }
}
