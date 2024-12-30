import * as ts from "typescript";
import { createTypeCheckFn } from "#/lib/typecheck.ts";

const testdata = {
  "interface-extends.ts": ["bar.foo"],
  "typeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral01.ts": [
    "node.name",
  ],
};

for (const [filename, paths] of Object.entries(testdata)) {
  for (const path of paths) {
    const program = ts.createProgram(
      [`./lib/testdata/${filename}`],
      {},
    );
    const sourceFile = program.getSourceFiles()
      .find(({ fileName }) => fileName.endsWith(filename))!;
    const fn = createTypeCheckFn(
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
}
