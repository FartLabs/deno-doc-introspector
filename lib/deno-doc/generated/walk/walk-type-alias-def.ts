// Notice: Do NOT edit this generated file.
import type { TypeAliasDef } from "@deno/doc";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";
import { walkTsTypeParamDef } from "./walk-ts-type-param-def.ts";

export function* walkTypeAliasDef(
  node: TypeAliasDef,
): Generator<unknown, void, unknown> {
  yield node.tsType;
  yield* walkTsTypeDef(node.tsType);
  for (const value of node.typeParams) {
    yield value;
    yield* walkTsTypeParamDef(value);
  }
}
