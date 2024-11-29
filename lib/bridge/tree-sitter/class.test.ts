import { assertEquals } from "@std/assert";
import { parserFromWasm } from "deno-tree-sitter/main.js";
import typescript from "common-tree-sitter-languages/typescript.js";
import { findDocNode } from "#/lib/deno-doc.ts";
import { docNodes } from "#/lib/data.ts";
import { introspectClassByDocNodeClass } from "./class.ts";

const parser = await parserFromWasm(typescript);

const docNodePersonClass = findDocNode(
  docNodes.get("class-person.ts")!,
  { kind: "class", name: "Person" },
)!;

const treePersonClass = parser.parse(
  await Deno.readTextFile(
    new URL(import.meta.resolve("../../data/class-person.ts")),
  ),
);

Deno.test("introspectClassByDocNodeClass introspects class", () => {
  const actual = introspectClassByDocNodeClass(
    treePersonClass,
    docNodePersonClass,
  );
  assertEquals(
    actual,
    {
      extends: [],
      name: "Person",
      properties: [
        {
          name: "school",
          optional: true,
          type: "string",
          section: "body",
          index: 0,
        },
        {
          name: "address",
          optional: true,
          type: "string",
          section: "body",
          index: 1,
        },
        {
          name: "name",
          optional: false,
          type: "string",
          section: "constructor",
          index: 0,
        },
        {
          name: "age",
          optional: false,
          type: "number",
          section: "constructor",
          index: 1,
        },
      ],
    },
  );
});
