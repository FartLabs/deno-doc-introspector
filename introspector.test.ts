import { assertEquals } from "@std/assert";
import type { DocNode } from "@deno/doc";
import { findNode } from "./introspector.ts";
import docNodes from "./nodes.json" with { type: "json" };

const nodes = docNodes.nodes as unknown as DocNode[];

Deno.test("findNode", () => {
  const node = findNode(nodes, { name: "Person" });
  assertEquals(node?.kind, "class");
});
