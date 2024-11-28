import { assertEquals } from "@std/assert";
import { parserFromWasm } from "deno-tree-sitter/main.js";
import typescript from "common-tree-sitter-languages/typescript.js";
import { findDocNode } from "#/introspector.ts";
import { findTreeSitterClassByDocNodeClass } from "./bridge-class.ts";
import { docNodes } from "./data.ts";

const parser = await parserFromWasm(typescript);

const docNodePersonClass = findDocNode(
  docNodes.get("person-class.ts")!,
  { kind: "class", name: "Person" },
)!;

const treePersonClass = parser.parse(
  await Deno.readTextFile(
    new URL(import.meta.resolve("./data/person-class.ts")),
  ),
);

Deno.test("findCaptureStringsByTreeClass finds capture strings", () => {
  const actual = findTreeSitterClassByDocNodeClass(
    treePersonClass,
    docNodePersonClass,
  );
  assertEquals(
    actual,
    {
      propertyIdentifier: "school",
      publicFieldDefinition: "public school?: string",
      typeAnnotation: "string",
      typeIdentifier: "Person",
      value: undefined,
    },
  );
});
