import type { InterfaceDef } from "@deno/doc";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";
import { walkInterfaceMethodDef } from "./walk-interface-method-def.ts";
import { walkInterfacePropertyDef } from "./walk-interface-property-def.ts";
import { walkInterfaceCallSignatureDef } from "./walk-interface-call-signature-def.ts";
import { walkInterfaceIndexSignatureDef } from "./walk-interface-index-signature-def.ts";
import { walkTsTypeParamDef } from "./walk-ts-type-param-def.ts";

export function* walkInterfaceDef(
  node: InterfaceDef,
): Generator<unknown, void, unknown> {
  for (const value of node.extends) {
    yield value;
    yield* walkTsTypeDef(value);
  }
  for (const value of node.methods) {
    yield value;
    yield* walkInterfaceMethodDef(value);
  }
  for (const value of node.properties) {
    yield value;
    yield* walkInterfacePropertyDef(value);
  }
  for (const value of node.callSignatures) {
    yield value;
    yield* walkInterfaceCallSignatureDef(value);
  }
  for (const value of node.indexSignatures) {
    yield value;
    yield* walkInterfaceIndexSignatureDef(value);
  }
  for (const value of node.typeParams) {
    yield value;
    yield* walkTsTypeParamDef(value);
  }
}
