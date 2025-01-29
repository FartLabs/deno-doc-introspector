// @deno-types="@types/n3"
// import { Store } from "n3";
// import { QueryEngine } from "@comunica/query-sparql";
import { context } from "./orm.ts";

@context({
  "@vocab": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  schema: "https://schema.org/",
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
  // const store = new Store();
  // const queryEngine = new QueryEngine();

  const person = new Person(id, "Person");
  console.log(person);

  // Proof of concept:
  // Generate TypeBox from person, apply type check.

  // TODO: Implement web server.
}

export function personApp(person: Person): string {
  return `<form action="/" method="post">
  <input type="text" name="name" value="${person.name ?? ""}" />
  <input type="submit" value="Submit" />
</form>`;
}
