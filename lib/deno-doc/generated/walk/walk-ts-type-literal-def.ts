// Notice: Do NOT edit this generated file.
import type { TsTypeLiteralDef } from "@deno/doc";
import { walkLiteralMethodDef } from "./walk-literal-method-def.ts";
import { walkLiteralPropertyDef } from "./walk-literal-property-def.ts";
import { walkLiteralCallSignatureDef } from "./walk-literal-call-signature-def.ts";
import { walkLiteralIndexSignatureDef } from "./walk-literal-index-signature-def.ts";

export function* walkTsTypeLiteralDef(
  node: TsTypeLiteralDef,
): Generator<unknown, void, unknown> {
  for (const value of node.methods) {
    yield value;
    yield* walkLiteralMethodDef(value);
  }
  for (const value of node.properties) {
    yield value;
    yield* walkLiteralPropertyDef(value);
  }
  for (const value of node.callSignatures) {
    yield value;
    yield* walkLiteralCallSignatureDef(value);
  }
  for (const value of node.indexSignatures) {
    yield value;
    yield* walkLiteralIndexSignatureDef(value);
  }
}
