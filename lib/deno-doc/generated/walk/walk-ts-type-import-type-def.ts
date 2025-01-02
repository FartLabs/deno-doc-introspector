// Notice: Do NOT edit this generated file.
import type { TsTypeImportTypeDef } from "@deno/doc";
import { walkTsImportTypeDef } from "./walk-ts-import-type-def.ts";

export function* walkTsTypeImportTypeDef(
  node: TsTypeImportTypeDef,
): Generator<unknown, void, unknown> {
  yield node.importType;
  yield* walkTsImportTypeDef(node.importType);
}
