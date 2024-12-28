import { DocNode, TsTypeDef } from "@deno/doc";
import { walkDocNode } from "#/lib/deno-doc/generated/walk-doc-node.ts";

export function checkRecursive(docNode: DocNode): boolean {
  for (const childNode of walkDocNode(docNode) as Iterable<TsTypeDef>) {
    if (
      childNode.kind === "typeRef" &&
      childNode.typeRef.typeName === docNode.name
    ) {
      return true;
    }
  }

  return false;
}
