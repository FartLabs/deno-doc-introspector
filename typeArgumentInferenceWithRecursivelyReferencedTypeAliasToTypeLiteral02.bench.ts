import { typecheck } from "#/lib/typecheck.ts";

Deno.bench({
  name:
    "typeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral02.ts",
  async fn() {
    await typecheck(
      "./testdata/typeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral02.ts",
    );
  },
});

Deno.bench({
  name:
    "typeboxTypeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral02.ts",
  async fn() {
    await typecheck(
      "./testdata/typeboxTypeArgumentInferenceWithRecursivelyReferencedTypeAliasToTypeLiteral02.ts",
    );
  },
});
