// Notice: Do NOT edit this generated file.
import type { ParamArrayDef } from "@deno/doc";
import { walkDecoratorDef } from "./walk-decorator-def.ts";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";

export function* walkParamArrayDef(
  node: ParamArrayDef,
): Generator<unknown, void, unknown> {
  for (const value of node.decorators ?? []) {
    yield value;
    yield* walkDecoratorDef(value);
  }
  if (node.tsType !== undefined) {
    yield node.tsType;
    yield* walkTsTypeDef(node.tsType);
  }
}
