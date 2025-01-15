// @deno-types="@types/sparqljs"
import { Generator as SparqlGenerator, Parser as SparqlParser } from "sparqljs";

const parser = new SparqlParser();
const parsedQuery = parser.parse(
  "PREFIX foaf: <http://xmlns.com/foaf/0.1/> " +
    'SELECT * { ?mickey foaf:name "Mickey Mouse"@en; foaf:knows ?other. }',
);

// Regenerate a SPARQL query from a JSON object
const generator = new SparqlGenerator({
  /* prefixes, baseIRI, factory, sparqlStar */
});
// parsedQuery.variables = ["?mickey"];
const generatedQuery = generator.stringify(parsedQuery);

// deno ./lib/toy/poop.ts
console.log({ generatedQuery });
