import { Stmt, Expr } from "./ast";

export class ASTPrinter {
  public print(stmt: Stmt): string {
    return this.printStmt(stmt);
  }

  public printStmt(stmt: Stmt): string {
    switch (stmt.type) {
      case "Program":
        return stmt.body.map(s => this.printStmt(s)).join("\n");

      case "BlockStmt":
        return `{ ${stmt.body.map(s => this.printStmt(s)).join("; ")} }`;

      case "VarDeclStmt":
        return `(let ${stmt.name} = ${this.printExpr(stmt.initializer)})`;

      case "AssignStmt":
        return `(${stmt.operator} ${stmt.name} ${this.printExpr(stmt.value)})`;

      case "IndexAssignStmt":
        return `(${stmt.operator} (index ${this.printExpr(stmt.target)} ${this.printExpr(stmt.index)}) ${this.printExpr(stmt.value)})`;

      case "IfStmt": {
        let res = `(if ${this.printExpr(stmt.condition)} ${this.printStmt(stmt.thenBranch)}`;
        for (const elif of stmt.elifBranches) {
          res += ` elif ${this.printExpr(elif.condition)} ${this.printStmt(elif.body)}`;
        }
        if (stmt.elseBranch) {
          res += ` else ${this.printStmt(stmt.elseBranch)}`;
        }
        res += ")";
        return res;
      }

      case "WhileStmt":
        return `(while ${this.printExpr(stmt.condition)} ${this.printStmt(stmt.body)})`;

      case "ForInStmt":
        return `(for ${stmt.variable} in ${this.printExpr(stmt.iterable)} ${this.printStmt(stmt.body)})`;

      case "ForRangeStmt":
        return `(for ${stmt.variable} in ${this.printExpr(stmt.start)}..${this.printExpr(stmt.end)} ${this.printStmt(stmt.body)})`;

      case "RepeatStmt":
        return `(repeat ${this.printExpr(stmt.count)} ${this.printStmt(stmt.body)})`;

      case "LoopStmt":
        return `(loop ${this.printStmt(stmt.body)})`;

      case "BreakStmt":
        return `(break)`;

      case "ContinueStmt":
        return `(continue)`;

      case "GiveStmt":
        return stmt.value ? `(give ${this.printExpr(stmt.value)})` : `(give)`;

      case "FnDeclStmt":
        return `(def ${stmt.name} [${stmt.params.join(", ")}] ${this.printStmt(stmt.body)})`;

      case "ExprStmt":
        return this.printExpr(stmt.expression);
    }
  }

  public printExpr(expr: Expr): string {
    switch (expr.type) {
      case "LiteralExpr":
        if (expr.rawType === "string") return JSON.stringify(expr.value);
        if (expr.rawType === "none") return "none";
        return String(expr.value);

      case "IdentifierExpr":
        return expr.name;

      case "UnaryExpr":
        return `(${expr.operator} ${this.printExpr(expr.right)})`;

      case "BinaryExpr":
        return `(${expr.operator} ${this.printExpr(expr.left)} ${this.printExpr(expr.right)})`;

      case "CallExpr":
        return `(call ${this.printExpr(expr.callee)} [${expr.args.map(a => this.printExpr(a)).join(", ")}])`;

      case "IndexExpr":
        return `(index ${this.printExpr(expr.target)} ${this.printExpr(expr.index)})`;

      case "ArrayLiteralExpr":
        return `[${expr.elements.map(e => this.printExpr(e)).join(", ")}]`;
    }
  }
}
