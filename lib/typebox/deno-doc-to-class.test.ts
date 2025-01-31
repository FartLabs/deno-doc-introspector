import { assertEquals } from "@std/assert";
import { Project } from "ts-morph";
import { readDocNodes } from "#/lib/testdata.ts";
import { DenoDocToClass } from "./deno-doc-to-class.ts";

Deno.test("DenoDocToClass", async (t) => {
  const generator = new DenoDocToClass();
  const project = new Project({ useInMemoryFileSystem: true });

  await t.step("interfaceDeclaration5.ts", async () => {
    const sourceFile = project.createSourceFile("interfaceDeclaration5.ts");
    const nodes = await readDocNodes("interfaceDeclaration5.ts");
    generator.generate(sourceFile, nodes);
    const actual = sourceFile.getText();
    const expected = "export class I1 {\n" +
      "  public item: string;\n" +
      "\n" +
      "  public constructor(data: I1) {\n" +
      "    this.item = data.item;\n" +
      "  }\n" +
      "}\n";

    assertEquals(actual, expected);
  });

  await t.step("interfacedecl.ts", async () => {
    const sourceFile = project.createSourceFile("interfacedecl.ts");
    const nodes = await readDocNodes("interfacedecl.ts");
    generator.generate(sourceFile, nodes);
    const actual = sourceFile.getText();
    const expected = "class a0 {\n" +
      "  public p1: ;\n" +
      "  public p2: string;\n" +
      "  public p3?: ;\n" +
      "  public p4?: number;\n" +
      "  public p5: ;\n" +
      "\n" +
      "  public constructor(data: a0) {\n" +
      "    this.p1 = data.p1;\n" +
      "    this.p2 = data.p2;\n" +
      "    this.p3 = data.p3;\n" +
      "    this.p4 = data.p4;\n" +
      "    this.p5 = data.p5;\n" +
      "  }\n" +
      "}\n";

    assertEquals(actual, expected);
  });

  // await t.step("interface-nested.ts", async () => {
  //   const sourceFile = project.createSourceFile("interface-nested.ts");
  //   const nodes = await readDocNodes("interface-nested.ts");
  //   generator.generate(sourceFile, nodes);
  //   const actual = sourceFile.getText();
  //   const expected = 'import { Type, Static } from "@sinclair/typebox";\n' +
  //     "\n" +
  //     "type Foo = Static<typeof Foo>\n" +
  //     "const Foo = Type.Object({\n" +
  //     "bar: Type.Object({\n" +
  //     "baz: Type.String()\n" +
  //     "})\n" +
  //     "})\n";

  //   assertEquals(actual, expected);
  // });

  // await t.step("interface-extends.ts", async () => {
  //   const sourceFile = project.createSourceFile("interface-extends.ts");
  //   const nodes = await readDocNodes("interface-extends.ts");
  //   generator.generate(sourceFile, nodes);
  //   const actual = sourceFile.getText();
  //   const expected = 'import { Type, Static } from "@sinclair/typebox";\n' +
  //     "\n" +
  //     "type Bar = Static<typeof Bar>\n" +
  //     "const Bar = Type.Composite([Foo, Type.Object({\n" +
  //     "bar: Type.String()\n" +
  //     "})])\n" +
  //     "type Foo = Static<typeof Foo>\n" +
  //     "const Foo = Type.Object({\n" +
  //     "foo: Type.String()\n" +
  //     "})\n";

  //   assertEquals(actual, expected);
  // });
});
