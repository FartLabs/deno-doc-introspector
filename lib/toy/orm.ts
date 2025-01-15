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

function personApp(person: Person): string {
  return `<form action="/" method="post">
  <input type="text" name="name" value="${person.name ?? ""}" />
  <input type="submit" value="Submit" />
</form>`;
}

export function manage(
  queryEngine: QueryEngine,
  store: Store,
) {
  async function deletePerson(person: Person): Promise<void> {
    return await queryEngine.queryVoid(
      personSparqlDelete(person),
      { sources: [store] },
    );
  }

  async function uploadPerson(person: Person): Promise<void> {
    return await queryEngine.queryVoid(
      personSparqlInsert(person),
      { sources: [store] },
    );
  }

  async function downloadPerson(person: Person): Promise<Person> {
    return personFromBindings(
      await Array.fromAsync(
        await queryEngine.queryBindings(
          personSparqlSelect(person),
          { sources: [store] },
        ),
      ),
    );
  }

  return {
    deletePerson,
    uploadPerson,
    downloadPerson,
  };
}

function personFromBindings(bindings: unknown[]): Person {
  console.dir(bindings, { depth: null });

  const predicates = bindingsByPredicate(bindings as Bindings[]);
  const idNode = predicates["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"]
    ?.at(0)?.get("s");
  const nameNode = predicates["https://schema.org/name"]?.at(0)?.get("o");
  if (nameNode === undefined) {
    return new Person(idFromNamedNode(idNode));
  }

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

function personSparqlInsert(person: Person): string {
  return `PREFIX schema: <https://schema.org/>
INSERT DATA {
  <${person.id}> a schema:Person .
  ${person.name ? `<${person.id}> schema:name "${person.name}" .` : ""}
}`;
}

function personSparqlSelect(person: Person): string {
  return `PREFIX schema: <https://schema.org/>
SELECT DISTINCT *
WHERE {
  ?s ?p ?o .
  OPTIONAL { ?s schema:name ?name }
  FILTER(?s = <${person.id}>)
  FILTER(?p = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> || ?p = schema:name)
  FILTER(?o = schema:Person || isLiteral(?o))
}`;
}
function personSparqlDelete(person: Person): string {
  return `PREFIX schema: <https://schema.org/>
DELETE WHERE {
  <${person.id}> a schema:Person .
}`;
}
