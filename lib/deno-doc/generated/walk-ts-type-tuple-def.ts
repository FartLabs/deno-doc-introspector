// Notice: Do NOT edit this generated file.
import type { TsTypeTupleDef } from "@deno/doc";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";

export function* walkTsTypeTupleDef(
  node: TsTypeTupleDef,
): Generator<unknown, void, unknown> {
  for (const value of node.tuple) {
    yield value;
    yield* walkTsTypeDef(value);
  }
}
