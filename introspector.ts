import type { DocNode, DocNodeKind } from "@deno/doc";

export function findNode(
  nodes: DocNode[],
  query: DocNodeQuery,
): DocNode | undefined {
  return nodes.find((node) => check(node, query));
}

export function walkNodes(
  nodes: DocNode[],
  callback: (node: DocNode) => void,
): void {
  for (const node of nodes) {
    callback(node);
  }
}

export function check(node: DocNode, query: DocNodeQuery): boolean {
  if (query.kind !== undefined && node.kind !== query.kind) {
    return false;
  }

  if (query.name !== undefined && node.name !== query.name) {
    return false;
  }

  return true;
}

export interface DocNodeQuery {
  kind?: DocNodeKind;
  name?: string;
}
