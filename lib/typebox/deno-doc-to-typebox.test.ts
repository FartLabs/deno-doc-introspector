import { assertEquals } from "@std/assert";
import { Project } from "ts-morph";
import { readDocNodes } from "#/lib/testdata.ts";
import { DenoDocToTypeBox } from "./deno-doc-to-typebox.ts";

Deno.test("DenoDocToTypeBox", async (t) => {
  const generator = new DenoDocToTypeBox();
  const project = new Project({ useInMemoryFileSystem: true });

  await t.step("interfaceDeclaration5.ts", async () => {
    const sourceFile = project.createSourceFile("interfaceDeclaration5.ts");
    const nodes = await readDocNodes("interfaceDeclaration5.ts");
    generator.generate(sourceFile, nodes);
    const actual = sourceFile.getText();
    const expected = 'import { Type, Static } from "@sinclair/typebox";\n' +
      "\n" +
      "export type I1 = Static<typeof I1>\n" +
      "export const I1 = Type.Object({\n" +
      "item: Type.String()\n" +
      "})\n";

    assertEquals(actual, expected);
  });

  await t.step("interfacedecl.ts", async () => {
    const sourceFile = project.createSourceFile("interfacedecl.ts");
    const nodes = await readDocNodes("interfacedecl.ts");
    generator.generate(sourceFile, nodes);
    const actual = sourceFile.getText();
    const expected = 'import { Type, Static } from "@sinclair/typebox";\n' +
      "\n" +
      "type a0 = Static<typeof a0>\n" +
      "const a0 = Type.Object({\n" +
      "p1: ,\n" +
      "p2: Type.String(),\n" +
      "p3: Type.Optional(),\n" +
      "p4: Type.Optional(Type.Number()),\n" +
      "p5: Type.Function([Type.Number()], Type.String()),\n" +
      "f1: Type.Function([], Type.Unknown()),\n" +
      "f2: Type.Function([], Type.Unknown()),\n" +
      "f3: Type.Function([Type.String()], Type.Number()),\n" +
      "f4: Type.Function([Type.Number()], Type.String())\n" +
      "})\n" +
      "type a1 = Static<typeof a1>\n" +
      "const a1 = Type.Object({},\n" +
      "{\n" +
      "additionalProperties: Type.Number()\n" +
      " })\n" +
      "type a2 = Static<typeof a2>\n" +
      "const a2 = Type.Object({},\n" +
      "{\n" +
      "additionalProperties: Type.Number()\n" +
      " })\n" +
      "type a = Static<typeof a>\n" +
      "const a = Type.Object({})\n" +
      "type b = Static<typeof b>\n" +
      "const b = Type.Composite([a, Type.Object({})])\n" +
      "type c = Static<typeof c>\n" +
      "const c = Type.Composite([a, b, Type.Object({})])\n" +
      "type d = Static<typeof d>\n" +
      "const d = Type.Composite([a, Type.Object({})])\n";

    assertEquals(actual, expected);
  });

  await t.step("interface-nested.ts", async () => {
    const sourceFile = project.createSourceFile("interface-nested.ts");
    const nodes = await readDocNodes("interface-nested.ts");
    generator.generate(sourceFile, nodes);
    const actual = sourceFile.getText();
    const expected = 'import { Type, Static } from "@sinclair/typebox";\n' +
      "\n" +
      "type Foo = Static<typeof Foo>\n" +
      "const Foo = Type.Object({\n" +
      "bar: Type.Object({\n" +
      "baz: Type.String()\n" +
      "})\n" +
      "})\n";

    assertEquals(actual, expected);
  });

  await t.step("interface-extends.ts", async () => {
    const sourceFile = project.createSourceFile("interface-extends.ts");
    const nodes = await readDocNodes("interface-extends.ts");
    generator.generate(sourceFile, nodes);
    const actual = sourceFile.getText();
    const expected = 'import { Type, Static } from "@sinclair/typebox";\n' +
      "\n" +
      "type Bar = Static<typeof Bar>\n" +
      "const Bar = Type.Composite([Foo, Type.Object({\n" +
      "bar: Type.String()\n" +
      "})])\n" +
      "type Foo = Static<typeof Foo>\n" +
      "const Foo = Type.Object({\n" +
      "foo: Type.String()\n" +
      "})\n";

    assertEquals(actual, expected);
  });

  await t.step("declarationEmitTypeAliasWithTypeParameters1.ts", async () => {
    const sourceFile = project.createSourceFile(
      "declarationEmitTypeAliasWithTypeParameters1.ts",
    );
    const nodes = await readDocNodes(
      "declarationEmitTypeAliasWithTypeParameters1.ts",
    );
    generator.generate(sourceFile, nodes);
    const actual = sourceFile.getText();
    const expected =
      'import { Type, Static, TSchema } from "@sinclair/typebox";\n' +
      "\n" +
      "export type Bar<X extends TSchema, Y extends TSchema> = Static<ReturnType<typeof Bar<X, Y>>>\n" +
      "export const Bar = <X extends TSchema, Y extends TSchema>(X: X, Y: Y) => Type.Function([], Type.Tuple([\n" +
      "X,\n" +
      "Y\n" +
      "]))\n" +
      "export type Foo<Y extends TSchema> = Static<ReturnType<typeof Foo<Y>>>\n" +
      "export const Foo = <Y extends TSchema>(Y: Y) => Bar(Type.Any(), Y)\n";

    assertEquals(actual, expected);
  });

  await t.step("declarationEmitTypeAliasWithTypeParameters2.ts", async () => {
    const sourceFile = project.createSourceFile(
      "declarationEmitTypeAliasWithTypeParameters2.ts",
    );
    const nodes = await readDocNodes(
      "declarationEmitTypeAliasWithTypeParameters2.ts",
    );
    generator.generate(sourceFile, nodes);
    const actual = sourceFile.getText();
    const expected =
      'import { Type, Static, TSchema } from "@sinclair/typebox";\n' +
      "\n" +
      "export type Bar<X extends TSchema, Y extends TSchema, Z extends TSchema> = Static<ReturnType<typeof Bar<X, Y, Z>>>\n" +
      "export const Bar = <X extends TSchema, Y extends TSchema, Z extends TSchema>(X: X, Y: Y, Z: Z) => Type.Function([], Type.Tuple([\n" +
      "X,\n" +
      "Y,\n" +
      "Z\n" +
      "]))\n" +
      "export type Baz<M extends TSchema, N extends TSchema> = Static<ReturnType<typeof Baz<M, N>>>\n" +
      "export const Baz = <M extends TSchema, N extends TSchema>(M: M, N: N) => Bar(M, Type.String(), N)\n" +
      "export type Baa<Y extends TSchema> = Static<ReturnType<typeof Baa<Y>>>\n" +
      "export const Baa = <Y extends TSchema>(Y: Y) => Baz(Type.Boolean(), Y)\n";
    assertEquals(actual, expected);
  });

  await t.step("declarationEmitTypeAliasWithTypeParameters3.ts", async () => {
    const sourceFile = project.createSourceFile(
      "declarationEmitTypeAliasWithTypeParameters3.ts",
    );
    const nodes = await readDocNodes(
      "declarationEmitTypeAliasWithTypeParameters3.ts",
    );
    generator.generate(sourceFile, nodes);
    const actual = sourceFile.getText();
    const expected =
      'import { Type, Static, TSchema } from "@sinclair/typebox";\n' +
      "\n" +
      "type Foo<T extends TSchema> = Static<ReturnType<typeof Foo<T>>>\n" +
      "const Foo = <T extends TSchema>(T: T) => Type.Recursive(This => Type.Object({\n" +
      "foo: Type.Function([], This)\n" +
      "}))\n";
    assertEquals(actual, expected);
  });

  await t.step("declarationEmitTypeAliasWithTypeParameters4.ts", async () => {
    const sourceFile = project.createSourceFile(
      "declarationEmitTypeAliasWithTypeParameters4.ts",
    );
    const nodes = await readDocNodes(
      "declarationEmitTypeAliasWithTypeParameters4.ts",
    );
    generator.generate(sourceFile, nodes);
    const actual = sourceFile.getText();
    const expected =
      'import { Type, Static, TSchema } from "@sinclair/typebox";\n' +
      "\n" +
      "type Foo<T extends TSchema, Y extends TSchema> = Static<ReturnType<typeof Foo<T, Y>>>\n" +
      "const Foo = <T extends TSchema, Y extends TSchema>(T: T, Y: Y) => Type.Recursive(This => Type.Object({\n" +
      "foo: Type.Function([], This)\n" +
      "}))\n" +
      "type SubFoo<R extends TSchema> = Static<ReturnType<typeof SubFoo<R>>>\n" +
      "const SubFoo = <R extends TSchema>(R: R) => Foo(Type.String(), R)\n";
    assertEquals(actual, expected);
  });

  await t.step("declarationEmitTypeAliasWithTypeParameters5.ts", async () => {
    const sourceFile = project.createSourceFile(
      "declarationEmitTypeAliasWithTypeParameters5.ts",
    );
    const nodes = await readDocNodes(
      "declarationEmitTypeAliasWithTypeParameters5.ts",
    );
    generator.generate(sourceFile, nodes);
    const actual = sourceFile.getText();
    const expected =
      'import { Type, Static, TSchema } from "@sinclair/typebox";\n' +
      "\n" +
      "export type SubFoo<R extends TSchema> = Static<ReturnType<typeof SubFoo<R>>>\n" +
      "export const SubFoo = <R extends TSchema>(R: R) => Foo(Type.String(), R)" +
      "\n" +
      "type Foo<T extends TSchema, Y extends TSchema> = Static<ReturnType<typeof Foo<T, Y>>>\n" +
      "const Foo = <T extends TSchema, Y extends TSchema>(T: T, Y: Y) => Type.Recursive(This => Type.Object({\n" +
      "foo: Type.Function([], This)\n" +
      "}))\n";
    assertEquals(actual, expected);
  });

  await t.step("declarationEmitTypeAliasWithTypeParameters6.ts", async () => {
    const sourceFile = project.createSourceFile(
      "declarationEmitTypeAliasWithTypeParameters6.ts",
    );
    const nodes = await readDocNodes(
      "declarationEmitTypeAliasWithTypeParameters6.ts",
    );
    generator.generate(sourceFile, nodes);
    const actual = sourceFile.getText();
    const expected =
      'import { Type, Static, TSchema } from "@sinclair/typebox";\n' +
      "\n" +
      "type Foo<T extends TSchema, Y extends TSchema> = Static<ReturnType<typeof Foo<T, Y>>>\n" +
      "const Foo = <T extends TSchema, Y extends TSchema>(T: T, Y: Y) => Type.Recursive(This => Type.Object({\n" +
      "foo: Type.Function([], This)\n" +
      "}))\n" +
      "type SubFoo<R extends TSchema, S extends TSchema> = Static<ReturnType<typeof SubFoo<R, S>>>\n" +
      "const SubFoo = <R extends TSchema, S extends TSchema>(R: R, S: S) => Foo(S, R)\n";
    assertEquals(actual, expected);
  });

  await t.step(
    "typeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral01.ts",
    async () => {
      const sourceFile = project.createSourceFile(
        "typeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral01.ts",
      );
      const nodes = await readDocNodes(
        "typeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral01.ts",
      );
      generator.generate(sourceFile, nodes);
      const actual = sourceFile.getText();
      const expected = 'import { Type, Static } from "@sinclair/typebox";\n' +
        "\n" +
        "type TreeNode = Static<typeof TreeNode>\n" +
        "const TreeNode = Type.Recursive(This => Type.Object({\n" +
        "name: Type.String(),\n" +
        "parent: This\n" +
        "}))\n";
      assertEquals(actual, expected);
    },
  );

  await t.step(
    "typeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral02.ts",
    async () => {
      const sourceFile = project.createSourceFile(
        "typeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral02.ts",
      );
      const nodes = await readDocNodes(
        "typeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral02.ts",
      );
      generator.generate(sourceFile, nodes);
      const actual = sourceFile.getText();
      const expected = 'import { Type, Static } from "@sinclair/typebox";\n' +
        "\n" +
        "type TreeNode = Static<typeof TreeNode>\n" +
        "const TreeNode = Type.Recursive(This => Type.Object({\n" +
        "name: Type.String(),\n" +
        "parent: This\n" +
        "}))\n" +
        "type TreeNodeMiddleman = Static<typeof TreeNodeMiddleman>\n" +
        "const TreeNodeMiddleman = Type.Object({\n" +
        "name: Type.String(),\n" +
        "parent: TreeNode\n" +
        "})\n";
      assertEquals(actual, expected);
    },
  );

  await t.step(
    "genericTypeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral02.ts",
    async () => {
      const sourceFile = project.createSourceFile(
        "genericTypeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral02.ts",
      );
      const nodes = await readDocNodes(
        "genericTypeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral02.ts",
      );
      generator.generate(sourceFile, nodes);
      const actual = sourceFile.getText();
      const expected =
        'import { Type, Static, TSchema } from "@sinclair/typebox";\n' +
        "\n" +
        "type TreeNode<T extends TSchema> = Static<ReturnType<typeof TreeNode<T>>>\n" +
        "const TreeNode = <T extends TSchema>(T: T) => Type.Recursive(This => Type.Object({\n" +
        "name: Type.String(),\n" +
        "parent: This,\n" +
        "value: T\n" +
        "}))\n" +
        "type TreeNodeMiddleman<T extends TSchema> = Static<ReturnType<typeof TreeNodeMiddleman<T>>>\n" +
        "const TreeNodeMiddleman = <T extends TSchema>(T: T) => Type.Object({\n" +
        "name: Type.String(),\n" +
        "parent: TreeNode(T),\n" +
        "value: T\n" +
        "})\n";
      assertEquals(actual, expected);
    },
  );

  await t.step("class-interface-compat.ts", async () => {
    const sourceFile = project.createSourceFile("class-interface-compat.ts");
    const nodes = await readDocNodes("class-interface-compat.ts");
    generator.generate(sourceFile, nodes);
    const actual = sourceFile.getText();
    const expected = 'import { Type, Static } from "@sinclair/typebox";\n' +
      "\n" +
      "export type AnimalInterface = Static<typeof AnimalInterface>\n" +
      "export const AnimalInterface = Type.Object({\n" +
      "name: Type.String(),\n" +
      "age: Type.Number()\n" +
      "})" +
      "\n" +
      "export type AnimalClass = Static<typeof AnimalClass>\n" +
      "export const AnimalClass = Type.Object({\n" +
      "name: Type.String(),\n" +
      "age: Type.Number()\n" +
      "})\n";

    assertEquals(actual, expected);
  });
});
