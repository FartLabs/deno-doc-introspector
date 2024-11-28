import { assertEquals } from "@std/assert";
import { parserFromWasm } from "deno-tree-sitter/main.js";
import typescript from "common-tree-sitter-languages/typescript.js";
import type { NamedCapture } from "#/lib/tree-sitter.ts";
import { findNode } from "#/introspector.ts";
import {
  findCaptureStringsByDocNodeClass,
  groupPropertyIdentifier,
  groupPublicFieldDefinition,
  groupTypeAnnotation,
  groupTypeIdentifier,
  makePatternByDocNodeClass,
} from "./deno-doc-tree-sitter-bridge.ts";
import { docNodes } from "./data.ts";

const parser = await parserFromWasm(typescript);

const docNodePersonClass = findNode(
  docNodes.get("person-class.ts")!,
  { kind: "class", name: "Person" },
)!;

const treePersonClass = parser.parse(
  await Deno.readTextFile(
    new URL(import.meta.resolve("./data/person-class.ts")),
  ),
);

Deno.test("makePatternByDocNodeClass makes example pattern", () => {
  const actual = findCaptureStringsByDocNodeClass(
    treePersonClass.rootNode.query(
      makePatternByDocNodeClass(docNodePersonClass),
    )?.at(0)?.captures as NamedCapture[],
  );

  const expected = new Map([
    [groupPropertyIdentifier, "school"],
    [groupPublicFieldDefinition, "public school?: string"],
    [groupTypeAnnotation, ": string"],
    [groupTypeIdentifier, "Person"],
  ]);

  assertEquals(actual, expected);
});
