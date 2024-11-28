import type { DocNodeClass } from "@deno/doc";
import type { Capture, NamedCapture, Tree } from "#/lib/tree-sitter.ts";
import { findCaptureStrings } from "#/lib/tree-sitter.ts";

export const groupTypeIdentifier = "type_identifier";
export const groupPropertyIdentifier = "property_identifier";
export const groupValue = "value";
export const groupTypeAnnotation = "type_annotation";
export const groupPublicFieldDefinition = "public_field_definition";

export function introspectClassByDocNodeClass(
  tree: Tree,
  docNode: DocNodeClass,
): TreeSitterClass {
  const captures: Capture[] = tree.rootNode
    .query(makePatternByDocNodeClass(docNode));
  return {
    extends: [], // TODO: Introspect extends.
    name: docNode.name,
    properties: captures
      .map(({ captures: namedCaptures }: { captures: NamedCapture[] }, i) =>
        // TODO: Introspect constructor via separate capture group.
        introspectPropertyByCaptures(namedCaptures, "body", i)
      ),
  };
}

export function introspectPropertyByCaptures(
  namedCaptures: NamedCapture[],
  section: TreeSitterPropertySection,
  index: number,
): TreeSitterProperty {
  const parsedCaptures = findCaptureStringsByDocNodeClass(namedCaptures);
  const propertyIdentifier = parsedCaptures.get(groupPropertyIdentifier);
  if (propertyIdentifier === undefined) {
    throw new Error("Property identifier is not defined.");
  }

  const typeAnnotation = parsedCaptures.get(groupTypeAnnotation)?.slice(
    typeScriptTypeAnnotationPrefix.length,
  );
  if (typeAnnotation === undefined) {
    throw new Error("Type annotation is not defined.");
  }

  const fieldDefinition = parsedCaptures.get(groupPublicFieldDefinition);
  if (fieldDefinition === undefined) {
    throw new Error("Field definition is not defined.");
  }

  const hasQuestionToken = checkHasQuestionToken(fieldDefinition);
  return {
    name: propertyIdentifier,
    type: typeAnnotation,
    optional: hasQuestionToken,
    section,
    index,
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

export function checkHasQuestionToken(fieldDefinition: string): boolean {
  const index = fieldDefinition.indexOf(":");
  return index > 0 && fieldDefinition[index - 1] === "?";
}

export const typeScriptTypeAnnotationPrefix = ": ";

export interface TreeSitterClass {
  name: string;
  extends: string[];
  properties: TreeSitterProperty[];
}

export interface TreeSitterProperty {
  name: string;
  type: string;
  optional: boolean;
  section: TreeSitterPropertySection;
  index: number;
}

export type TreeSitterPropertySection = "body" | "constructor";
