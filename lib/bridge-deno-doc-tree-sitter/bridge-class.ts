import type { DocNodeClass } from "@deno/doc";
import { findCaptureStrings, NamedCapture, Tree } from "#/lib/tree-sitter.ts";

export const groupTypeIdentifier = "type_identifier";
export const groupPropertyIdentifier = "property_identifier";
export const groupValue = "value";
export const groupTypeAnnotation = "type_annotation";
export const groupPublicFieldDefinition = "public_field_definition";

export function findCaptureStringsByTreeClass(
  tree: Tree,
  docNode: DocNodeClass,
) {
  return findCaptureStringsByDocNodeClass(
    tree.rootNode.query(makePatternByDocNodeClass(docNode))?.at(0)
      ?.captures ?? [] as NamedCapture[],
  );
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
