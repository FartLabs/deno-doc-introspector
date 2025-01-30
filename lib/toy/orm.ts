// @deno-types="@types/n3"
// import { Store } from "n3";
// import { QueryEngine } from "@comunica/query-sparql";
// import type { Bindings } from "@comunica/types";
// import { deepMerge } from "@std/collections/deep-merge";
// import { default as jsonld } from "jsonld";

export const context = createMetadataClassDecorator<
  MetadataJSONLdContext["context"]
>("context");

export interface MetadataJSONLdContext {
  context: JSONLdContext;
}

export type JSONLdContext = string | Record<string, string>;

// const sparql = createMetadataClassDecorator("sparql");
// const drizzle = createMetadataClassDecorator("drizzle");
// const sql = createMetadataClassDecorator("sql");
// const typebox = createMetadataClassDecorator("typebox");

function createMetadataClassDecorator<T>(metadataID: string) {
  return (metadata: T): ClassDecorator => {
    // deno-lint-ignore no-explicit-any
    return (target: any) => {
      target.prototype.meta ??= {};
      target.prototype.meta[metadataID] = [
        ...(target.prototype.meta?.[metadataID] ?? []),
        metadata,
      ];
    };
  };
}
