import { BoltValue } from "./value";

export class ReturnSignal {
  constructor(public value: BoltValue) {}
}

export class BreakSignal {}

export class ContinueSignal {}
