// TypeBox derivation of:
// https://github.com/microsoft/TypeScript/blob/f69580f82146bebfb2bee8c7b8666af0e04c7e34/tests/cases/compiler/typeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral02.ts
//

// import { Static, Type } from "@sinclair/typebox";
//
// type TreeNode = Static<typeof TreeNode>;
// const TreeNode = Type.Recursive((This) =>
//   Type.Object({
//     name: Type.String(),
//     parent: This,
//   })
// );
//
// type TreeNodeMiddleman = Static<typeof TreeNodeMiddleman>;
// const TreeNodeMiddleman = Type.Object({
//   name: Type.String(),
//   parent: TreeNode,
// });
//

// TODO: Add more test cases.
// - https://www.npmjs.com/package/typia
// - https://www.npmjs.com/package/arktype
// - https://www.npmjs.com/package/valibot
// - https://www.npmjs.com/package/zod
//
