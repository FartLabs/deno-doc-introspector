import { assertEquals } from "@std/assert";
import { readTestFile } from "#/tests.ts";
import { TypeScriptToTypeBox } from "./codegen.ts";

Deno.test("TypeScriptToTypeBox", async (t) => {
  const generator = new TypeScriptToTypeBox();

  await t.step("interfaceDeclaration1.ts", async () => {
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

  await t.step("interfacedecl.ts", async () => {
    const sourceCode = await readTestFile("interfacedecl.ts");
    const actual = generator.generate(sourceCode);
    const expected = "import { Type, Static } from '@sinclair/typebox'\n" +
      "\n" +
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

  await t.step("interface-nested.ts", async () => {
    const sourceCode = await readTestFile("interface-nested.ts");
    const actual = generator.generate(sourceCode);
    const expected = "import { Type, Static } from '@sinclair/typebox'\n" +
      "\n" +
      "\n" +
      "type Foo = Static<typeof Foo>\n" +
      "const Foo = Type.Object({\n" +
      "bar: Type.Object({\n" +
      "baz: Type.String()\n" +
      "})\n" +
      "})";

    assertEquals(actual, expected);
  });

  await t.step("interface-extends.ts", async () => {
    const sourceCode = await readTestFile("interface-extends.ts");
    const actual = generator.generate(sourceCode);
    const expected = "import { Type, Static } from '@sinclair/typebox'\n" +
      "\n" +
      "\n" +
      "type Bar = Static<typeof Bar>\n" +
      "const Bar = Type.Composite([Foo, Type.Object({\n" +
      "bar: Type.String()\n" +
      "})])\n" +
      "\n" +
      "type Foo = Static<typeof Foo>\n" +
      "const Foo = Type.Object({\n" +
      "foo: Type.String()\n" +
      "})";

    assertEquals(actual, expected);
  });

  await t.step("declarationEmitTypeAliasWithTypeParameters1.ts", async () => {
    const sourceCode = await readTestFile(
      "declarationEmitTypeAliasWithTypeParameters1.ts",
    );
    const actual = generator.generate(sourceCode);
    const expected =
      "import { Type, Static, TSchema } from '@sinclair/typebox'\n" +
      "\n" +
      "\n" +
      "export type Bar<X extends TSchema, Y extends TSchema> = Static<ReturnType<typeof Bar<X, Y>>>\n" +
      "export const Bar = <X extends TSchema, Y extends TSchema>(X: X, Y: Y) => Type.Function([], Type.Tuple([\n" +
      "X,\n" +
      "Y\n" +
      "]))\n" +
      "\n" +
      "export type Foo<Y extends TSchema> = Static<ReturnType<typeof Foo<Y>>>\n" +
      "export const Foo = <Y extends TSchema>(Y: Y) => Bar(Type.Any(), Y)";

    assertEquals(actual, expected);
  });

  await t.step("declarationEmitTypeAliasWithTypeParameters2.ts", async () => {
    const sourceCode = await readTestFile(
      "declarationEmitTypeAliasWithTypeParameters2.ts",
    );
    const actual = generator.generate(sourceCode);
    const expected =
      "import { Type, Static, TSchema } from '@sinclair/typebox'\n" +
      "\n" +
      "\n" +
      "export type Bar<X extends TSchema, Y extends TSchema, Z extends TSchema> = Static<ReturnType<typeof Bar<X, Y, Z>>>\n" +
      "export const Bar = <X extends TSchema, Y extends TSchema, Z extends TSchema>(X: X, Y: Y, Z: Z) => Type.Function([], Type.Tuple([\n" +
      "X,\n" +
      "Y,\n" +
      "Z\n" +
      "]))\n" +
      "\n" +
      "export type Baz<M extends TSchema, N extends TSchema> = Static<ReturnType<typeof Baz<M, N>>>\n" +
      "export const Baz = <M extends TSchema, N extends TSchema>(M: M, N: N) => Bar(M, Type.String(), N)\n" +
      "\n" +
      "export type Baa<Y extends TSchema> = Static<ReturnType<typeof Baa<Y>>>\n" +
      "export const Baa = <Y extends TSchema>(Y: Y) => Baz(Type.Boolean(), Y)";
    assertEquals(actual, expected);
  });

  await t.step("declarationEmitTypeAliasWithTypeParameters3.ts", async () => {
    const sourceCode = await readTestFile(
      "declarationEmitTypeAliasWithTypeParameters3.ts",
    );
    const actual = generator.generate(sourceCode);
    const expected =
      "import { Type, Static, TSchema } from '@sinclair/typebox'\n" +
      "\n" +
      "\n" +
      "type Foo<T extends TSchema> = Static<ReturnType<typeof Foo<T>>>\n" +
      "const Foo = <T extends TSchema>(T: T) => Type.Recursive(This => Type.Object({\n" +
      "foo: Type.Function([], This)\n" +
      "}))";
    assertEquals(actual, expected);
  });

  await t.step("declarationEmitTypeAliasWithTypeParameters4.ts", async () => {
    const sourceCode = await readTestFile(
      "declarationEmitTypeAliasWithTypeParameters4.ts",
    );
    const actual = generator.generate(sourceCode);
    const expected =
      "import { Type, Static, TSchema } from '@sinclair/typebox'\n" +
      "\n" +
      "\n" +
      "type Foo<T extends TSchema, Y extends TSchema> = Static<ReturnType<typeof Foo<T, Y>>>\n" +
      "const Foo = <T extends TSchema, Y extends TSchema>(T: T, Y: Y) => Type.Recursive(This => Type.Object({\n" +
      "foo: Type.Function([], This)\n" +
      "}))\n" +
      "\n" +
      "type SubFoo<R extends TSchema> = Static<ReturnType<typeof SubFoo<R>>>\n" +
      "const SubFoo = <R extends TSchema>(R: R) => Foo(Type.String(), R)";
    assertEquals(actual, expected);
  });

  await t.step("declarationEmitTypeAliasWithTypeParameters5.ts", async () => {
    const sourceCode = await readTestFile(
      "declarationEmitTypeAliasWithTypeParameters5.ts",
    );
    const actual = generator.generate(sourceCode);
    const expected =
      "import { Type, Static, TSchema } from '@sinclair/typebox'\n" +
      "\n" +
      "\n" +
      "type Foo<T extends TSchema, Y extends TSchema> = Static<ReturnType<typeof Foo<T, Y>>>\n" +
      "const Foo = <T extends TSchema, Y extends TSchema>(T: T, Y: Y) => Type.Recursive(This => Type.Object({\n" +
      "foo: Type.Function([], This)\n" +
      "}))\n" +
      "\n" +
      "export type SubFoo<R extends TSchema> = Static<ReturnType<typeof SubFoo<R>>>\n" +
      "export const SubFoo = <R extends TSchema>(R: R) => Foo(Type.String(), R)";
    assertEquals(actual, expected);
  });

  await t.step("declarationEmitTypeAliasWithTypeParameters6.ts", async () => {
    const sourceCode = await readTestFile(
      "declarationEmitTypeAliasWithTypeParameters6.ts",
    );
    const actual = generator.generate(sourceCode);
    const expected =
      "import { Type, Static, TSchema } from '@sinclair/typebox'\n" +
      "\n" +
      "\n" +
      "type Foo<T extends TSchema, Y extends TSchema> = Static<ReturnType<typeof Foo<T, Y>>>\n" +
      "const Foo = <T extends TSchema, Y extends TSchema>(T: T, Y: Y) => Type.Recursive(This => Type.Object({\n" +
      "foo: Type.Function([], This)\n" +
      "}))\n" +
      "\n" +
      "type SubFoo<R extends TSchema, S extends TSchema> = Static<ReturnType<typeof SubFoo<R, S>>>\n" +
      "const SubFoo = <R extends TSchema, S extends TSchema>(R: R, S: S) => Foo(S, R)";
    assertEquals(actual, expected);
  });

  await t.step(
    "typeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral01.ts",
    async () => {
      const sourceCode = await readTestFile(
        "typeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral01.ts",
      );
      const actual = generator.generate(sourceCode);
      const expected = "import { Type, Static } from '@sinclair/typebox'\n" +
        "\n" +
        "\n" +
        "type TreeNode = Static<typeof TreeNode>\n" +
        "const TreeNode = Type.Recursive(This => Type.Object({\n" +
        "name: Type.String(),\n" +
        "parent: This\n" +
        "}))";
      assertEquals(actual, expected);
    },
  );

  await t.step(
    "typeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral02.ts",
    async () => {
      const sourceCode = await readTestFile(
        "typeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral02.ts",
      );
      const actual = generator.generate(sourceCode);
      const expected = "import { Type, Static } from '@sinclair/typebox'\n" +
        "\n" +
        "\n" +
        "type TreeNode = Static<typeof TreeNode>\n" +
        "const TreeNode = Type.Recursive(This => Type.Object({\n" +
        "name: Type.String(),\n" +
        "parent: This\n" +
        "}))\n" +
        "\n" +
        "type TreeNodeMiddleman = Static<typeof TreeNodeMiddleman>\n" +
        "const TreeNodeMiddleman = Type.Object({\n" +
        "name: Type.String(),\n" +
        "parent: TreeNode\n" +
        "})";
      assertEquals(actual, expected);
    },
  );
});
