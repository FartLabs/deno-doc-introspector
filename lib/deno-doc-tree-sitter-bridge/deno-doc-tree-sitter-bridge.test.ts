import { assertEquals } from "@std/assert";
import { parserFromWasm } from "deno-tree-sitter/main.js";
import typescript from "common-tree-sitter-languages/typescript.js";
import { findDocNode } from "#/introspector.ts";
import {
  findCaptureStringsByTreeClass,
  groupPropertyIdentifier,
  groupPublicFieldDefinition,
  groupTypeAnnotation,
  groupTypeIdentifier,
} from "./deno-doc-tree-sitter-bridge.ts";
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
  const actual = findCaptureStringsByTreeClass(
    treePersonClass,
    docNodePersonClass,
  );
  const expected = new Map([
    [groupPropertyIdentifier, "school"],
    [groupPublicFieldDefinition, "public school?: string"],
    [groupTypeAnnotation, ": string"],
    [groupTypeIdentifier, "Person"],
  ]);
  assertEquals(actual, expected);
});
