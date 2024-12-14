// From:
// https://github.com/microsoft/TypeScript/blob/f69580f82146bebfb2bee8c7b8666af0e04c7e34/tests/cases/compiler/declarationEmitTypeAliasWithTypeParameters3.ts
//

type Foo<T> = {
    foo<U>(): Foo<U>
}
