import type { TsTypeInferDef } from "@deno/doc";
import { walkTsInferDef } from "./walk-ts-infer-def.ts";

export function* walkTsTypeInferDef(
  node: TsTypeInferDef,
): Generator<unknown, void, unknown> {
  yield node.infer;
  yield* walkTsInferDef(node.infer);
}
