import { expandGlob } from "@std/fs";
import type { DocNode } from "@deno/doc";
import { doc } from "@deno/doc";

export const files = await Array.fromAsync(
  expandGlob(new URL(import.meta.resolve("./data/*.ts"))),
);

export const docNodes = new Map<string, DocNode[]>(
  await Promise.all(
    files.map(async (file): Promise<[string, DocNode[]]> => [
      file.name,
      await doc(import.meta.resolve(`./data/${file.name}`)),
    ]),
  ),
);
