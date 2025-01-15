// @deno-types="@types/n3"
import { Store } from "n3";
import { QueryEngine } from "@comunica/query-sparql";
import { manage } from "./orm.ts";

// deno -A lib/toy/main.ts
if (import.meta.main) {
  const store = new Store();
  const queryEngine = new QueryEngine();
  const manager = manage(queryEngine, store);

  const id = "https://etok.me";

  console.log("Inserting data into store");
  const insertResult = await manager.uploadPerson({ id });
  console.log(insertResult);

  console.log("Reading data from store");
  const person = await manager.downloadPerson({ id });
  console.log(person);

  // TODO: Implement web server.
}
