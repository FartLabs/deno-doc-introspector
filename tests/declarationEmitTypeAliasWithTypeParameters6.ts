// From:
// https://github.com/microsoft/TypeScript/blob/f69580f82146bebfb2bee8c7b8666af0e04c7e34/tests/cases/compiler/declarationEmitTypeAliasWithTypeParameters6.ts
//

type Foo<T, Y> = {
    foo<U, J>(): Foo<U, J>
};

type SubFoo<R, S> = Foo<S, R>;
