// Notice: Do NOT edit this generated file.
import type { InterfaceMethodDef } from "@deno/doc";
import { walkJsDoc } from "./walk-js-doc.ts";
import { walkParamDef } from "./walk-param-def.ts";
import { walkTsTypeDef } from "./walk-ts-type-def.ts";
import { walkTsTypeParamDef } from "./walk-ts-type-param-def.ts";

export function* walkInterfaceMethodDef(
  node: InterfaceMethodDef,
): Generator<unknown, void, unknown> {
  if (node.jsDoc !== undefined) {
    yield node.jsDoc;
    yield* walkJsDoc(node.jsDoc);
  }
  for (const value of node.params) {
    yield value;
    yield* walkParamDef(value);
  }
  if (node.returnType !== undefined) {
    yield node.returnType;
    yield* walkTsTypeDef(node.returnType);
  }
  for (const value of node.typeParams) {
    yield value;
    yield* walkTsTypeParamDef(value);
  }
}
