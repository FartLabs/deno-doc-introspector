// Notice: Do NOT edit this generated file.
import type { TsTypeParamDef } from "@deno/doc";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";

export function* walkTsTypeParamDef(
  node: TsTypeParamDef,
): Generator<unknown, void, unknown> {
  if (node.constraint !== undefined) {
    yield node.constraint;
    yield* walkTsTypeDef(node.constraint);
  }
  if (node.default !== undefined) {
    yield node.default;
    yield* walkTsTypeDef(node.default);
  }
}
