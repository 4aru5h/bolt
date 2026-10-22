export class BoltError extends Error {
  constructor(
    message: string,
    public line: number,
    public column: number
  ) {
    super(`Line ${line}:${column}: ${message}`);
    this.name = "BoltError";
  }
}

export class LexerError extends BoltError {
  constructor(message: string, line: number, column: number) {
    super(message, line, column);
    this.name = "LexerError";
  }
}

export class ParserError extends BoltError {
  constructor(message: string, line: number, column: number) {
    super(message, line, column);
    this.name = "ParserError";
  }
}

export class RuntimeError extends BoltError {
  constructor(message: string, line: number, column: number) {
    super(message, line, column);
    this.name = "RuntimeError";
  }
}
