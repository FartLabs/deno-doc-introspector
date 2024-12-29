import { expandGlob } from "@std/fs";
import type { DocNode } from "@deno/doc";
import { doc } from "@deno/doc";

export function readTestFile(testCase: string): Promise<string> {
  return Deno.readTextFile(`./lib/testdata/${testCase}`);
}

export const testdataWalkEntries = await Array.fromAsync(
  expandGlob(`./lib/testdata/*.ts`),
);

export const testdataDocNodesByFilename = new Map<string, DocNode[]>(
  await Promise.all(
    testdataWalkEntries.map(async (file): Promise<[string, DocNode[]]> => [
      file.name,
      await getDocNodes(import.meta.resolve(`./testdata/${file.name}`)),
    ]),
  ),
);

async function getDocNodes(url: string): Promise<DocNode[]> {
  return Object.values(await doc([url])).at(0)!;
}
