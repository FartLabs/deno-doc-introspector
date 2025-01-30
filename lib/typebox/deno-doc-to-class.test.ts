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
      "  public constructor(\n" +
      "    public item: string,\n" +
      "  ) {}\n" +
      "}\n";

    assertEquals(actual, expected);
  });
});
