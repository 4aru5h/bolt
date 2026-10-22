import { Token, TokenType } from "./token";
import {
  Stmt,
  Expr,
  Program,
  BlockStmt,
  VarDeclStmt,
  AssignStmt,
  IndexAssignStmt,
  IfStmt,
  WhileStmt,
  ForInStmt,
  ForRangeStmt,
  RepeatStmt,
  LoopStmt,
  BreakStmt,
  ContinueStmt,
  GiveStmt,
  FnDeclStmt,
  ExprStmt,
  LiteralExpr,
  IdentifierExpr,
  UnaryExpr,
  BinaryExpr,
  CallExpr,
  IndexExpr,
  ArrayLiteralExpr,
  ElifBranch
} from "./ast";
import { ParserError } from "./error";

export class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parse(): Program {
    const statements: Stmt[] = [];
    const firstToken = this.peek();

    while (!this.isAtEnd()) {
      statements.push(this.statement());
    }

    return {
      type: "Program",
      body: statements,
      line: firstToken.line,
      column: firstToken.column
    };
  }

  // ------------------------------------------------------------
  // Statements
  // ------------------------------------------------------------

  private statement(): Stmt {
    if (this.match(TokenType.LET)) return this.varDeclaration();
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.WHILE)) return this.whileStatement();
    if (this.match(TokenType.FOR)) return this.forStatement();
    if (this.match(TokenType.REPEAT)) return this.repeatStatement();
    if (this.match(TokenType.LOOP)) return this.loopStatement();
    if (this.match(TokenType.BREAK)) return this.breakStatement();
    if (this.match(TokenType.CONTINUE)) return this.continueStatement();
    if (this.match(TokenType.GIVE)) return this.giveStatement();
    if (this.match(TokenType.DEF)) return this.fnDeclaration();
    if (this.check(TokenType.LBRACE)) return this.block();

    return this.assignmentOrExprStatement();
  }

  private varDeclaration(): VarDeclStmt {
    const letToken = this.previous();
    const nameToken = this.consume(
      TokenType.IDENTIFIER,
      "Expect variable name after 'let'"
    );

    this.consume(TokenType.EQUAL, "Expect '=' after variable name");
    const initializer = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration");

    return {
      type: "VarDeclStmt",
      name: nameToken.lexeme,
      initializer,
      line: letToken.line,
      column: letToken.column
    };
  }

  private ifStatement(): IfStmt {
    const ifToken = this.previous();
    const condition = this.expression();
    const thenBranch = this.block();
    const elifBranches: ElifBranch[] = [];

    while (this.match(TokenType.ELIF)) {
      const elifCond = this.expression();
      const elifBody = this.block();
      elifBranches.push({ condition: elifCond, body: elifBody });
    }

    let elseBranch: BlockStmt | null = null;
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.block();
    }

    return {
      type: "IfStmt",
      condition,
      thenBranch,
      elifBranches,
      elseBranch,
      line: ifToken.line,
      column: ifToken.column
    };
  }

  private whileStatement(): WhileStmt {
    const whileToken = this.previous();
    const condition = this.expression();
    const body = this.block();

    return {
      type: "WhileStmt",
      condition,
      body,
      line: whileToken.line,
      column: whileToken.column
    };
  }

  private forStatement(): ForInStmt | ForRangeStmt {
    const forToken = this.previous();
    const varToken = this.consume(
      TokenType.IDENTIFIER,
      "Expect variable name after 'for'"
    );
    this.consume(TokenType.IN, "Expect 'in' after loop variable");

    const firstExpr = this.expression();

    // Check for range loop: for i in 0..5 { ... }
    if (this.match(TokenType.DOT_DOT)) {
      const endExpr = this.expression();
      const body = this.block();
      return {
        type: "ForRangeStmt",
        variable: varToken.lexeme,
        start: firstExpr,
        end: endExpr,
        body,
        line: forToken.line,
        column: forToken.column
      };
    }

    // Otherwise iterable collection loop: for x in arr { ... }
    const body = this.block();
    return {
      type: "ForInStmt",
      variable: varToken.lexeme,
      iterable: firstExpr,
      body,
      line: forToken.line,
      column: forToken.column
    };
  }

  private repeatStatement(): RepeatStmt {
    const repeatToken = this.previous();
    const count = this.expression();
    const body = this.block();

    return {
      type: "RepeatStmt",
      count,
      body,
      line: repeatToken.line,
      column: repeatToken.column
    };
  }

  private loopStatement(): LoopStmt {
    const loopToken = this.previous();
    const body = this.block();

    return {
      type: "LoopStmt",
      body,
      line: loopToken.line,
      column: loopToken.column
    };
  }

  private breakStatement(): BreakStmt {
    const breakToken = this.previous();
    this.consume(TokenType.SEMICOLON, "Expect ';' after 'break'");
    return {
      type: "BreakStmt",
      line: breakToken.line,
      column: breakToken.column
    };
  }

  private continueStatement(): ContinueStmt {
    const continueToken = this.previous();
    this.consume(TokenType.SEMICOLON, "Expect ';' after 'continue'");
    return {
      type: "ContinueStmt",
      line: continueToken.line,
      column: continueToken.column
    };
  }

  private giveStatement(): GiveStmt {
    const giveToken = this.previous();
    let value: Expr | null = null;

    if (!this.check(TokenType.SEMICOLON)) {
      value = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after 'give'");

    return {
      type: "GiveStmt",
      value,
      line: giveToken.line,
      column: giveToken.column
    };
  }

  private fnDeclaration(): FnDeclStmt {
    const defToken = this.previous();
    const nameToken = this.consume(
      TokenType.IDENTIFIER,
      "Expect function name after 'def'"
    );

    this.consume(TokenType.LPAREN, "Expect '(' after function name");
    const params: string[] = [];
    if (!this.check(TokenType.RPAREN)) {
      do {
        const param = this.consume(
          TokenType.IDENTIFIER,
          "Expect parameter name"
        );
        params.push(param.lexeme);
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RPAREN, "Expect ')' after parameters");

    const body = this.block();
    return {
      type: "FnDeclStmt",
      name: nameToken.lexeme,
      params,
      body,
      line: defToken.line,
      column: defToken.column
    };
  }

  private block(): BlockStmt {
    const lbrace = this.consume(TokenType.LBRACE, "Expect '{' before block");
    const statements: Stmt[] = [];

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      statements.push(this.statement());
    }

    this.consume(TokenType.RBRACE, "Expect '}' after block");
    return {
      type: "BlockStmt",
      body: statements,
      line: lbrace.line,
      column: lbrace.column
    };
  }

  private assignmentOrExprStatement(): Stmt {
    const expr = this.expression();

    // Check for assignment: target (= | += | -= | *= | /=) value;
    if (
      this.match(
        TokenType.EQUAL,
        TokenType.PLUS_EQUAL,
        TokenType.MINUS_EQUAL,
        TokenType.STAR_EQUAL,
        TokenType.SLASH_EQUAL
      )
    ) {
      const opToken = this.previous();
      const op = opToken.lexeme as "=" | "+=" | "-=" | "*=" | "/=";
      const value = this.expression();
      this.consume(TokenType.SEMICOLON, "Expect ';' after assignment");

      if (expr.type === "IdentifierExpr") {
        return {
          type: "AssignStmt",
          name: expr.name,
          operator: op,
          value,
          line: expr.line,
          column: expr.column
        };
      } else if (expr.type === "IndexExpr") {
        return {
          type: "IndexAssignStmt",
          target: expr.target,
          index: expr.index,
          operator: op,
          value,
          line: expr.line,
          column: expr.column
        };
      }

      throw new ParserError("Invalid assignment target", expr.line, expr.column);
    }

    // Otherwise standard expression statement: expr;
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression");
    return {
      type: "ExprStmt",
      expression: expr,
      line: expr.line,
      column: expr.column
    };
  }

  // ------------------------------------------------------------
  // Expressions (Precedence Climbing)
  // ------------------------------------------------------------

  public expression(): Expr {
    return this.logicOr();
  }

  private logicOr(): Expr {
    let expr = this.logicAnd();

    while (this.match(TokenType.OR)) {
      const opToken = this.previous();
      const right = this.logicAnd();
      expr = {
        type: "BinaryExpr",
        left: expr,
        operator: "or",
        right,
        line: opToken.line,
        column: opToken.column
      };
    }

    return expr;
  }

  private logicAnd(): Expr {
    let expr = this.logicNot();

    while (this.match(TokenType.AND)) {
      const opToken = this.previous();
      const right = this.logicNot();
      expr = {
        type: "BinaryExpr",
        left: expr,
        operator: "and",
        right,
        line: opToken.line,
        column: opToken.column
      };
    }

    return expr;
  }

  private logicNot(): Expr {
    if (this.match(TokenType.NOT)) {
      const opToken = this.previous();
      const right = this.logicNot();
      return {
        type: "UnaryExpr",
        operator: "not",
        right,
        line: opToken.line,
        column: opToken.column
      };
    }

    return this.comparison();
  }

  private comparison(): Expr {
    let expr = this.additive();

    while (
      this.match(
        TokenType.EQUAL_EQUAL,
        TokenType.BANG_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL,
        TokenType.GREATER,
        TokenType.GREATER_EQUAL
      )
    ) {
      const opToken = this.previous();
      const right = this.additive();
      expr = {
        type: "BinaryExpr",
        left: expr,
        operator: opToken.lexeme,
        right,
        line: opToken.line,
        column: opToken.column
      };
    }

    return expr;
  }

  private additive(): Expr {
    let expr = this.multiplicative();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const opToken = this.previous();
      const right = this.multiplicative();
      expr = {
        type: "BinaryExpr",
        left: expr,
        operator: opToken.lexeme,
        right,
        line: opToken.line,
        column: opToken.column
      };
    }

    return expr;
  }

  private multiplicative(): Expr {
    let expr = this.power();

    while (
      this.match(
        TokenType.STAR,
        TokenType.SLASH,
        TokenType.SLASH_SLASH,
        TokenType.PERCENT
      )
    ) {
      const opToken = this.previous();
      const right = this.power();
      expr = {
        type: "BinaryExpr",
        left: expr,
        operator: opToken.lexeme,
        right,
        line: opToken.line,
        column: opToken.column
      };
    }

    return expr;
  }

  // Right-associative power operator: 2 ** 3 ** 4 == 2 ** (3 ** 4)
  private power(): Expr {
    let expr = this.unary();

    if (this.match(TokenType.STAR_STAR)) {
      const opToken = this.previous();
      const right = this.power(); // Recursive call for right-associativity
      expr = {
        type: "BinaryExpr",
        left: expr,
        operator: "**",
        right,
        line: opToken.line,
        column: opToken.column
      };
    }

    return expr;
  }

  private unary(): Expr {
    if (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const opToken = this.previous();
      const right = this.unary();
      return {
        type: "UnaryExpr",
        operator: opToken.lexeme,
        right,
        line: opToken.line,
        column: opToken.column
      };
    }

    return this.postfix();
  }

  private postfix(): Expr {
    let expr = this.primary();

    while (true) {
      if (this.match(TokenType.LPAREN)) {
        // Function call: callee(args...)
        const args: Expr[] = [];
        if (!this.check(TokenType.RPAREN)) {
          do {
            args.push(this.expression());
          } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RPAREN, "Expect ')' after arguments");
        expr = {
          type: "CallExpr",
          callee: expr,
          args,
          line: expr.line,
          column: expr.column
        };
      } else if (this.match(TokenType.LBRACKET)) {
        // Indexing: target[index]
        const index = this.expression();
        this.consume(TokenType.RBRACKET, "Expect ']' after array index");
        expr = {
          type: "IndexExpr",
          target: expr,
          index,
          line: expr.line,
          column: expr.column
        };
      } else {
        break;
      }
    }

    return expr;
  }

  private primary(): Expr {
    if (this.match(TokenType.INT)) {
      const token = this.previous();
      return {
        type: "LiteralExpr",
        value: token.value,
        rawType: "int",
        line: token.line,
        column: token.column
      };
    }

    if (this.match(TokenType.FLOAT)) {
      const token = this.previous();
      return {
        type: "LiteralExpr",
        value: token.value,
        rawType: "float",
        line: token.line,
        column: token.column
      };
    }

    if (this.match(TokenType.STRING)) {
      const token = this.previous();
      return {
        type: "LiteralExpr",
        value: token.value,
        rawType: "string",
        line: token.line,
        column: token.column
      };
    }

    if (this.match(TokenType.TRUE)) {
      const token = this.previous();
      return {
        type: "LiteralExpr",
        value: true,
        rawType: "bool",
        line: token.line,
        column: token.column
      };
    }

    if (this.match(TokenType.FALSE)) {
      const token = this.previous();
      return {
        type: "LiteralExpr",
        value: false,
        rawType: "bool",
        line: token.line,
        column: token.column
      };
    }

    if (this.match(TokenType.NONE)) {
      const token = this.previous();
      return {
        type: "LiteralExpr",
        value: null,
        rawType: "none",
        line: token.line,
        column: token.column
      };
    }

    if (this.match(TokenType.IDENTIFIER)) {
      const token = this.previous();
      return {
        type: "IdentifierExpr",
        name: token.lexeme,
        line: token.line,
        column: token.column
      };
    }

    // Array literal: [elem1, elem2, ...]
    if (this.match(TokenType.LBRACKET)) {
      const lbracket = this.previous();
      const elements: Expr[] = [];
      if (!this.check(TokenType.RBRACKET)) {
        do {
          elements.push(this.expression());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RBRACKET, "Expect ']' after array elements");
      return {
        type: "ArrayLiteralExpr",
        elements,
        line: lbracket.line,
        column: lbracket.column
      };
    }

    // Grouping: (expr)
    if (this.match(TokenType.LPAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RPAREN, "Expect ')' after expression");
      return expr;
    }

    const currentToken = this.peek();
    throw new ParserError(
      `Expect expression, got '${currentToken.lexeme || currentToken.type}'`,
      currentToken.line,
      currentToken.column
    );
  }

  // ------------------------------------------------------------
  // Helper methods
  // ------------------------------------------------------------

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    const token = this.peek();
    throw new ParserError(message, token.line, token.column);
  }
}
