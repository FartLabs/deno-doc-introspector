import type { DocNode } from "@deno/doc";
import { generateDocNodes } from "#/lib/deno-doc/generate-doc-nodes.ts";

export function readTestFile(testCase: string): Promise<string> {
  return Deno.readTextFile(`./lib/testdata/${testCase}`);
}

export function readDocNodes(testCase: string): Promise<DocNode[]> {
  return generateDocNodes(import.meta.resolve(`./testdata/${testCase}`));
}
