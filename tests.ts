import { exists } from "@std/fs/exists";

const remoteAddress =
  "https://github.com/microsoft/TypeScript/raw/b263cc4b2ef12ae013526a3d8808b6716146586a/tests/cases/compiler";

const testCases = [
  "interfaceDeclaration5.ts",
] as const satisfies string[];

const testsDirectory = "tests";

if (import.meta.main) {
  if (await exists(testsDirectory)) {
    await Deno.remove(testsDirectory, { recursive: true });
  }

  await Deno.mkdir(testsDirectory);
  for (const testCase of testCases) {
    const url = `${remoteAddress}/${testCase}`;
    const response = await fetch(url);
    const text = await response.text();
    await Deno.writeTextFile(`${testsDirectory}/${testCase}`, text);
  }
}

export type TestCase = typeof testCases[number];

export function readTestFile(testCase: TestCase): Promise<string> {
  return Deno.readTextFile(`${testsDirectory}/${testCase}`);
}
