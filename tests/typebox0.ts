import { Static, Type } from "@sinclair/typebox";

type TreeNode = Static<typeof TreeNode>;
const TreeNode = Type.Recursive((This) =>
  Type.Object({
    name: Type.String(),
    parent: This,
  })
);

type TreeNodeMiddleman = Static<typeof TreeNodeMiddleman>;
const TreeNodeMiddleman = Type.Object({
  name: Type.String(),
  parent: TreeNode,
});
