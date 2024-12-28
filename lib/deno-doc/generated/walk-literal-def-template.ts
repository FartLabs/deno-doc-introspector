// Notice: Do NOT edit this generated file.
import type { LiteralDefTemplate } from "@deno/doc";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";

export function* walkLiteralDefTemplate(
  node: LiteralDefTemplate,
): Generator<unknown, void, unknown> {
  for (const value of node.tsTypes) {
    yield value;
    yield* walkTsTypeDef(value);
  }
}
