import * as ts from "typescript";
import { createTypeCheckFn } from "#/lib/typecheck.ts";

Deno.bench({
  name: "interface-extends.ts",
  fn(t) {
    const program = ts.createProgram(
      ["./lib/testdata/interface-extends.ts"],
      {},
    );
    const sourceFile = program.getSourceFiles()
      .find(({ fileName }) => fileName.endsWith("interface-extends.ts"))!;
    const fn = createTypeCheckFn(
      program.getTypeChecker(),
      sourceFile,
      "bar.foo",
    );

    t.start();
    fn();
    t.end();
  },
});
