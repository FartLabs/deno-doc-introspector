import type { DocNode } from "@deno/doc";
import { makePatternByDocNodeClass } from "./bridge-class.ts";

/**
 * makePatternByDocNode generates a Tree-Sitter query pattern that matches the
 * given DocNode.
 */
export function makePatternByDocNode(docNode: DocNode): string {
  switch (docNode.kind) {
    case "class": {
      return makePatternByDocNodeClass(docNode);
    }

    default: {
      throw new Error(`Unsupported DocNode kind: ${docNode.kind}`);
    }
  }
}
