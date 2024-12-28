// Notice: Do NOT edit this generated file.
import type { DocNodeInterface } from "@deno/doc";
import { walkInterfaceDef } from "./walk-interface-def.ts";

export function* walkDocNodeInterface(
  node: DocNodeInterface,
): Generator<unknown, void, unknown> {
  yield node.interfaceDef;
  yield* walkInterfaceDef(node.interfaceDef);
}
