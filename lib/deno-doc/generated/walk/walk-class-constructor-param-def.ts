// Notice: Do NOT edit this generated file.
import type { ClassConstructorParamDef } from "@deno/doc";
import { walkParamDef } from "./walk-param-def.ts";

export function* walkClassConstructorParamDef(
  node: ClassConstructorParamDef,
): Generator<unknown, void, unknown> {
  if (node.kind === "array") {
    return yield* walkParamDef(node);
  }
  if (node.kind === "assign") {
    return yield* walkParamDef(node);
  }
  if (node.kind === "identifier") {
    return yield* walkParamDef(node);
  }
  if (node.kind === "object") {
    return yield* walkParamDef(node);
  }
  if (node.kind === "rest") {
    return yield* walkParamDef(node);
  }
}
