// From:
// https://github.com/microsoft/TypeScript/blob/f69580f82146bebfb2bee8c7b8666af0e04c7e34/tests/cases/compiler/declarationEmitTypeAliasWithTypeParameters1.ts
//

export type Bar<X, Y> = () => [X, Y];
export type Foo<Y> = Bar<any, Y>;
