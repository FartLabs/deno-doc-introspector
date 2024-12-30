import { createProgram } from "typescript";
import { createTypeCheckFn } from "#/lib/typecheck.ts";

Deno.bench({
  name:
    "typeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral01.ts",
  fn(t) {
    const program = createProgram(
      ["./lib/testdata/typeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral01.ts"],
      {},
    );
    const sourceFile = program.getSourceFiles().find(({ fileName }) =>
      fileName.endsWith(
        "typeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral01.ts",
      )
    )!;
    const fn = createTypeCheckFn(
      program.getTypeChecker(),
      sourceFile,
      "node.name",
    );

    t.start();
    fn();
    t.end();
  },
});
