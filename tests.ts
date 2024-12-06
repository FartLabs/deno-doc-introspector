import { expandGlob } from "@std/fs";
import type { DocNode } from "@deno/doc";
import { doc } from "@deno/doc";

const testsDirectory = "tests";

export function readTestFile(testCase: string): Promise<string> {
  return Deno.readTextFile(`${testsDirectory}/${testCase}`);
}

export const testFiles = await Array.fromAsync(
  expandGlob(`${testsDirectory}/*.ts`),
);

export const testDocNodes = new Map<string, DocNode[]>(
  await Promise.all(
    testFiles.map(async (file): Promise<[string, DocNode[]]> => [
      file.name,
      await doc(import.meta.resolve(`./${testsDirectory}/${file.name}`)),
    ]),
  ),
);
