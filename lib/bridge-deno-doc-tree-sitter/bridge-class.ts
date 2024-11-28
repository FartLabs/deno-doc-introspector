import type { DocNodeClass } from "@deno/doc";
import type { NamedCapture, Tree } from "#/lib/tree-sitter.ts";
import { findCaptureStrings } from "#/lib/tree-sitter.ts";

export const groupTypeIdentifier = "type_identifier";
export const groupPropertyIdentifier = "property_identifier";
export const groupValue = "value";
export const groupTypeAnnotation = "type_annotation";
export const groupPublicFieldDefinition = "public_field_definition";

// TODO:
// https://github.com/FartLabs/typescript-type-introspector/blob/ddb2dce0799d0bb0bc5f5b56f357cb41afb0e982/lib/introspector/introspector.ts#L14
//
export interface TreeSitterClass {
  typeIdentifier: string;
  propertyIdentifier: string;
  typeAnnotation: string;
  publicFieldDefinition: string;
  value?: string;
}

export function findTreeSitterClassByDocNodeClass(
  tree: Tree,
  docNode: DocNodeClass,
): TreeSitterClass {
  // TODO:
  // https://github.com/FartLabs/typescript-type-introspector/blob/ddb2dce0799d0bb0bc5f5b56f357cb41afb0e982/lib/tree-sitter/tree-sitter-introspector.ts#L33
  //

  const captures = tree.rootNode.query(makePatternByDocNodeClass(docNode));
  const namedCaptures = (captures?.flatMap(
    ({ captures }: { captures: NamedCapture[] }) => captures,
  ) ?? []) as NamedCapture[];
  const parsedCaptures = findCaptureStringsByDocNodeClass(namedCaptures);
  if (!parsedCaptures.has(groupTypeIdentifier)) {
    throw new Error(`Failed to find type identifier for class ${docNode.name}`);
  }

  if (!parsedCaptures.has(groupPropertyIdentifier)) {
    throw new Error(
      `Failed to find property identifier for class ${docNode.name}`,
    );
  }

  if (!parsedCaptures.has(groupTypeAnnotation)) {
    throw new Error(`Failed to find type annotation for class ${docNode.name}`);
  }

  if (!parsedCaptures.has(groupPublicFieldDefinition)) {
    throw new Error(
      `Failed to find public field definition for class ${docNode.name}`,
    );
  }

  return {
    typeIdentifier: parsedCaptures.get(groupTypeIdentifier)!,
    propertyIdentifier: parsedCaptures.get(groupPropertyIdentifier)!,
    value: parsedCaptures.get(groupValue)!,
    typeAnnotation: parsedCaptures.get(groupTypeAnnotation)!.slice(": ".length),
    publicFieldDefinition: parsedCaptures.get(groupPublicFieldDefinition)!,
  };
}

export function findCaptureStringsByDocNodeClass(
  captures: NamedCapture[],
): Map<string, string> {
  return findCaptureStrings(
    captures,
    [
      groupTypeIdentifier,
      groupPropertyIdentifier,
      groupValue,
      groupTypeAnnotation,
      groupPublicFieldDefinition,
    ],
  );
}

export function makePatternByDocNodeClass(docNode: DocNodeClass): string {
  return `(class_declaration
  name: (type_identifier) @${groupTypeIdentifier}
  (#eq? @${groupTypeIdentifier} "${docNode.name}")

  body: (class_body
    [
      (public_field_definition
        (accessibility_modifier)*
        name: (property_identifier) @${groupPropertyIdentifier}
        type: (type_annotation)* @${groupTypeAnnotation}
        value: (_)* @${groupValue}
      ) @${groupPublicFieldDefinition}

      (method_definition
        name: (property_identifier) @constructor-method
        (#eq? @constructor-method "constructor")

        parameters: (formal_parameters
          (required_parameter
            (accessibility_modifier)*
            pattern: (identifier) @${groupPropertyIdentifier}
            type: (type_annotation)* @${groupTypeAnnotation}
            value: (_)* @${groupValue}
          ) @${groupPublicFieldDefinition}
        )
      )
    ]
  )
)`;
}
