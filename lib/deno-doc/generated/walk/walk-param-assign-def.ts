// Notice: Do NOT edit this generated file.
import type { ParamAssignDef } from "@deno/doc";
import { walkParamDef } from "./walk-param-def.ts";
import { walkDecoratorDef } from "./walk-decorator-def.ts";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";

export function* walkParamAssignDef(
  node: ParamAssignDef,
): Generator<unknown, void, unknown> {
  yield node.left;
  yield* walkParamDef(node.left);
  for (const value of node.decorators ?? []) {
    yield value;
    yield* walkDecoratorDef(value);
  }
  if (node.tsType !== undefined) {
    yield node.tsType;
    yield* walkTsTypeDef(node.tsType);
  }
}
