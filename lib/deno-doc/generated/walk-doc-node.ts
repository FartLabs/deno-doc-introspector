import type { DocNode } from "@deno/doc";
import { walkDocNodeModuleDoc } from "./walk-doc-node-module-doc.ts";
import { walkDocNodeFunction } from "./walk-doc-node-function.ts";
import { walkDocNodeVariable } from "./walk-doc-node-variable.ts";
import { walkDocNodeEnum } from "./walk-doc-node-enum.ts";
import { walkDocNodeClass } from "./walk-doc-node-class.ts";
import { walkDocNodeTypeAlias } from "./walk-doc-node-type-alias.ts";
import { walkDocNodeNamespace } from "./walk-doc-node-namespace.ts";
import { walkDocNodeInterface } from "./walk-doc-node-interface.ts";
import { walkDocNodeImport } from "./walk-doc-node-import.ts";

export function* walkDocNode(node: DocNode): Generator<unknown, void, unknown> {
  if (node.kind === "moduleDoc") {
    return yield* walkDocNodeModuleDoc(node);
  }
  if (node.kind === "function") {
    return yield* walkDocNodeFunction(node);
  }
  if (node.kind === "variable") {
    return yield* walkDocNodeVariable(node);
  }
  if (node.kind === "enum") {
    return yield* walkDocNodeEnum(node);
  }
  if (node.kind === "class") {
    return yield* walkDocNodeClass(node);
  }
  if (node.kind === "typeAlias") {
    return yield* walkDocNodeTypeAlias(node);
  }
  if (node.kind === "namespace") {
    return yield* walkDocNodeNamespace(node);
  }
  if (node.kind === "interface") {
    return yield* walkDocNodeInterface(node);
  }
  if (node.kind === "import") {
    return yield* walkDocNodeImport(node);
  }
}
