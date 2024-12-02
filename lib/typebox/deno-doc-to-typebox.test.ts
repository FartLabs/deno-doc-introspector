import { assertEquals } from "@std/assert";
import { testDocNodes } from "#/tests.ts";
import { DenoDocToTypeBox } from "./deno-doc-to-typebox.ts";

Deno.test("DenoDocToTypeBox", async (t) => {
  const generator = new DenoDocToTypeBox();

  await t.step("interfaceDeclaration1.ts", () => {
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

  await t.step("interfacedecl.ts", () => {
    const sourceCode = testDocNodes.get("interfacedecl.ts")!;
    const actual = generator.generate(sourceCode);
    const expected = "import { Type, Static } from '@sinclair/typebox'\n" +
      "\n" +
      "\n" +
      "type a0 = Static<typeof a0>\n" +
      "const a0 = Type.Object({\n" +
      ",\n" +
      ",\n" +
      ",\n" +
      ",\n" +
      "p1: ,\n" +
      "p2: Type.String(),\n" +
      "p3: Type.Optional(),\n" +
      "p4: Type.Optional(Type.Number()),\n" +
      "p5: Type.Function([Type.Number()], Type.String()),\n" +
      "f1: Type.Function([], Type.Unknown()),\n" +
      "f2: Type.Function([], Type.Unknown()),\n" +
      "f3: Type.Function([Type.String()], Type.Number()),\n" +
      "f4: Type.Function([Type.Number()], Type.String())\n" +
      "},\n" +
      "{\n" +
      "additionalProperties: Type.Any()\n" +
      " })\n" +
      "\n" +
      "type a1 = Static<typeof a1>\n" +
      "const a1 = Type.Object({},\n" +
      "{\n" +
      "additionalProperties: Type.Number()\n" +
      " })\n" +
      "\n" +
      "type a2 = Static<typeof a2>\n" +
      "const a2 = Type.Object({},\n" +
      "{\n" +
      "additionalProperties: Type.Number()\n" +
      " })\n" +
      "\n" +
      "type a = Static<typeof a>\n" +
      "const a = Type.Object({\n" +
      "\n" +
      "})\n" +
      "\n" +
      "type b = Static<typeof b>\n" +
      "const b = Type.Composite([a, Type.Object({\n" +
      "\n" +
      "})])\n" +
      "\n" +
      "type c = Static<typeof c>\n" +
      "const c = Type.Composite([a, b, Type.Object({\n" +
      "\n" +
      "})])\n" +
      "\n" +
      "type d = Static<typeof d>\n" +
      "const d = Type.Composite([a, Type.Object({\n" +
      "\n" +
      "})])";

    assertEquals(actual, expected);
  });
});