// Custom test case of similar class and interface definitions.
//

export interface AnimalInterface {
    name: string;
    age: number;
}

export class AnimalClass {
    name: string;
    constructor(name: string, public age: number) {
        this.name = name;
    }
}
