import type { DocNode, DocNodeKind } from "@deno/doc";

export function findAll<TQuery extends DocNodeQuery>(
  nodes: DocNode[],
  query: TQuery,
): DocNodeOf<TQuery["kind"]>[] {
  return nodes
    .filter((node) => checkNode(node, query)) as DocNodeOf<TQuery["kind"]>[];
}

export function findDocNode<TQuery extends DocNodeQuery>(
  nodes: DocNode[],
  query: TQuery,
): DocNodeOf<TQuery["kind"]> | undefined {
  return nodes
    .find((node) => checkNode(node, query)) as
      | DocNodeOf<TQuery["kind"]>
      | undefined;
}

export function checkNode(node: DocNode, query: DocNodeQuery): boolean {
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

export function isDocNodeOf<T extends DocNodeKind | undefined>(
  node: DocNode,
  kind: T,
): node is DocNodeOf<T> {
  return kind === undefined || node.kind === kind;
}

export type DocNodeOf<TKind extends DocNodeKind | undefined> = TKind extends
  undefined ? DocNode
  : Extract<DocNode, { kind: TKind }>;
