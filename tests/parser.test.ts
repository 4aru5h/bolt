import { describe, it, expect } from "vitest";
import { Lexer } from "../src/lexer";
import { Parser } from "../src/parser";
import { ASTPrinter } from "../src/astPrinter";
import { ParserError } from "../src/error";

function parseSource(src: string) {
  const tokens = new Lexer(src).tokenize();
  return new Parser(tokens).parse();
}

function printSource(src: string): string {
  const ast = parseSource(src);
  return new ASTPrinter().print(ast);
}

describe("Parser & AST", () => {
  it("parses operator precedence correctly", () => {
    const code = "let x = 1 + 2 * 3;";
    expect(printSource(code)).toBe("(let x = (+ 1 (* 2 3)))");

    const code2 = "let y = (1 + 2) * 3;";
    expect(printSource(code2)).toBe("(let y = (* (+ 1 2) 3))");

    const code3 = "let z = 2 ** 3 ** 4;"; // right-associative
    expect(printSource(code3)).toBe("(let z = (** 2 (** 3 4)))");

    const code4 = "let b = not x and y or z == 5;";
    expect(printSource(code4)).toBe("(let b = (or (and (not x) y) (== z 5)))");
  });

  it("parses variable declarations and assignments", () => {
    const code = `
let a = 10;
a = 20;
a += 5;
arr[0] = 99;
arr[i] += 1;
`;
    expect(printSource(code).trim()).toBe(
      [
        "(let a = 10)",
        "(= a 20)",
        "(+= a 5)",
        "(= (index arr 0) 99)",
        "(+= (index arr i) 1)"
      ].join("\n")
    );
  });

  it("parses if / elif / else conditionals", () => {
    const code = `
if x > 0 {
  emit(1);
} elif x == 0 {
  emit(0);
} else {
  emit(-1);
}
`;
    const printed = printSource(code);
    expect(printed).toContain("(if (> x 0) { (call emit [1]) } elif (== x 0) { (call emit [0]) } else { (call emit [(- 1)]) })");
  });

  it("parses while, repeat, and loop statements", () => {
    const code = `
while x < 10 {
  x += 1;
}
repeat 5 {
  emit("hi");
}
loop {
  break;
  continue;
}
`;
    const printed = printSource(code);
    expect(printed).toContain("(while (< x 10) { (+= x 1) })");
    expect(printed).toContain('(repeat 5 { (call emit ["hi"]) })');
    expect(printed).toContain("(loop { (break); (continue) })");
  });

  it("parses for-in and for-range statements correctly", () => {
    const code = `
for x in arr {
  emit(x);
}
for i in 0..10 {
  emit(i);
}
`;
    const printed = printSource(code);
    expect(printed).toContain("(for x in arr { (call emit [x]) })");
    expect(printed).toContain("(for i in 0..10 { (call emit [i]) })");
  });

  it("parses function declarations and give statements", () => {
    const code = `
def add(a, b) {
  give a + b;
}
def noop() {
  give;
}
`;
    const printed = printSource(code);
    expect(printed).toContain("(def add [a, b] { (give (+ a b)) })");
    expect(printed).toContain("(def noop [] { (give) })");
  });

  it("parses array literals and nested index / call expressions", () => {
    const code = `
let nums = [1, 2, [3, 4]];
emit(double(nums[0]));
`;
    const printed = printSource(code);
    expect(printed).toContain("(let nums = [1, 2, [3, 4]])");
    expect(printed).toContain("(call emit [(call double [(index nums 0)])])");
  });

  it("tracks line and column numbers on AST nodes", () => {
    const code = "let total = 42;\nemit(total);";
    const ast = parseSource(code);

    expect(ast.body[0].line).toBe(1);
    expect(ast.body[0].column).toBe(1);

    expect(ast.body[1].line).toBe(2);
    expect(ast.body[1].column).toBe(1);
  });

  it("throws ParserError on missing semicolon", () => {
    const code = "let x = 5";
    expect(() => parseSource(code)).toThrowError(ParserError);
    expect(() => parseSource(code)).toThrowError(/Expect ';'/);
  });

  it("throws ParserError on invalid assignment target", () => {
    const code = "1 + 2 = 5;";
    expect(() => parseSource(code)).toThrowError(ParserError);
    expect(() => parseSource(code)).toThrowError(/Invalid assignment target/);
  });

  it("throws ParserError on unclosed block", () => {
    const code = "if true { emit(1);";
    expect(() => parseSource(code)).toThrowError(ParserError);
    expect(() => parseSource(code)).toThrowError(/Expect '}'/);
  });
});
