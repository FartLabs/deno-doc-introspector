import { exists, expandGlob } from "@std/fs";
import type { DocNode } from "@deno/doc";
import { doc } from "@deno/doc";

const remoteAddress =
  "https://github.com/microsoft/TypeScript/raw/b263cc4b2ef12ae013526a3d8808b6716146586a/tests/cases/compiler";

const testCases = [
  "interfaceDeclaration5.ts",
  "interfacedecl.ts",
] as const satisfies string[];

const testsDirectory = "tests";

if (import.meta.main) {
  if (await exists(testsDirectory)) {
    await Deno.remove(testsDirectory, { recursive: true });
  }

  await Deno.mkdir(testsDirectory);
  for (const testCase of testCases) {
    const response = await fetch(`${remoteAddress}/${testCase}`);
    const text = await response.text();
    await Deno.writeTextFile(`${testsDirectory}/${testCase}`, text);
  }
}

export type TestCase = typeof testCases[number];

export function readTestFile(testCase: TestCase): Promise<string> {
  return Deno.readTextFile(`${testsDirectory}/${testCase}`);
}

export const testFiles = await Array.fromAsync(
  expandGlob(`${testsDirectory}/*.ts`),
);

export const testDocNodes = new Map<TestCase, DocNode[]>(
  await Promise.all(
    testFiles.map(async (file): Promise<[TestCase, DocNode[]]> => [
      file.name as TestCase,
      await doc(import.meta.resolve(`./${testsDirectory}/${file.name}`)),
    ]),
  ),
);
