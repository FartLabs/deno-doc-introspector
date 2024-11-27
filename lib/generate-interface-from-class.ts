import type { ClassDef, InterfaceDef } from "@deno/doc";

export function getInterfaceFromClass(classDef: ClassDef): InterfaceDef {
  return {
    defName: classDef.defName,
    methods: classDef.methods.map((method) => ({
      name: method.name,
      kind: method.kind,
      location: method.location,
      jsDoc: method.jsDoc,
      optional: method.optional,
      params: method.functionDef.params,
      returnType: method.functionDef.returnType,
      typeParams: [],
    })),
    // TODO: Combine with properties defined in constructor.
    properties: classDef.properties.map((property) => ({
      name: property.name,
      location: property.location,
      jsDoc: property.jsDoc,
      optional: property.optional,
      type: property.tsType,
      params: [],
      typeParams: [],
      computed: false,
    })),
    // TODO: Properly handle extends.
    extends: [],
    callSignatures: [],
    indexSignatures: [],
    typeParams: classDef.typeParams,
  };
}
