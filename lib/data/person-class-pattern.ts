export const personClassPattern = `(class_declaration
    name: (type_identifier) @type_identifier
    (#eq? @type_identifier "Person")
  
    body: (class_body
      [
        (public_field_definition
          (accessibility_modifier)*
          name: (property_identifier) @property_identifier
          type: (type_annotation)* @type_annotation
          value: (_)* @value
        ) @public_field_definition
  
        (method_definition
          name: (property_identifier) @constructor-method
          (#eq? @constructor-method "constructor")
  
          parameters: (formal_parameters
            (required_parameter
              (accessibility_modifier)*
              pattern: (identifier) @property_identifier
              type: (type_annotation)* @type_annotation
              value: (_)* @value
            ) @public_field_definition
          )
        )
      ]
    )
  )`;
