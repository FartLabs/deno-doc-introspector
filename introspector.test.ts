import { assertEquals } from "@std/assert";
import type { DocNode } from "@deno/doc";
import { checkNode } from "./introspector.ts";
import docNodes from "./nodes.json" with { type: "json" };

const nodes = docNodes.nodes as unknown as DocNode[];

Deno.test("checkNode", () => {
  const node = nodes.find((node) => checkNode(node, { name: "Person" }));
  assertEquals(node?.kind, "class");
});
