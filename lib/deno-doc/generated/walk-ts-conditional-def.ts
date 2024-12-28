import type { TsConditionalDef } from "@deno/doc";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";

export function* walkTsConditionalDef(
  node: TsConditionalDef,
): Generator<unknown, void, unknown> {
  yield node.checkType;
  yield* walkTsTypeDef(node.checkType);
  yield node.extendsType;
  yield* walkTsTypeDef(node.extendsType);
  yield node.trueType;
  yield* walkTsTypeDef(node.trueType);
  yield node.falseType;
  yield* walkTsTypeDef(node.falseType);
}
