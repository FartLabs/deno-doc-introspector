// Custom test case of interface with extended type.
//

interface Bar extends Foo {
  bar: string;
}

interface Foo {
  foo: string;
}

function processBar(bar: Bar): void {
  console.log(bar.foo);
  console.log(bar.bar);
}
