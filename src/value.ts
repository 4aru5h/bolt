import { BlockStmt } from "./ast";
import { Environment } from "./environment";

export type BoltValue =
  | { type: "int"; value: number }
  | { type: "float"; value: number }
  | { type: "string"; value: string }
  | { type: "bool"; value: boolean }
  | { type: "none"; value: null }
  | { type: "array"; value: BoltValue[] }
  | {
      type: "function";
      name: string;
      params: string[];
      body: BlockStmt;
      closure: Environment;
    }
  | {
      type: "builtin";
      name: string;
      fn: (args: BoltValue[], line: number, column: number) => BoltValue | Promise<BoltValue>;
    };

export function makeInt(n: number): BoltValue {
  return { type: "int", value: Math.trunc(n) };
}

export function makeFloat(n: number): BoltValue {
  return { type: "float", value: n };
}

export function makeString(s: string): BoltValue {
  return { type: "string", value: s };
}

export function makeBool(b: boolean): BoltValue {
  return { type: "bool", value: b };
}

export const NONE_VAL: BoltValue = { type: "none", value: null };

export function makeArray(elements: BoltValue[] = []): BoltValue {
  return { type: "array", value: elements };
}

/**
 * Truthiness rule: Python-style
 * false, none, 0, 0.0, "", [] are falsy. Everything else is truthy.
 */
export function isTruthy(val: BoltValue): boolean {
  switch (val.type) {
    case "bool":
      return val.value;
    case "none":
      return false;
    case "int":
    case "float":
      return val.value !== 0;
    case "string":
      return val.value.length > 0;
    case "array":
      return val.value.length > 0;
    case "function":
    case "builtin":
      return true;
  }
}

/**
 * Value Equality:
 * Numbers compare numerically (5 == 5.0 is true).
 * Different types are never equal (0 == false is false).
 * Arrays compare by reference identity.
 */
export function areEqual(a: BoltValue, b: BoltValue): boolean {
  if (
    (a.type === "int" || a.type === "float") &&
    (b.type === "int" || b.type === "float")
  ) {
    return a.value === b.value;
  }

  if (a.type !== b.type) return false;

  switch (a.type) {
    case "none":
      return true;
    case "bool":
      return a.value === (b as typeof a).value;
    case "string":
      return a.value === (b as typeof a).value;
    case "array":
      // Reference equality
      return a.value === (b as typeof a).value;
    case "function":
    case "builtin":
      return a === b;
    default:
      return false;
  }
}

/**
 * Stringifies a Bolt value for `emit()` or display.
 */
export function stringifyValue(val: BoltValue): string {
  switch (val.type) {
    case "int":
    case "float":
      return String(val.value);
    case "string":
      return val.value;
    case "bool":
      return val.value ? "true" : "false";
    case "none":
      return "none";
    case "array":
      return `[${val.value.map(stringifyValue).join(", ")}]`;
    case "function":
      return `<fn ${val.name}>`;
    case "builtin":
      return `<builtin ${val.name}>`;
  }
}
