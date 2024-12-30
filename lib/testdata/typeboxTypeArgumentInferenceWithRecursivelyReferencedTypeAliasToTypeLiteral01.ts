// TypeBox derivation of:
// https://github.com/microsoft/TypeScript/blob/f69580f82146bebfb2bee8c7b8666af0e04c7e34/tests/cases/compiler/typeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral01.ts
//

import { Static, Type } from "@sinclair/typebox";

type TreeNode = Static<typeof TreeNode>;
const TreeNode = Type.Recursive((This) =>
  Type.Object({
    name: Type.String(),
    parent: This,
  })
);

function processTreeNode(node: TreeNode): void {
  console.log(node.name);
  console.log(node.parent);
}
