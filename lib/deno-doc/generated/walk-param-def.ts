import type { ParamDef } from "@deno/doc";
import { walkParamArrayDef } from "./walk-param-array-def.ts";
import { walkParamAssignDef } from "./walk-param-assign-def.ts";
import { walkParamIdentifierDef } from "./walk-param-identifier-def.ts";
import { walkParamObjectDef } from "./walk-param-object-def.ts";
import { walkParamRestDef } from "./walk-param-rest-def.ts";

export function* walkParamDef(
  node: ParamDef,
): Generator<unknown, void, unknown> {
  if (node.kind === "array") {
    return yield* walkParamArrayDef(node);
  }
  if (node.kind === "assign") {
    return yield* walkParamAssignDef(node);
  }
  if (node.kind === "identifier") {
    return yield* walkParamIdentifierDef(node);
  }
  if (node.kind === "object") {
    return yield* walkParamObjectDef(node);
  }
  if (node.kind === "rest") {
    return yield* walkParamRestDef(node);
  }
}
