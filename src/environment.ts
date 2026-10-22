import { BoltValue } from "./value";
import { RuntimeError } from "./error";

export class Environment {
  private values = new Map<string, BoltValue>();

  constructor(public parent?: Environment) {}

  public define(
    name: string,
    value: BoltValue,
    line: number,
    column: number
  ): void {
    if (this.values.has(name)) {
      throw new RuntimeError(
        `Variable '${name}' is already defined in this scope`,
        line,
        column
      );
    }
    this.values.set(name, value);
  }

  public assign(
    name: string,
    value: BoltValue,
    line: number,
    column: number
  ): void {
    if (this.values.has(name)) {
      this.values.set(name, value);
      return;
    }

    if (this.parent) {
      this.parent.assign(name, value, line, column);
      return;
    }

    throw new RuntimeError(`Undefined variable '${name}'`, line, column);
  }

  public get(name: string, line: number, column: number): BoltValue {
    if (this.values.has(name)) {
      return this.values.get(name)!;
    }

    if (this.parent) {
      return this.parent.get(name, line, column);
    }

    throw new RuntimeError(`Undefined variable '${name}'`, line, column);
  }
}
