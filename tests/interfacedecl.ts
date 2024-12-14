// From:
// https://github.com/microsoft/TypeScript/blob/b263cc4b2ef12ae013526a3d8808b6716146586a/tests/cases/compiler/interfacedecl.ts
//

interface a0 {
    p1;
    p2: string;
    p3?;
    p4?: number;
    p5: (s: number) =>string;

    f1();
    f2? ();
    f3(a: string): number;
    f4? (s: number): string;
}


interface a1 {
    [n: number]: number;
}

interface a2 {
    [s: string]: number;
}

interface a {
}

interface b extends a {
}

interface c extends a, b {
}

interface d extends a {
}

class c1 implements a {
}
