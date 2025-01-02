import type { DocNode } from "@deno/doc";
import { doc } from "@deno/doc";

export async function generateDocNodes(url: string): Promise<DocNode[]> {
  return Object.values(await doc([url])).at(0)!;
}
