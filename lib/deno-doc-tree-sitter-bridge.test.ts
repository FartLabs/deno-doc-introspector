import { assertEquals } from "@std/assert";
import { exists } from "@std/fs";
import { findNode } from "#/introspector.ts";
import { makePatternByDocNodeClass } from "./deno-doc-tree-sitter-bridge.ts";
import { docNodes } from "./data.ts";
import { personClassPattern } from "./data/person-class-pattern.ts";

// TODO: Reconsider developer ergonomics for this pattern test data generation.
const docNodePersonClass = findNode(
  docNodes.get("person-class.ts")!,
  { kind: "class", name: "Person" },
)!;

const filePersonClassPattern = new URL(
  import.meta.resolve("./data/person-class-pattern.ts"),
);
if (!(await exists(filePersonClassPattern))) {
  await Deno.writeTextFile(
    filePersonClassPattern,
    `export const personClassPattern = \`${
      makePatternByDocNodeClass(docNodePersonClass)
    }\`;\n`,
  );
}

Deno.test("makePatternByDocNodeClass makes example pattern", () => {
  const actual = makePatternByDocNodeClass(docNodePersonClass);
  assertEquals(actual, personClassPattern);
});
