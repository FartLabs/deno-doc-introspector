// @deno-types="@types/n3"
import { Store } from "n3";
import { QueryEngine } from "@comunica/query-sparql";
import type { Bindings } from "@comunica/types";
import { deepMerge } from "@std/collections/deep-merge";
import { default as jsonld } from "jsonld";

export const context = createMetadataClassDecorator<
  MetadataJSONLdContext["context"]
>("context");

export interface MetadataJSONLdContext {
  context: JSONLdContext;
}

export type JSONLdContext = string | Record<string, string>;

export const sparql = createMetadataClassDecorator<
  MetadataSPARQL["sparql"]
>("sparql");

export interface MetadataSPARQL {
  sparql:
    | string
    // TODO: Utilize generics to customize variable types.
    | ((variables: Record<string, string>) => string)
    | Record<string, string | ((variables: Record<string, string>) => string)>;
}

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

export function createSparqlQuery<
  // deno-lint-ignore no-explicit-any
  T extends { new (...args: any[]): any },
>(
  queryEngine: QueryEngine,
  store: Store,
  target: T,
) {
  return async function (
    { queryName, variables }: {
      queryName?: string;
      variables?: Record<string, string>;
    } = {},
  ): Promise<InstanceType<T> | undefined> {
    const instance = new target();
    const metadata = resolveMetadata<
      MetadataSPARQL & MetadataJSONLdContext
    >(instance);

    const queryString = resolveSparqlQuery(
      metadata,
      queryName,
      variables,
    );
    try {
      const bindings = await queryEngine.queryBindings(
        queryString,
        { sources: [store] },
      );

      if (typeof variables?.id !== "string") {
        throw new Error("Expected variable ID.");
      }
      return Object.assign(
        instance,
        await fromSparqlBindings<InstanceType<T>>(
          variables.id,
          await Array.fromAsync(bindings),
          metadata.context,
        ),
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "Query result type 'bindings' was expected, while 'void' was found."
      ) {
        await queryEngine.queryVoid(queryString, { sources: [store] });
        return;
      }

      throw error;
    }
  };
}

// TODO: Rename.
function resolveSparqlQuery(
  sparqlMeta: MetadataSPARQL & MetadataJSONLdContext,
  queryID?: string,
  variables?: Record<string, string>,
): string {
  const prelude = typeof sparqlMeta.context === "object"
    ? Object.entries(sparqlMeta.context)
      .reduce(
        (prefixes, [prefix, iri]) =>
          prefix === "@vocab"
            ? prefixes
            : prefixes + `PREFIX ${prefix}: <${iri}>\n`,
        "",
      )
    : "";

  return prelude +
    (queryID !== undefined
      ? typeof sparqlMeta.sparql === "object"
        ? typeof sparqlMeta.sparql[queryID] === "function"
          ? (sparqlMeta.sparql as Record<
            string,
            (variables: Record<string, string>) => string
          >)[queryID](variables ?? {})
          : (sparqlMeta.sparql as Record<string, string>)[queryID]
        : (sparqlMeta.sparql as string)
      : typeof sparqlMeta.sparql === "function"
      ? sparqlMeta.sparql(variables ?? {})
      : (sparqlMeta.sparql as string));
}

function resolveMetadata<T>(
  // deno-lint-ignore no-explicit-any
  target: any,
): T {
  return Object.fromEntries(
    Object.entries(target.meta).map(([key, value]) => [
      key,
      deepMergeRecursive(value as unknown[]),
    ]),
  ) as T;
}

function deepMergeRecursive<T>(objects: T[]): T {
  return objects.reduce(
    (acc, obj) =>
      deepMerge(
        acc as unknown as Record<PropertyKey, unknown>,
        obj as unknown as Record<PropertyKey, unknown>,
      ) as T,
    {} as T,
  );
}

async function fromSparqlBindings<T>(
  id: string,
  bindings: Bindings[],
  ctx: JSONLdContext,
): Promise<T> {
  const expanded = Object.fromEntries(bindings.map((binding) => {
    const predicate = binding.get("predicate")!.value;
    const object = stripQuotes(binding.get("object")!.value);

    // TODO: Parse object string into correct data type.
    return [predicate, object];
  }));

  return {
    id,
    ...(await jsonld.compact(expanded, ctx)),
  };
}

function stripQuotes(s: string): string {
  return s.replace(/^"(.*)"$/, "$1");
}
