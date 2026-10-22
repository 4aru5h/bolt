import { describe, it, expect } from "vitest";
import { Lexer } from "../src/lexer";
import { TokenType } from "../src/token";
import { LexerError } from "../src/error";

describe("Lexer", () => {
  it("tokenizes keywords and identifiers", () => {
    const code = "let x = true; if y elif z else while for in repeat loop break continue give def and or not false none;";
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();

    const types = tokens.map(t => t.type);
    expect(types).toEqual([
      TokenType.LET,
      TokenType.IDENTIFIER,
      TokenType.EQUAL,
      TokenType.TRUE,
      TokenType.SEMICOLON,
      TokenType.IF,
      TokenType.IDENTIFIER,
      TokenType.ELIF,
      TokenType.IDENTIFIER,
      TokenType.ELSE,
      TokenType.WHILE,
      TokenType.FOR,
      TokenType.IN,
      TokenType.REPEAT,
      TokenType.LOOP,
      TokenType.BREAK,
      TokenType.CONTINUE,
      TokenType.GIVE,
      TokenType.DEF,
      TokenType.AND,
      TokenType.OR,
      TokenType.NOT,
      TokenType.FALSE,
      TokenType.NONE,
      TokenType.SEMICOLON,
      TokenType.EOF
    ]);

    expect(tokens[1].lexeme).toBe("x");
    expect(tokens[3].value).toBe(true);
    expect(tokens[22].value).toBe(false);
    expect(tokens[23].value).toBe(null);
  });

  it("tokenizes integers, floats, and distinction from range operator", () => {
    const code = "42 3.14 0..5 10..20";
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();

    expect(tokens[0]).toMatchObject({ type: TokenType.INT, value: 42 });
    expect(tokens[1]).toMatchObject({ type: TokenType.FLOAT, value: 3.14 });
    
    // 0..5 should tokenize as INT(0), DOT_DOT, INT(5)
    expect(tokens[2]).toMatchObject({ type: TokenType.INT, value: 0 });
    expect(tokens[3]).toMatchObject({ type: TokenType.DOT_DOT, lexeme: ".." });
    expect(tokens[4]).toMatchObject({ type: TokenType.INT, value: 5 });

    expect(tokens[5]).toMatchObject({ type: TokenType.INT, value: 10 });
    expect(tokens[6]).toMatchObject({ type: TokenType.DOT_DOT, lexeme: ".." });
    expect(tokens[7]).toMatchObject({ type: TokenType.INT, value: 20 });
  });

  it("tokenizes strings with escape sequences", () => {
    const code = `"hello world"; "line 1\\nline 2"; "tab\\there"; "quote: \\"yes\\"";`;
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();

    expect(tokens[0]).toMatchObject({ type: TokenType.STRING, value: "hello world" });
    expect(tokens[2]).toMatchObject({ type: TokenType.STRING, value: "line 1\nline 2" });
    expect(tokens[4]).toMatchObject({ type: TokenType.STRING, value: "tab\there" });
    expect(tokens[6]).toMatchObject({ type: TokenType.STRING, value: 'quote: "yes"' });
  });

  it("tokenizes all operators correctly", () => {
    const code = "+ - * / // % ** = += -= *= /= == != < <= > >=";
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();

    const expected = [
      TokenType.PLUS,
      TokenType.MINUS,
      TokenType.STAR,
      TokenType.SLASH,
      TokenType.SLASH_SLASH,
      TokenType.PERCENT,
      TokenType.STAR_STAR,
      TokenType.EQUAL,
      TokenType.PLUS_EQUAL,
      TokenType.MINUS_EQUAL,
      TokenType.STAR_EQUAL,
      TokenType.SLASH_EQUAL,
      TokenType.EQUAL_EQUAL,
      TokenType.BANG_EQUAL,
      TokenType.LESS,
      TokenType.LESS_EQUAL,
      TokenType.GREATER,
      TokenType.GREATER_EQUAL,
      TokenType.EOF
    ];

    expect(tokens.map(t => t.type)).toEqual(expected);
  });

  it("skips comments and whitespace, tracks lines and columns accurately", () => {
    const code = `# Header comment
let x = 10; # inline comment
# another comment
let y = 20;`;

    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();

    // Line 2: let x = 10;
    expect(tokens[0]).toMatchObject({ type: TokenType.LET, line: 2, column: 1 });
    expect(tokens[1]).toMatchObject({ type: TokenType.IDENTIFIER, lexeme: "x", line: 2, column: 5 });
    expect(tokens[2]).toMatchObject({ type: TokenType.EQUAL, line: 2, column: 7 });
    expect(tokens[3]).toMatchObject({ type: TokenType.INT, value: 10, line: 2, column: 9 });
    expect(tokens[4]).toMatchObject({ type: TokenType.SEMICOLON, line: 2, column: 11 });

    // Line 4: let y = 20;
    expect(tokens[5]).toMatchObject({ type: TokenType.LET, line: 4, column: 1 });
    expect(tokens[6]).toMatchObject({ type: TokenType.IDENTIFIER, lexeme: "y", line: 4, column: 5 });
    expect(tokens[7]).toMatchObject({ type: TokenType.EQUAL, line: 4, column: 7 });
    expect(tokens[8]).toMatchObject({ type: TokenType.INT, value: 20, line: 4, column: 9 });
    expect(tokens[9]).toMatchObject({ type: TokenType.SEMICOLON, line: 4, column: 11 });
  });

  it("throws on unterminated strings", () => {
    expect(() => new Lexer('"unclosed string').tokenize()).toThrowError(LexerError);
  });

  it("throws on solo '!' with helpful error", () => {
    expect(() => new Lexer("let x = !y;").tokenize()).toThrowError(
      /Did you mean 'not' or '!='\?/
    );
  });

  it("throws on unexpected character", () => {
    expect(() => new Lexer("let @ = 5;").tokenize()).toThrowError(
      /Unexpected character '@'/
    );
  });
});
