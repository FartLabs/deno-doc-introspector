import { assertEquals } from "@std/assert";
import { testDocNodes } from "#/tests.ts";
import { DenoDocToTypeBox } from "./deno-doc-to-typebox.ts";

// TODO: WIP.
Deno.test("DenoDocToTypeBox", () => {
  const generator = new DenoDocToTypeBox();
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
