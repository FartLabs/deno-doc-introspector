// @deno-types="@types/n3"
import { Store } from "n3";
import { QueryEngine } from "@comunica/query-sparql";
import type { Bindings } from "@comunica/types";

function context(c: string): ClassDecorator {
  return (target: Function) => {
    target.prototype.context = c;
  };
}

@context("https://schema.org/")
class Person {
  public constructor(
    public id: string,
    public name?: string,
  ) {}
}

function personSparqlInsert(person: Person): string {
  return `PREFIX schema: <https://schema.org/>
INSERT DATA {
  <${person.id}> a schema:Person ;
    schema:name "${person.name}" .
}`;
}

function personSparqlSelect(person: Person): string {
  return `PREFIX schema: <https://schema.org/>
SELECT *
WHERE {
  <${person.id}> a schema:Person .
  OPTIONAL { <${person.id}> schema:name ?name . }
}`;
}

function personSparqlDelete(person: Person): string {
  return `PREFIX schema: <https://schema.org/>
DELETE WHERE {
  <${person.id}> a schema:Person .
}`;
}

function personApp(person: Person): string {
  return `<form action="/" method="post">
  <input type="text" name="name" value="${person.name ?? ""}" />
  <input type="submit" value="Submit" />
</form>`;
}

function personFromBindings(bindings: Bindings[]): Person {
  const predicates = bindingsByPredicate(bindings);
  const idNode = predicates["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"]
    ?.at(0)?.get("s");
  const nameNode = predicates["https://schema.org/name"]?.at(0)?.get("o");
  return new Person(
    idFromNamedNode(idNode),
    stripQuotes(idFromNamedNode(nameNode)),
  );
}

function stripQuotes(s: string): string {
  return s.replace(/^"(.*)"$/, "$1");
}

function idFromNamedNode(node: unknown): string {
  return (node as { id: string })?.id;
}

function bindingsByPredicate(bindings: Bindings[]) {
  return Object.groupBy(bindings, (b) => b.get("p")?.value!);
}

// deno -A lib/toy/generator.ts
if (import.meta.main) {
  const store = new Store();
  const queryEngine = new QueryEngine();

  const id = "https://etok.me";

  console.log("Inserting data into store");
  const insertResult = await queryEngine.queryVoid(
    personSparqlInsert({ id, name: "Ethan" }),
    { sources: [store] },
  );
  console.log(insertResult);

  console.log("Reading data from store");
  const everythingStream = await queryEngine.queryBindings(
    "SELECT * WHERE { ?s ?p ?o }",
    { sources: [store] },
  );
  const everything = await Array.fromAsync(everythingStream);
  const person = personFromBindings(everything);
  console.log(person);

  // TODO: Implement web server.
}
