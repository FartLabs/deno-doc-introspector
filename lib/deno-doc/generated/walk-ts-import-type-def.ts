import type { TsImportTypeDef } from "@deno/doc";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";

export function* walkTsImportTypeDef(
  node: TsImportTypeDef,
): Generator<unknown, void, unknown> {
  for (const value of node.typeParams ?? []) {
    yield value;
    yield* walkTsTypeDef(value);
  }
}
