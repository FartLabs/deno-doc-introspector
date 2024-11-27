export class Person {
  public school?: string;
  public address?: string;

  public constructor(
    public name: string,
    public age: number,
  ) {}

  get info(): string {
    return `${this.name} is ${this.age} years old.`;
  }

  public study(): void {
    console.log(`${this.name} is studying.`);
  }
}
