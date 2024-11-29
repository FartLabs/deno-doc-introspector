import type { DocNodeClass } from "@deno/doc";
import type { Capture, NamedCapture, Tree } from "#/lib/tree-sitter.ts";
import { findCaptureStrings } from "#/lib/tree-sitter.ts";

export const groupTypeIdentifier = "type_identifier";
export const groupPropertyIdentifier = "property_identifier";
export const groupValue = "value";
export const groupTypeAnnotation = "type_annotation";
export const groupPublicFieldDefinition = "public_field_definition";
export const groupConstructorMethod = "constructor_method";

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
      .reduce((
        { index, properties }: {
          index: Record<TreeSitterPropertySection, number>;
          properties: TreeSitterProperty[];
        },
        { captures: namedCaptures }: { captures: NamedCapture[] },
      ) => {
        const parsedCaptures = findCaptureStringsByDocNodeClass(namedCaptures);
        const propertyIdentifier = parsedCaptures.get(groupPropertyIdentifier);
        if (propertyIdentifier === undefined) {
          throw new Error("Property identifier is not defined.");
        }

        const typeAnnotation = parsedCaptures.get(groupTypeAnnotation)
          ?.slice(typeScriptTypeAnnotationPrefix.length);
        if (typeAnnotation === undefined) {
          throw new Error("Type annotation is not defined.");
        }

        const fieldDefinition = parsedCaptures.get(groupPublicFieldDefinition);
        if (fieldDefinition === undefined) {
          throw new Error("Field definition is not defined.");
        }

        const isSectionConstructor = parsedCaptures.has(groupConstructorMethod);
        const hasQuestionToken = checkHasQuestionToken(fieldDefinition);
        properties.push({
          name: propertyIdentifier,
          type: typeAnnotation,
          optional: hasQuestionToken,
          section: isSectionConstructor ? "constructor" : "body",
          index: isSectionConstructor ? index.constructor++ : index.body++,
        });

        return { index, properties };
      }, { index: { body: 0, constructor: 0 }, properties: [] }).properties,
  };
}

export function findCaptureStringsByDocNodeClass(
  namedCaptures: NamedCapture[],
): Map<string, string> {
  return findCaptureStrings(
    namedCaptures,
    [
      groupTypeIdentifier,
      groupPropertyIdentifier,
      groupValue,
      groupTypeAnnotation,
      groupPublicFieldDefinition,
      groupConstructorMethod,
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
        name: (property_identifier) @${groupConstructorMethod}
        (#eq? @${groupConstructorMethod} "constructor")

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
