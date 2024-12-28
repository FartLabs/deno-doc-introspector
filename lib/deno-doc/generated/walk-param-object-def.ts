import type { ParamObjectDef } from "@deno/doc";
import { walkObjectPatPropDef } from "./walk-object-pat-prop-def.ts";
import { walkDecoratorDef } from "./walk-decorator-def.ts";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";

export function* walkParamObjectDef(
  node: ParamObjectDef,
): Generator<unknown, void, unknown> {
  for (const value of node.props) {
    yield value;
    yield* walkObjectPatPropDef(value);
  }
  for (const value of node.decorators ?? []) {
    yield value;
    yield* walkDecoratorDef(value);
  }
  if (node.tsType !== undefined) {
    yield node.tsType;
    yield* walkTsTypeDef(node.tsType);
  }
}
