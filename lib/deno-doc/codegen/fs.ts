import type { DocNode } from "@deno/doc";

export async function writeDenoDoc(
  file: string | URL,
  denoDocs: DocNode[],
): Promise<void> {
  await Deno.writeTextFile(file, JSON.stringify(denoDocs, null, 2));
}

export async function readDenoDoc(file: string | URL): Promise<DocNode[]> {
  return JSON.parse(await Deno.readTextFile(file));
}
