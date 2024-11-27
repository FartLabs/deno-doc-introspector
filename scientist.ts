import { Person } from "./person.ts";

export class Scientist extends Person {
  public constructor(
    name: string,
    age: number,
    public field: string,
  ) {
    super(name, age);
  }

  public research(): void {
    console.log(`${this.name} is researching in ${this.field}.`);
  }
}
