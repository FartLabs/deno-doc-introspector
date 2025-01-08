// From:
// https://github.com/microsoft/TypeScript/blob/f69580f82146bebfb2bee8c7b8666af0e04c7e34/tests/cases/compiler/typeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral02.ts
//

type TreeNode<T> = {
  name: string;
  parent: TreeNode<T>;
  value: T;
};

type TreeNodeMiddleman<T> = {
  name: string;
  parent: TreeNode<T>;
  value: T;
};
