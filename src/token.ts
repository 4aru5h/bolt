export enum TokenType {
  // Literals
  INT = "INT",
  FLOAT = "FLOAT",
  STRING = "STRING",
  IDENTIFIER = "IDENTIFIER",

  // Keywords
  LET = "LET",
  IF = "IF",
  ELIF = "ELIF",
  ELSE = "ELSE",
  WHILE = "WHILE",
  FOR = "FOR",
  IN = "IN",
  REPEAT = "REPEAT",
  LOOP = "LOOP",
  BREAK = "BREAK",
  CONTINUE = "CONTINUE",
  GIVE = "GIVE",
  DEF = "DEF",
  AND = "AND",
  OR = "OR",
  NOT = "NOT",
  TRUE = "TRUE",
  FALSE = "FALSE",
  NONE = "NONE",

  // Operators
  PLUS = "+",
  MINUS = "-",
  STAR = "*",
  SLASH = "/",
  SLASH_SLASH = "//",
  PERCENT = "%",
  STAR_STAR = "**",

  EQUAL = "=",
  PLUS_EQUAL = "+=",
  MINUS_EQUAL = "-=",
  STAR_EQUAL = "*=",
  SLASH_EQUAL = "/=",

  EQUAL_EQUAL = "==",
  BANG_EQUAL = "!=",
  LESS = "<",
  LESS_EQUAL = "<=",
  GREATER = ">",
  GREATER_EQUAL = ">=",

  DOT_DOT = "..",

  // Delimiters
  LPAREN = "(",
  RPAREN = ")",
  LBRACE = "{",
  RBRACE = "}",
  LBRACKET = "[",
  RBRACKET = "]",
  COMMA = ",",
  SEMICOLON = ";",

  // Special
  EOF = "EOF"
}

export interface Token {
  type: TokenType;
  lexeme: string;
  value: any;
  line: number;
  column: number;
}

export const KEYWORDS: Record<string, TokenType> = {
  let: TokenType.LET,
  if: TokenType.IF,
  elif: TokenType.ELIF,
  else: TokenType.ELSE,
  while: TokenType.WHILE,
  for: TokenType.FOR,
  in: TokenType.IN,
  repeat: TokenType.REPEAT,
  loop: TokenType.LOOP,
  break: TokenType.BREAK,
  continue: TokenType.CONTINUE,
  give: TokenType.GIVE,
  def: TokenType.DEF,
  and: TokenType.AND,
  or: TokenType.OR,
  not: TokenType.NOT,
  true: TokenType.TRUE,
  false: TokenType.FALSE,
  none: TokenType.NONE
};
