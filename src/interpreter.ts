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
  ArrayLiteralExpr
} from "./ast";
import {
  BoltValue,
  makeInt,
  makeFloat,
  makeString,
  makeBool,
  NONE_VAL,
  makeArray,
  isTruthy,
  areEqual,
  stringifyValue
} from "./value";
import { Environment } from "./environment";
import { RuntimeError } from "./error";
import { ReturnSignal, BreakSignal, ContinueSignal } from "./signals";

export class Interpreter {
  public globals = new Environment();
  private environment: Environment;
  private callDepth = 0;
  private stepCount = 0;

  public maxSteps = 200_000;
  public maxCallDepth = 1000;
  public emitCallback: (output: string) => void = () => {};
  public inputCallback: (prompt: string) => Promise<string> = async () => "";

  constructor() {
    this.environment = this.globals;
    this.registerBuiltins();
  }

  private registerBuiltins(): void {
    // emit(val)
    this.globals.define(
      "emit",
      {
        type: "builtin",
        name: "emit",
        fn: (args, line, col) => {
          if (args.length !== 1) {
            throw new RuntimeError(
              `emit() takes exactly 1 argument (${args.length} given)`,
              line,
              col
            );
          }
          const text = stringifyValue(args[0]);
          this.emitCallback(text);
          return NONE_VAL;
        }
      },
      0,
      0
    );

    // input([prompt])
    this.globals.define(
      "input",
      {
        type: "builtin",
        name: "input",
        fn: async (args, line, col) => {
          let prompt = "";
          if (args.length === 1) {
            prompt = stringifyValue(args[0]);
          } else if (args.length > 1) {
            throw new RuntimeError(
              `input() takes at most 1 argument (${args.length} given)`,
              line,
              col
            );
          }
          const userInput = await this.inputCallback(prompt);
          return makeString(userInput);
        }
      },
      0,
      0
    );

    // int(val)
    this.globals.define(
      "int",
      {
        type: "builtin",
        name: "int",
        fn: (args, line, col) => {
          if (args.length !== 1) {
            throw new RuntimeError(
              `int() takes exactly 1 argument (${args.length} given)`,
              line,
              col
            );
          }
          const val = args[0];
          if (val.type === "int") return val;
          if (val.type === "float") return makeInt(val.value);
          if (val.type === "string") {
            const parsed = parseInt(val.value.trim(), 10);
            if (isNaN(parsed)) {
              throw new RuntimeError(
                `Cannot parse integer from string '${val.value}'`,
                line,
                col
              );
            }
            return makeInt(parsed);
          }
          throw new RuntimeError(
            `Cannot convert '${val.type}' to int`,
            line,
            col
          );
        }
      },
      0,
      0
    );

    // float(val)
    this.globals.define(
      "float",
      {
        type: "builtin",
        name: "float",
        fn: (args, line, col) => {
          if (args.length !== 1) {
            throw new RuntimeError(
              `float() takes exactly 1 argument (${args.length} given)`,
              line,
              col
            );
          }
          const val = args[0];
          if (val.type === "float") return val;
          if (val.type === "int") return makeFloat(val.value);
          if (val.type === "string") {
            const parsed = parseFloat(val.value.trim());
            if (isNaN(parsed)) {
              throw new RuntimeError(
                `Cannot parse float from string '${val.value}'`,
                line,
                col
              );
            }
            return makeFloat(parsed);
          }
          throw new RuntimeError(
            `Cannot convert '${val.type}' to float`,
            line,
            col
          );
        }
      },
      0,
      0
    );

    // string(val)
    this.globals.define(
      "string",
      {
        type: "builtin",
        name: "string",
        fn: (args, line, col) => {
          if (args.length !== 1) {
            throw new RuntimeError(
              `string() takes exactly 1 argument (${args.length} given)`,
              line,
              col
            );
          }
          return makeString(stringifyValue(args[0]));
        }
      },
      0,
      0
    );

    // len(arr | string)
    this.globals.define(
      "len",
      {
        type: "builtin",
        name: "len",
        fn: (args, line, col) => {
          if (args.length !== 1) {
            throw new RuntimeError(
              `len() takes exactly 1 argument (${args.length} given)`,
              line,
              col
            );
          }
          const arg = args[0];
          if (arg.type === "array") {
            return makeInt(arg.value.length);
          } else if (arg.type === "string") {
            return makeInt(arg.value.length);
          }
          throw new RuntimeError(
            `len() argument must be an array or string, not '${arg.type}'`,
            line,
            col
          );
        }
      },
      0,
      0
    );

    // push(arr, x)
    this.globals.define(
      "push",
      {
        type: "builtin",
        name: "push",
        fn: (args, line, col) => {
          if (args.length !== 2) {
            throw new RuntimeError(
              `push() takes exactly 2 arguments (${args.length} given)`,
              line,
              col
            );
          }
          const arr = args[0];
          if (arr.type !== "array") {
            throw new RuntimeError(
              `push() first argument must be an array, not '${arr.type}'`,
              line,
              col
            );
          }
          arr.value.push(args[1]);
          return NONE_VAL;
        }
      },
      0,
      0
    );

    // pop(arr)
    this.globals.define(
      "pop",
      {
        type: "builtin",
        name: "pop",
        fn: (args, line, col) => {
          if (args.length !== 1) {
            throw new RuntimeError(
              `pop() takes exactly 1 argument (${args.length} given)`,
              line,
              col
            );
          }
          const arr = args[0];
          if (arr.type !== "array") {
            throw new RuntimeError(
              `pop() argument must be an array, not '${arr.type}'`,
              line,
              col
            );
          }
          if (arr.value.length === 0) {
            throw new RuntimeError("pop() from empty array", line, col);
          }
          return arr.value.pop()!;
        }
      },
      0,
      0
    );
  }

  public async interpret(program: Program): Promise<void> {
    this.stepCount = 0;
    this.callDepth = 0;

    for (const stmt of program.body) {
      await this.execute(stmt);
    }
  }

  // ------------------------------------------------------------
  // Statements
  // ------------------------------------------------------------

  private checkStepLimit(line: number, col: number): void {
    this.stepCount++;
    if (this.stepCount > this.maxSteps) {
      throw new RuntimeError(
        `Step limit exceeded (${this.maxSteps} steps). Possible infinite loop.`,
        line,
        col
      );
    }
  }

  public async execute(stmt: Stmt): Promise<void> {
    this.checkStepLimit(stmt.line, stmt.column);

    switch (stmt.type) {
      case "Program":
        for (const s of stmt.body) await this.execute(s);
        break;

      case "BlockStmt":
        await this.executeBlock(stmt, new Environment(this.environment));
        break;

      case "VarDeclStmt": {
        const val = await this.evaluate(stmt.initializer);
        this.environment.define(stmt.name, val, stmt.line, stmt.column);
        break;
      }

      case "AssignStmt": {
        const value = await this.evaluate(stmt.value);
        if (stmt.operator === "=") {
          this.environment.assign(stmt.name, value, stmt.line, stmt.column);
        } else {
          const current = this.environment.get(
            stmt.name,
            stmt.line,
            stmt.column
          );
          const op = stmt.operator.slice(0, -1);
          const result = this.executeBinaryOp(
            current,
            op,
            value,
            stmt.line,
            stmt.column
          );
          this.environment.assign(stmt.name, result, stmt.line, stmt.column);
        }
        break;
      }

      case "IndexAssignStmt": {
        const target = await this.evaluate(stmt.target);
        if (target.type !== "array") {
          throw new RuntimeError(
            `Cannot index-assign into non-array type '${target.type}'`,
            stmt.line,
            stmt.column
          );
        }

        const indexVal = await this.evaluate(stmt.index);
        if (indexVal.type !== "int") {
          throw new RuntimeError(
            `Array index must be an integer, got '${indexVal.type}'`,
            stmt.line,
            stmt.column
          );
        }

        const idx = indexVal.value;
        if (idx < 0 || idx >= target.value.length) {
          throw new RuntimeError(
            `Array index out of bounds: index ${idx}, length ${target.value.length}`,
            stmt.line,
            stmt.column
          );
        }

        const value = await this.evaluate(stmt.value);
        if (stmt.operator === "=") {
          target.value[idx] = value;
        } else {
          const current = target.value[idx];
          const op = stmt.operator.slice(0, -1);
          const result = this.executeBinaryOp(
            current,
            op,
            value,
            stmt.line,
            stmt.column
          );
          target.value[idx] = result;
        }
        break;
      }

      case "IfStmt": {
        const cond = await this.evaluate(stmt.condition);
        if (isTruthy(cond)) {
          await this.execute(stmt.thenBranch);
          return;
        }

        for (const elif of stmt.elifBranches) {
          const elifCond = await this.evaluate(elif.condition);
          if (isTruthy(elifCond)) {
            await this.execute(elif.body);
            return;
          }
        }

        if (stmt.elseBranch) {
          await this.execute(stmt.elseBranch);
        }
        break;
      }

      case "WhileStmt": {
        while (isTruthy(await this.evaluate(stmt.condition))) {
          this.checkStepLimit(stmt.line, stmt.column);
          try {
            await this.execute(stmt.body);
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (e instanceof ContinueSignal) continue;
            throw e;
          }
        }
        break;
      }

      case "ForInStmt": {
        const iterable = await this.evaluate(stmt.iterable);
        if (iterable.type !== "array") {
          throw new RuntimeError(
            `'for..in' expects array, got '${iterable.type}'`,
            stmt.line,
            stmt.column
          );
        }

        for (const item of iterable.value) {
          this.checkStepLimit(stmt.line, stmt.column);
          const loopEnv = new Environment(this.environment);
          loopEnv.define(stmt.variable, item, stmt.line, stmt.column);
          try {
            await this.executeBlock(stmt.body, loopEnv);
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (e instanceof ContinueSignal) continue;
            throw e;
          }
        }
        break;
      }

      case "ForRangeStmt": {
        const startVal = await this.evaluate(stmt.start);
        const endVal = await this.evaluate(stmt.end);

        if (startVal.type !== "int" || endVal.type !== "int") {
          throw new RuntimeError(
            "Range bounds in 'for..in start..end' must be integers",
            stmt.line,
            stmt.column
          );
        }

        const start = startVal.value;
        const end = endVal.value;

        for (let i = start; i < end; i++) {
          this.checkStepLimit(stmt.line, stmt.column);
          const loopEnv = new Environment(this.environment);
          loopEnv.define(stmt.variable, makeInt(i), stmt.line, stmt.column);
          try {
            await this.executeBlock(stmt.body, loopEnv);
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (e instanceof ContinueSignal) continue;
            throw e;
          }
        }
        break;
      }

      case "RepeatStmt": {
        const countVal = await this.evaluate(stmt.count);
        if (countVal.type !== "int") {
          throw new RuntimeError(
            `'repeat' count must be an integer, got '${countVal.type}'`,
            stmt.line,
            stmt.column
          );
        }

        const count = countVal.value;
        for (let i = 0; i < count; i++) {
          this.checkStepLimit(stmt.line, stmt.column);
          try {
            await this.execute(stmt.body);
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (e instanceof ContinueSignal) continue;
            throw e;
          }
        }
        break;
      }

      case "LoopStmt": {
        while (true) {
          this.checkStepLimit(stmt.line, stmt.column);
          try {
            await this.execute(stmt.body);
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (e instanceof ContinueSignal) continue;
            throw e;
          }
        }
        break;
      }

      case "BreakStmt":
        throw new BreakSignal();

      case "ContinueStmt":
        throw new ContinueSignal();

      case "GiveStmt": {
        const val = stmt.value ? await this.evaluate(stmt.value) : NONE_VAL;
        throw new ReturnSignal(val);
      }

      case "FnDeclStmt": {
        const fnVal: BoltValue = {
          type: "function",
          name: stmt.name,
          params: stmt.params,
          body: stmt.body,
          closure: this.environment
        };
        this.environment.define(stmt.name, fnVal, stmt.line, stmt.column);
        break;
      }

      case "ExprStmt":
        await this.evaluate(stmt.expression);
        break;
    }
  }

  private async executeBlock(block: BlockStmt, env: Environment): Promise<void> {
    const previous = this.environment;
    try {
      this.environment = env;
      for (const statement of block.body) {
        await this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
  }

  // ------------------------------------------------------------
  // Expressions
  // ------------------------------------------------------------

  public async evaluate(expr: Expr): Promise<BoltValue> {
    switch (expr.type) {
      case "LiteralExpr":
        switch (expr.rawType) {
          case "int": return makeInt(expr.value);
          case "float": return makeFloat(expr.value);
          case "string": return makeString(expr.value);
          case "bool": return makeBool(expr.value);
          case "none": return NONE_VAL;
        }
        break;

      case "IdentifierExpr":
        return this.environment.get(expr.name, expr.line, expr.column);

      case "UnaryExpr": {
        const right = await this.evaluate(expr.right);
        switch (expr.operator) {
          case "-":
            if (right.type === "int") return makeInt(-right.value);
            if (right.type === "float") return makeFloat(-right.value);
            throw new RuntimeError(
              `Bad operand type for unary '-': '${right.type}'`,
              expr.line,
              expr.column
            );
          case "+":
            if (right.type === "int" || right.type === "float") return right;
            throw new RuntimeError(
              `Bad operand type for unary '+': '${right.type}'`,
              expr.line,
              expr.column
            );
          case "not":
            return makeBool(!isTruthy(right));
          default:
            throw new RuntimeError(
              `Unknown unary operator '${expr.operator}'`,
              expr.line,
              expr.column
            );
        }
      }

      case "BinaryExpr": {
        if (expr.operator === "or") {
          const left = await this.evaluate(expr.left);
          if (isTruthy(left)) return left;
          return await this.evaluate(expr.right);
        }

        if (expr.operator === "and") {
          const left = await this.evaluate(expr.left);
          if (!isTruthy(left)) return left;
          return await this.evaluate(expr.right);
        }

        const left = await this.evaluate(expr.left);
        const right = await this.evaluate(expr.right);
        return this.executeBinaryOp(
          left,
          expr.operator,
          right,
          expr.line,
          expr.column
        );
      }

      case "CallExpr": {
        const callee = await this.evaluate(expr.callee);
        const args: BoltValue[] = [];
        for (const a of expr.args) {
          args.push(await this.evaluate(a));
        }

        if (callee.type === "builtin") {
          return await callee.fn(args, expr.line, expr.column);
        }

        if (callee.type === "function") {
          if (args.length !== callee.params.length) {
            throw new RuntimeError(
              `Function '${callee.name}' takes ${callee.params.length} arguments but ${args.length} were given`,
              expr.line,
              expr.column
            );
          }

          if (this.callDepth >= this.maxCallDepth) {
            throw new RuntimeError(
              `Maximum call stack depth of ${this.maxCallDepth} exceeded (possible infinite recursion)`,
              expr.line,
              expr.column
            );
          }

          const fnEnv = new Environment(callee.closure);
          for (let i = 0; i < callee.params.length; i++) {
            fnEnv.define(
              callee.params[i],
              args[i],
              expr.line,
              expr.column
            );
          }

          this.callDepth++;
          try {
            await this.executeBlock(callee.body, fnEnv);
          } catch (e) {
            if (e instanceof ReturnSignal) {
              return e.value;
            }
            throw e;
          } finally {
            this.callDepth--;
          }

          return NONE_VAL;
        }

        throw new RuntimeError(
          `'${callee.type}' is not callable`,
          expr.line,
          expr.column
        );
      }

      case "IndexExpr": {
        const target = await this.evaluate(expr.target);
        if (target.type !== "array") {
          throw new RuntimeError(
            `Cannot index non-array type '${target.type}'`,
            expr.line,
            expr.column
          );
        }

        const indexVal = await this.evaluate(expr.index);
        if (indexVal.type !== "int") {
          throw new RuntimeError(
            `Array index must be an integer, got '${indexVal.type}'`,
            expr.line,
            expr.column
          );
        }

        const idx = indexVal.value;
        if (idx < 0 || idx >= target.value.length) {
          throw new RuntimeError(
            `Array index out of bounds: index ${idx}, length ${target.value.length}`,
            expr.line,
            expr.column
          );
        }

        return target.value[idx];
      }

      case "ArrayLiteralExpr": {
        const elements: BoltValue[] = [];
        for (const e of expr.elements) {
          elements.push(await this.evaluate(e));
        }
        return makeArray(elements);
      }
    }
  }

  private executeBinaryOp(
    left: BoltValue,
    op: string,
    right: BoltValue,
    line: number,
    col: number
  ): BoltValue {
    if (op === "==") return makeBool(areEqual(left, right));
    if (op === "!=") return makeBool(!areEqual(left, right));

    const isLeftNum = left.type === "int" || left.type === "float";
    const isRightNum = right.type === "int" || right.type === "float";

    if (op === "+") {
      if (left.type === "string" && right.type === "string") {
        return makeString(left.value + right.value);
      }
      if (left.type === "int" && right.type === "int") {
        return makeInt(left.value + right.value);
      }
      if (isLeftNum && isRightNum) {
        return makeFloat(left.value + right.value);
      }
      throw new RuntimeError(
        `Unsupported operand types for '+': '${left.type}' and '${right.type}'`,
        line,
        col
      );
    }

    if (op === "-" || op === "*") {
      if (!isLeftNum || !isRightNum) {
        throw new RuntimeError(
          `Unsupported operand types for '${op}': '${left.type}' and '${right.type}'`,
          line,
          col
        );
      }
      const isFloatResult = left.type === "float" || right.type === "float";
      const res = op === "-" ? left.value - right.value : left.value * right.value;
      return isFloatResult ? makeFloat(res) : makeInt(res);
    }

    if (op === "/") {
      if (!isLeftNum || !isRightNum) {
        throw new RuntimeError(
          `Unsupported operand types for '/': '${left.type}' and '${right.type}'`,
          line,
          col
        );
      }
      if (right.value === 0) {
        throw new RuntimeError("Division by zero", line, col);
      }
      return makeFloat(left.value / right.value);
    }

    if (op === "//") {
      if (left.type !== "int" || right.type !== "int") {
        throw new RuntimeError(
          `Integer division '//' requires integer operands, got '${left.type}' and '${right.type}'`,
          line,
          col
        );
      }
      if (right.value === 0) {
        throw new RuntimeError("Integer division by zero", line, col);
      }
      return makeInt(Math.floor(left.value / right.value));
    }

    if (op === "%") {
      if (left.type !== "int" || right.type !== "int") {
        throw new RuntimeError(
          `Modulo '%' requires integer operands, got '${left.type}' and '${right.type}'`,
          line,
          col
        );
      }
      if (right.value === 0) {
        throw new RuntimeError("Modulo by zero", line, col);
      }
      const mod = ((left.value % right.value) + right.value) % right.value;
      return makeInt(mod);
    }

    if (op === "**") {
      if (!isLeftNum || !isRightNum) {
        throw new RuntimeError(
          `Power '**' requires numeric operands, got '${left.type}' and '${right.type}'`,
          line,
          col
        );
      }
      const res = Math.pow(left.value, right.value);
      if (left.type === "int" && right.type === "int" && right.value >= 0) {
        return makeInt(res);
      }
      return makeFloat(res);
    }

    if (op === "<" || op === "<=" || op === ">" || op === ">=") {
      if (isLeftNum && isRightNum) {
        switch (op) {
          case "<": return makeBool(left.value < right.value);
          case "<=": return makeBool(left.value <= right.value);
          case ">": return makeBool(left.value > right.value);
          case ">=": return makeBool(left.value >= right.value);
        }
      }
      if (left.type === "string" && right.type === "string") {
        switch (op) {
          case "<": return makeBool(left.value < right.value);
          case "<=": return makeBool(left.value <= right.value);
          case ">": return makeBool(left.value > right.value);
          case ">=": return makeBool(left.value >= right.value);
        }
      }
      throw new RuntimeError(
        `Comparison '${op}' not supported between '${left.type}' and '${right.type}'`,
        line,
        col
      );
    }

    throw new RuntimeError(`Unknown binary operator '${op}'`, line, col);
  }
}
