// Notice: Do NOT edit this generated file.
import type { ClassDef } from "@deno/doc";
import { walkClassConstructorDef } from "./walk-class-constructor-def.ts";
import { walkClassPropertyDef } from "./walk-class-property-def.ts";
import { walkClassIndexSignatureDef } from "./walk-class-index-signature-def.ts";
import { walkClassMethodDef } from "./walk-class-method-def.ts";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";
import { walkTsTypeParamDef } from "./walk-ts-type-param-def.ts";
import { walkDecoratorDef } from "./walk-decorator-def.ts";

export function* walkClassDef(
  node: ClassDef,
): Generator<unknown, void, unknown> {
  for (const value of node.constructors) {
    yield value;
    yield* walkClassConstructorDef(value);
  }
  for (const value of node.properties) {
    yield value;
    yield* walkClassPropertyDef(value);
  }
  for (const value of node.indexSignatures) {
    yield value;
    yield* walkClassIndexSignatureDef(value);
  }
  for (const value of node.methods) {
    yield value;
    yield* walkClassMethodDef(value);
  }
  for (const value of node.implements) {
    yield value;
    yield* walkTsTypeDef(value);
  }
  for (const value of node.typeParams) {
    yield value;
    yield* walkTsTypeParamDef(value);
  }
  for (const value of node.superTypeParams) {
    yield value;
    yield* walkTsTypeDef(value);
  }
  for (const value of node.decorators ?? []) {
    yield value;
    yield* walkDecoratorDef(value);
  }
}
