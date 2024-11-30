import { assertEquals } from "@std/assert";
import { readTestFile } from "#/tests.ts";
import { TypeScriptToTypeBox } from "./codegen.ts";

Deno.test("TypeScriptToTypeBox", async () => {
  const generator = new TypeScriptToTypeBox();
  const sourceCode = await readTestFile("interfaceDeclaration5.ts");
  const actual = generator.generate(sourceCode);
  const expected = "import { Type, Static } from '@sinclair/typebox'\n" +
    "\n" +
    "\n" +
    "export type I1 = Static<typeof I1>\n" +
    "export const I1 = Type.Object({\n" +
    "item: Type.String()\n" +
    "})";

  assertEquals(actual, expected);
});
