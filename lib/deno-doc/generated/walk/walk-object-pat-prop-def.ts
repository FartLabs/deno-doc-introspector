// Notice: Do NOT edit this generated file.
import type { ObjectPatPropDef } from "@deno/doc";
import { walkObjectPatPropKeyValueDef } from "./walk-object-pat-prop-key-value-def.ts";
import { walkObjectPatPropRestDef } from "./walk-object-pat-prop-rest-def.ts";

export function* walkObjectPatPropDef(
  node: ObjectPatPropDef,
): Generator<unknown, void, unknown> {
  if (node.kind === "keyValue") {
    return yield* walkObjectPatPropKeyValueDef(node);
  }
  if (node.kind === "rest") {
    return yield* walkObjectPatPropRestDef(node);
  }
}
