import { DocNode } from "@deno/doc";
import { walkDocNode } from "#/lib/deno-doc/generated/walk-doc-node.ts";

export function checkRecursive(docNode: DocNode): boolean {
  for (const childNode of walkDocNode(docNode) as Iterable<DocNode>) {
    if (childNode.kind === docNode.kind && childNode.name === docNode.name) {
      return true;
    }
  }

  return false;
}
