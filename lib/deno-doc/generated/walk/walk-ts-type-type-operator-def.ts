// Notice: Do NOT edit this generated file.
import type { TsTypeTypeOperatorDef } from "@deno/doc";
import { walkTsTypeOperatorDef } from "./walk-ts-type-operator-def.ts";

export function* walkTsTypeTypeOperatorDef(
  node: TsTypeTypeOperatorDef,
): Generator<unknown, void, unknown> {
  yield node.typeOperator;
  yield* walkTsTypeOperatorDef(node.typeOperator);
}
