import type { DocNode } from "@deno/doc";
import { doc } from "@deno/doc";

export async function generateDocNodes(
  specifier: string,
  importMap?: string,
): Promise<DocNode[]> {
  return Object.values(await doc([specifier], { importMap })).at(0)!;
}
