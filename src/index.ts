import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { Interpreter } from "./interpreter";
import { BoltError } from "./error";

export interface RunResult {
  output: string[];
  error: string | null;
}

export interface RunOptions {
  maxSteps?: number;
  maxCallDepth?: number;
  onInput?: (prompt: string) => Promise<string>;
}

export async function runBolt(
  source: string,
  onEmit?: (line: string) => void,
  options?: RunOptions
): Promise<RunResult> {
  const output: string[] = [];

  try {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const program = parser.parse();

    const interpreter = new Interpreter();
    if (options?.maxSteps !== undefined) {
      interpreter.maxSteps = options.maxSteps;
    }
    if (options?.maxCallDepth !== undefined) {
      interpreter.maxCallDepth = options.maxCallDepth;
    }
    if (options?.onInput) {
      interpreter.inputCallback = options.onInput;
    }

    interpreter.emitCallback = (line: string) => {
      output.push(line);
      if (onEmit) onEmit(line);
    };

    await interpreter.interpret(program);
    return { output, error: null };
  } catch (err: any) {
    if (err instanceof BoltError) {
      return { output, error: err.message };
    }
    return { output, error: err.message || String(err) };
  }
}

export { Lexer } from "./lexer";
export { Parser } from "./parser";
export { Interpreter } from "./interpreter";
export { BoltError, LexerError, ParserError, RuntimeError } from "./error";
