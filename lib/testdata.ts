import type { DocNode } from "@deno/doc";
import { doc } from "@deno/doc";

export function readTestFile(testCase: string): Promise<string> {
  return Deno.readTextFile(`./lib/testdata/${testCase}`);
}

export function readDocNodes(testCase: string): Promise<DocNode[]> {
  return generateDocNodes(import.meta.resolve(`./testdata/${testCase}`));
}

async function generateDocNodes(url: string): Promise<DocNode[]> {
  return Object.values(await doc([url])).at(0)!;
}
