import type { DocNode, DocNodeClass } from "@deno/doc";

/**
 * makePatternByDocNode generates a Tree-Sitter query pattern that matches the
 * given DocNode.
 */
export function makePatternByDocNode(docNode: DocNode): string {
  switch (docNode.kind) {
    case "class": {
      return makePatternByDocNodeClass(docNode);
    }

    default: {
      throw new Error(`Unsupported DocNode kind: ${docNode.kind}`);
    }
  }
}

export const groupTypeIdentifier = "type_identifier";
export const groupPropertyIdentifier = "property_identifier";
export const groupValue = "value";
export const groupTypeAnnotation = "type_annotation";
export const groupPublicFieldDefinition = "public_field_definition";

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
