import { Token, TokenType, KEYWORDS } from "./token";
import { LexerError } from "./error";

export class Lexer {
  private source: string;
  private tokens: Token[] = [];
  private start = 0;
  private current = 0;
  private line = 1;
  private column = 1;
  private startColumn = 1;

  constructor(source: string) {
    this.source = source;
  }

  public tokenize(): Token[] {
    this.tokens = [];
    this.start = 0;
    this.current = 0;
    this.line = 1;
    this.column = 1;

    while (!this.isAtEnd()) {
      this.start = this.current;
      this.startColumn = this.column;
      this.scanToken();
    }

    this.tokens.push({
      type: TokenType.EOF,
      lexeme: "",
      value: null,
      line: this.line,
      column: this.column
    });

    return this.tokens;
  }

  private scanToken(): void {
    const c = this.advance();

    switch (c) {
      // Single character delimiters
      case "(": this.addToken(TokenType.LPAREN); break;
      case ")": this.addToken(TokenType.RPAREN); break;
      case "{": this.addToken(TokenType.LBRACE); break;
      case "}": this.addToken(TokenType.RBRACE); break;
      case "[": this.addToken(TokenType.LBRACKET); break;
      case "]": this.addToken(TokenType.RBRACKET); break;
      case ",": this.addToken(TokenType.COMMA); break;
      case ";": this.addToken(TokenType.SEMICOLON); break;

      // Operators
      case "+":
        if (this.match("=")) {
          this.addToken(TokenType.PLUS_EQUAL);
        } else {
          this.addToken(TokenType.PLUS);
        }
        break;

      case "-":
        if (this.match("=")) {
          this.addToken(TokenType.MINUS_EQUAL);
        } else {
          this.addToken(TokenType.MINUS);
        }
        break;

      case "*":
        if (this.match("*")) {
          this.addToken(TokenType.STAR_STAR);
        } else if (this.match("=")) {
          this.addToken(TokenType.STAR_EQUAL);
        } else {
          this.addToken(TokenType.STAR);
        }
        break;

      case "/":
        if (this.match("/")) {
          this.addToken(TokenType.SLASH_SLASH);
        } else if (this.match("=")) {
          this.addToken(TokenType.SLASH_EQUAL);
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;

      case "%":
        this.addToken(TokenType.PERCENT);
        break;

      case "=":
        if (this.match("=")) {
          this.addToken(TokenType.EQUAL_EQUAL);
        } else {
          this.addToken(TokenType.EQUAL);
        }
        break;

      case "!":
        if (this.match("=")) {
          this.addToken(TokenType.BANG_EQUAL);
        } else {
          throw new LexerError(
            "Unexpected character '!'. Did you mean 'not' or '!='?",
            this.line,
            this.startColumn
          );
        }
        break;

      case "<":
        if (this.match("=")) {
          this.addToken(TokenType.LESS_EQUAL);
        } else {
          this.addToken(TokenType.LESS);
        }
        break;

      case ">":
        if (this.match("=")) {
          this.addToken(TokenType.GREATER_EQUAL);
        } else {
          this.addToken(TokenType.GREATER);
        }
        break;

      case ".":
        if (this.match(".")) {
          this.addToken(TokenType.DOT_DOT);
        } else {
          throw new LexerError("Unexpected character '.'", this.line, this.startColumn);
        }
        break;

      // Whitespace
      case " ":
      case "\r":
      case "\t":
        // Ignore whitespace
        break;

      case "\n":
        this.line++;
        this.column = 1;
        break;

      // Comments: # to the end of the line
      case "#":
        while (this.peek() !== "\n" && !this.isAtEnd()) {
          this.advance();
        }
        break;

      // String literals
      case '"':
        this.string();
        break;

      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          throw new LexerError(`Unexpected character '${c}'`, this.line, this.startColumn);
        }
        break;
    }
  }

  private string(): void {
    let value = "";
    const strStartLine = this.line;
    const strStartCol = this.startColumn;

    while (!this.isAtEnd() && this.peek() !== '"') {
      if (this.peek() === "\n") {
        this.line++;
        this.column = 0;
      }

      if (this.peek() === "\\") {
        this.advance(); // consume '\'
        if (this.isAtEnd()) {
          throw new LexerError("Unterminated string escape sequence", strStartLine, strStartCol);
        }
        const esc = this.advance();
        switch (esc) {
          case "n": value += "\n"; break;
          case "t": value += "\t"; break;
          case "\\": value += "\\"; break;
          case '"': value += '"'; break;
          default:
            throw new LexerError(`Invalid escape sequence '\\${esc}'`, this.line, this.column - 2);
        }
      } else {
        value += this.advance();
      }
    }

    if (this.isAtEnd()) {
      throw new LexerError("Unterminated string literal", strStartLine, strStartCol);
    }

    this.advance(); // Consume closing quote '"'
    this.addToken(TokenType.STRING, value);
  }

  private number(): void {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Check for fractional part: must be '.' followed by a digit (not '..' range)
    let isFloat = false;
    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      isFloat = true;
      this.advance(); // Consume '.'

      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const lexeme = this.source.substring(this.start, this.current);
    if (isFloat) {
      this.addToken(TokenType.FLOAT, parseFloat(lexeme));
    } else {
      this.addToken(TokenType.INT, parseInt(lexeme, 10));
    }
  }

  private identifier(): void {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(this.start, this.current);
    const keywordType = KEYWORDS[text];

    if (keywordType !== undefined) {
      if (keywordType === TokenType.TRUE) {
        this.addToken(TokenType.TRUE, true);
      } else if (keywordType === TokenType.FALSE) {
        this.addToken(TokenType.FALSE, false);
      } else if (keywordType === TokenType.NONE) {
        this.addToken(TokenType.NONE, null);
      } else {
        this.addToken(keywordType, null);
      }
    } else {
      this.addToken(TokenType.IDENTIFIER, text);
    }
  }

  private isDigit(c: string): boolean {
    return c >= "0" && c <= "9";
  }

  private isAlpha(c: string): boolean {
    return (c >= "a" && c <= "z") ||
           (c >= "A" && c <= "Z") ||
           c === "_";
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private advance(): string {
    const c = this.source[this.current++];
    this.column++;
    return c;
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source[this.current] !== expected) return false;
    this.current++;
    this.column++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return "\0";
    return this.source[this.current];
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source[this.current + 1];
  }

  private addToken(type: TokenType, value: any = null): void {
    const lexeme = this.source.substring(this.start, this.current);
    this.tokens.push({
      type,
      lexeme,
      value,
      line: this.line,
      column: this.startColumn
    });
  }
}
