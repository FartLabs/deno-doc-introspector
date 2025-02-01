import type { TsTypeDef, TsTypeLiteralDef } from "@deno/doc/types";

export function renderTsTypeDef(tsTypeDef: TsTypeDef): string {
  switch (tsTypeDef.kind) {
    case "keyword": {
      return tsTypeDef.repr;
    }

    case "literal":
    case "typeRef":
    case "union":
    case "intersection":
    case "array":
    case "tuple":
    case "typeOperator":
    case "parenthesized":
    case "rest":
    case "optional":
    case "typeQuery":
    case "this":
    case "fnOrConstructor":
    case "conditional":
    case "importType":
    case "infer":
    case "indexedAccess":
    case "mapped":
    case "typePredicate": {
      return tsTypeDef.repr;
    }

    case "typeLiteral": {
      return renderTsTypeLiteralDef(tsTypeDef.typeLiteral);
    }
  }
}

function renderTsTypeLiteralDef(tsTypeLiteralDef: TsTypeLiteralDef): string {
  if (tsTypeLiteralDef.properties.length === 0) {
    return "{}";
  }

  const members = tsTypeLiteralDef.properties.map(
    (property) =>
      `${property.name}${property.optional ? "?" : ""}: ${
        renderTsTypeDef(
          property.tsType!,
        )
      }`,
  );
  return `{ ${members.join("; ")} }`;
}
