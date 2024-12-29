// Notice: Do NOT edit this generated file.
import type { ParamRestDef } from "@deno/doc";
import { walkParamDef } from "./walk-param-def.ts";
import { walkDecoratorDef } from "./walk-decorator-def.ts";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";

export function* walkParamRestDef(
  node: ParamRestDef,
): Generator<unknown, void, unknown> {
  yield node.arg;
  yield* walkParamDef(node.arg);
  for (const value of node.decorators ?? []) {
    yield value;
    yield* walkDecoratorDef(value);
  }
  if (node.tsType !== undefined) {
    yield node.tsType;
    yield* walkTsTypeDef(node.tsType);
  }
}
