import * as ts from "typescript";

const testdata: string[] = [
  // "interface-extends.ts",
  // "typeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral01.ts",
  "typeboxArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral01.ts",
];

testdata
  .forEach((filename) => {
    const program = ts.createProgram(
      [`./lib/testdata/${filename}`],
      {
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        // Optionally, specify paths to node_modules (if not in the default location)
        paths: {
          // TODO: TypeError: Cannot read properties of undefined (reading 'statements')
          "@sinclair/typebox": ["./node_modules/@sinclair/typebox"],
        },
      },
    );
    const checker = program.getTypeChecker();
    const sourceFile = program.getSourceFiles()
      .find(({ fileName }) => fileName.endsWith(filename))!;
    console.log({
      sourceFiles: program.getSourceFiles().map((f) => f.fileName),
    }); // TODO: Remove.

    const node = sourceFile.statements.at(-1) as ts.VariableStatement;
    const typeNode = node.declarationList.declarations[0].type!;
    Deno.bench(filename, () => {
      checker.getTypeFromTypeNode(typeNode);
    });
  });
