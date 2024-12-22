import { Project, ts } from "ts-morph";

const TYPES_DTS_URL =
  "https://github.com/denoland/deno_doc/raw/2c0ff7c0eee0ebd8e865ca8284e5e1b03f3f008c/js/types.d.ts";
const typesDtsSourceCode = await fetch(TYPES_DTS_URL)
  .then((response) => response.text());

if (import.meta.main) {
  const project = new Project();
  const sourceFile = project.createSourceFile(
    "./lib/deno-doc/walk.ts",
    "",
    { overwrite: true },
  );

  sourceFile.addImportDeclaration({
    isTypeOnly: true,
    namedImports: ["DocNode"],
    moduleSpecifier: "@deno/doc",
  });

  const dts = parse(typesDtsSourceCode);
  console.log({ dts });

  sourceFile.addFunction({
    name: "walk",
    parameters: [{ name: "node", type: "DocNode" }],
    isExported: true,
    statements: [
      `switch (node.kind) {`,
    ],
  });

  // for (const symbol of dts) {
  // }

  await sourceFile.save();
}

// TODO: I can't figure out querying with ts so use deno doc instead.
function parse(sourceCode: string): Map<string, Node[]> {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile("types.d.ts", sourceCode);
  const nodes = new Map<string, Node[]>();

  // Query all exported symbols.
  for (const [symbolString, [node]] of sourceFile.getExportedDeclarations()) {
    // Query all the types of the symbol declaration.
    for (const child of walkChildren(node as unknown as ts.Node)) {
      console.log(child.getText());
      // console.log(child.getKindName());
      nodes.set(symbolString, []);
    }

    // console.log({
    //   symbolString,
    //   children: walkChildren(node as unknown as ts.Node)
    //     .filter((node) => node.
    //     .toArray(),
    // });
    // throw new Error("WIP");
  }

  return nodes;
}

function* walkChildren(node: ts.Node): Generator<ts.Node> {
  for (const child of node.getChildren()) {
    yield child;
    yield* walkChildren(child);
  }
}

interface Node {
  optional?: boolean;
  multiple?: boolean;
  property?: string;
  target: string;
}
