import * as ts from "typescript";
import { setupTypeCheckFn } from "#/lib/typecheck.ts";

type Testdata = Record<string, string[]>;

const testdata: Testdata[] = [
  {
    "interface-extends.ts": ["bar.foo"],
  },
  {
    "typeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral01.ts":
      ["node.name"],
    // TODO: Fix this test case.
    // "typeboxArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral01.ts":
    //   ["node.name"],
  },
];

testdata
  .flatMap((x) => Object.entries(x))
  .forEach(([filename, paths]) => {
    const program = ts.createProgram(
      [`./lib/testdata/${filename}`],
      {/* baseUrl: "./" */},
    );
    const sourceFile = program.getSourceFiles()
      .find(({ fileName }) => fileName.endsWith(filename))!;

    for (const path of paths) {
      const fn = setupTypeCheckFn(
        program.getTypeChecker(),
        sourceFile,
        path,
      );

      Deno.bench(
        `${filename}:${path}`,
        () => {
          fn();
        },
      );
    }
  });
