import { Project } from "ts-morph";
// import { doc } from "@deno/doc";
import { DenoDocToTypeBox } from "#/lib/typebox/deno-doc-to-typebox.ts";
import { context } from "./orm.ts";
import { generateDocNodes } from "#/lib/deno-doc/generate-doc-nodes.ts";

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

// deno task dev
if (import.meta.main) {
  const generator = new DenoDocToTypeBox();
  const project = new Project({ useInMemoryFileSystem: true });

  const sourceFile = project.createSourceFile("main.ts");
  // const nodes = await generateDocNodes("https://esm.sh/sparqlalgebrajs@5.0.0");
  const nodes = await generateDocNodes(
    import.meta.url,
    import.meta.resolve("../../deno.json"),
  );
  generator.generate(sourceFile, nodes);
  const actual = sourceFile.getText();
  console.log(actual);

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
