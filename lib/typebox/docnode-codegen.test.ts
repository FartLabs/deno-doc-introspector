import { assertEquals } from "@std/assert";
import { testDocNodes } from "#/tests.ts";
import { DocNodesToTypeBox } from "./docnode-codegen.ts";

// TODO: WIP.
Deno.test("DocNodesToTypeBox", () => {
  const generator = new DocNodesToTypeBox();
  const nodes = testDocNodes.get("interfaceDeclaration5.ts")!;
  const actual = generator.generate(nodes);
  const expected = "import { Type, Static } from '@sinclair/typebox'\n" +
    "\n" +
    "\n" +
    "export type I1 = Static<typeof I1>\n" +
    "export const I1 = Type.Object({\n" +
    "item: Type.String()\n" +
    "})";

  assertEquals(actual, expected);
});
