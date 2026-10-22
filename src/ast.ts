export type Stmt =
  | Program
  | BlockStmt
  | VarDeclStmt
  | AssignStmt
  | IndexAssignStmt
  | IfStmt
  | WhileStmt
  | ForInStmt
  | ForRangeStmt
  | RepeatStmt
  | LoopStmt
  | BreakStmt
  | ContinueStmt
  | GiveStmt
  | FnDeclStmt
  | ExprStmt;

export type Expr =
  | LiteralExpr
  | IdentifierExpr
  | UnaryExpr
  | BinaryExpr
  | CallExpr
  | IndexExpr
  | ArrayLiteralExpr;

export interface BaseNode {
  line: number;
  column: number;
}

// ------------------------------------------------------------
// Statements
// ------------------------------------------------------------

export interface Program extends BaseNode {
  type: "Program";
  body: Stmt[];
}

export interface BlockStmt extends BaseNode {
  type: "BlockStmt";
  body: Stmt[];
}

export interface VarDeclStmt extends BaseNode {
  type: "VarDeclStmt";
  name: string;
  initializer: Expr;
}

export interface AssignStmt extends BaseNode {
  type: "AssignStmt";
  name: string;
  operator: "=" | "+=" | "-=" | "*=" | "/=";
  value: Expr;
}

export interface IndexAssignStmt extends BaseNode {
  type: "IndexAssignStmt";
  target: Expr;
  index: Expr;
  operator: "=" | "+=" | "-=" | "*=" | "/=";
  value: Expr;
}

export interface ElifBranch {
  condition: Expr;
  body: BlockStmt;
}

export interface IfStmt extends BaseNode {
  type: "IfStmt";
  condition: Expr;
  thenBranch: BlockStmt;
  elifBranches: ElifBranch[];
  elseBranch: BlockStmt | null;
}

export interface WhileStmt extends BaseNode {
  type: "WhileStmt";
  condition: Expr;
  body: BlockStmt;
}

export interface ForInStmt extends BaseNode {
  type: "ForInStmt";
  variable: string;
  iterable: Expr;
  body: BlockStmt;
}

export interface ForRangeStmt extends BaseNode {
  type: "ForRangeStmt";
  variable: string;
  start: Expr;
  end: Expr;
  body: BlockStmt;
}

export interface RepeatStmt extends BaseNode {
  type: "RepeatStmt";
  count: Expr;
  body: BlockStmt;
}

export interface LoopStmt extends BaseNode {
  type: "LoopStmt";
  body: BlockStmt;
}

export interface BreakStmt extends BaseNode {
  type: "BreakStmt";
}

export interface ContinueStmt extends BaseNode {
  type: "ContinueStmt";
}

export interface GiveStmt extends BaseNode {
  type: "GiveStmt";
  value: Expr | null;
}

export interface FnDeclStmt extends BaseNode {
  type: "FnDeclStmt";
  name: string;
  params: string[];
  body: BlockStmt;
}

export interface ExprStmt extends BaseNode {
  type: "ExprStmt";
  expression: Expr;
}

// ------------------------------------------------------------
// Expressions
// ------------------------------------------------------------

export interface LiteralExpr extends BaseNode {
  type: "LiteralExpr";
  value: any;
  rawType: "int" | "float" | "string" | "bool" | "none";
}

export interface IdentifierExpr extends BaseNode {
  type: "IdentifierExpr";
  name: string;
}

export interface UnaryExpr extends BaseNode {
  type: "UnaryExpr";
  operator: string;
  right: Expr;
}

export interface BinaryExpr extends BaseNode {
  type: "BinaryExpr";
  left: Expr;
  operator: string;
  right: Expr;
}

export interface CallExpr extends BaseNode {
  type: "CallExpr";
  callee: Expr;
  args: Expr[];
}

export interface IndexExpr extends BaseNode {
  type: "IndexExpr";
  target: Expr;
  index: Expr;
}

export interface ArrayLiteralExpr extends BaseNode {
  type: "ArrayLiteralExpr";
  elements: Expr[];
}
