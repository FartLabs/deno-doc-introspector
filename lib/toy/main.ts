// @deno-types="@types/n3"
import { Store } from "n3";
import { QueryEngine } from "@comunica/query-sparql";
import { context, createSparqlQuery, sparql } from "./orm.ts";

@context({
  "@vocab": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  schema: "https://schema.org/",
})
@sparql({
  /** insert inserts person by ID and name. */
  insert: ({ id, name }: Record<string, string>) =>
    `INSERT DATA {
  <${id}> a schema:Person .
  ${name ? `<${id}> schema:name "${name}" .` : ""}
}`,

  /** select selects person by ID. */
  select: ({ id }) => `SELECT DISTINCT * WHERE { <${id}> ?predicate ?object }`,

  /** delete deletes person by ID. */
  delete: ({ id }) => `DELETE WHERE { <${id}> * * }`,
})
class Person {
  public constructor(
    public id: string,
    public type: string,
    public name?: string,
  ) {}
}

const id = "https://etok.me";

// deno -A lib/toy/main.ts
if (import.meta.main) {
  const store = new Store();
  const queryEngine = new QueryEngine();
  const sparqlQuery = createSparqlQuery(queryEngine, store, Person);

  console.log("Inserting data into store");
  const insertResult = await sparqlQuery({
    queryName: "insert",
    variables: { id },
  });
  console.log(insertResult);

  console.log("Reading data from store");
  const person = await sparqlQuery({
    queryName: "select",
    variables: { id },
  });
  console.log(person);

  // TODO: Implement web server.
}

function personApp(person: Person): string {
  return `<form action="/" method="post">
  <input type="text" name="name" value="${person.name ?? ""}" />
  <input type="submit" value="Submit" />
</form>`;
}
