import { describe, it, expect } from "vitest";
import { runBolt } from "../src/index";

describe("Interpreter End-to-End", () => {
  it("evaluates arithmetic, division, floor division, power and modulo", async () => {
    const code = `
emit(10 + 5);
emit(10 - 3);
emit(4 * 2.5);
emit(7 / 2);      # float 3.5
emit(7 // 2);     # int 3
emit(2 ** 8);     # int 256
emit(2 ** -1);    # float 0.5
emit(17 % 5);     # int 2
`;
    const res = await runBolt(code);
    expect(res.error).toBeNull();
    expect(res.output).toEqual([
      "15",
      "7",
      "10",
      "3.5",
      "3",
      "256",
      "0.5",
      "2"
    ]);
  });

  it("handles variable declarations, scoping, and compound assignments", async () => {
    const code = `
let x = 10;
x += 5;
x *= 2;
emit(x);

{
  let x = 99; # shadow in block
  x += 1;
  emit(x);
}

emit(x); # original x intact
`;
    const res = await runBolt(code);
    expect(res.error).toBeNull();
    expect(res.output).toEqual(["30", "100", "30"]);
  });

  it("throws error when re-declaring variable in same scope", async () => {
    const code = `
let a = 1;
let a = 2;
`;
    const res = await runBolt(code);
    expect(res.error).toContain("Variable 'a' is already defined in this scope");
  });

  it("evaluates if / elif / else branches", async () => {
    const code = `
let val = 0;
if val > 0 {
  emit("positive");
} elif val < 0 {
  emit("negative");
} else {
  emit("zero");
}
`;
    const res = await runBolt(code);
    expect(res.error).toBeNull();
    expect(res.output).toEqual(["zero"]);
  });

  it("handles all loop types: while, for-in, for-range, repeat, loop with break/continue", async () => {
    const code = `
# while
let w = 0;
while w < 3 {
  emit(w);
  w += 1;
}

# for-range
for i in 10..13 {
  emit(i);
}

# for-in
for fruit in ["apple", "banana"] {
  emit(fruit);
}

# repeat
repeat 2 {
  emit("rep");
}

# loop with break and continue
let c = 0;
loop {
  c += 1;
  if c == 2 {
    continue;
  }
  if c > 3 {
    break;
  }
  emit(c);
}
`;
    const res = await runBolt(code);
    expect(res.error).toBeNull();
    expect(res.output).toEqual([
      "0", "1", "2",
      "10", "11", "12",
      "apple", "banana",
      "rep", "rep",
      "1", "3"
    ]);
  });

  it("handles arrays, indexing, index assignments, and builtins", async () => {
    const code = `
let arr = [10, 20, 30];
emit(len(arr));
emit(arr[1]);

arr[1] = 99;
arr[0] += 5;
emit(arr);

push(arr, 40);
emit(len(arr));
let popped = pop(arr);
emit(popped);
emit(arr);
`;
    const res = await runBolt(code);
    expect(res.error).toBeNull();
    expect(res.output).toEqual([
      "3",
      "20",
      "[15, 99, 30]",
      "4",
      "40",
      "[15, 99, 30]"
    ]);
  });

  it("supports functions, recursion, and give statement", async () => {
    const code = `
def factorial(n) {
  if n <= 1 {
    give 1;
  }
  give n * factorial(n - 1);
}

emit(factorial(5));
emit(factorial(6));
`;
    const res = await runBolt(code);
    expect(res.error).toBeNull();
    expect(res.output).toEqual(["120", "720"]);
  });

  it("executes recursive quicksort correctly", async () => {
    const code = `
def quicksort(arr) {
    if len(arr) <= 1 {
        give arr;
    }

    let pivot = arr[0];
    let less = [];
    let equal = [];
    let greater = [];

    for item in arr {
        if item < pivot {
            push(less, item);
        } elif item > pivot {
            push(greater, item);
        } else {
            push(equal, item);
        }
    }

    let sorted_less = quicksort(less);
    let sorted_greater = quicksort(greater);

    let result = [];
    for x in sorted_less {
        push(result, x);
    }
    for x in equal {
        push(result, x);
    }
    for x in sorted_greater {
        push(result, x);
    }

    give result;
}

let numbers = [5, 2, 8, 1, 9, 3];
let sorted = quicksort(numbers);
emit(sorted);
`;
    const res = await runBolt(code);
    expect(res.error).toBeNull();
    expect(res.output).toEqual(["[1, 2, 3, 5, 8, 9]"]);
  });

  it("executes the basic calculator program cleanly", async () => {
    const code = `
def calculate(op, a, b) {
    if op == "+" {
        give a + b;
    } elif op == "-" {
        give a - b;
    } elif op == "*" {
        give a * b;
    } elif op == "/" {
        give a / b;
    } elif op == "//" {
        give a // b;
    } elif op == "**" {
        give a ** b;
    }
}

let tests = [
  ["+", 10, 5],
  ["-", 10, 4],
  ["*", 6, 7],
  ["/", 7, 2],
  ["//", 7, 2],
  ["**", 2, 8]
];

for t in tests {
  emit(calculate(t[0], t[1], t[2]));
}
`;
    const res = await runBolt(code);
    expect(res.error).toBeNull();
    expect(res.output).toEqual(["15", "6", "42", "3.5", "3", "256"]);
  });

  it("supports input() and type conversion built-ins", async () => {
    const code = `
let name = input("Enter name: ");
let age_str = input("Enter age: ");
let age = int(age_str);
let next_age = age + 1;

emit("Hello " + name);
emit("Next year you will be:");
emit(next_age);
`;
    const mockInputs = ["Alex", "20"];
    const promptsReceived: string[] = [];

    const res = await runBolt(code, undefined, {
      onInput: async (prompt) => {
        promptsReceived.push(prompt);
        return mockInputs.shift() || "";
      }
    });

    expect(res.error).toBeNull();
    expect(promptsReceived).toEqual(["Enter name: ", "Enter age: "]);
    expect(res.output).toEqual([
      "Hello Alex",
      "Next year you will be:",
      "21"
    ]);
  });

  it("safely halts infinite loops via step limit", async () => {
    const code = `
loop {
  # infinite loop
}
`;
    const res = await runBolt(code, undefined, { maxSteps: 500 });
    expect(res.error).toContain("Step limit exceeded");
  });

  it("safely catches infinite recursion via call stack limit", async () => {
    const code = `
def recurse() {
  recurse();
}
recurse();
`;
    const res = await runBolt(code, undefined, { maxCallDepth: 50 });
    expect(res.error).toContain("Maximum call stack depth");
  });

  it("reports runtime array bounds errors accurately", async () => {
    const code = `
let a = [1, 2];
emit(a[5]);
`;
    const res = await runBolt(code);
    expect(res.error).toContain("Array index out of bounds: index 5, length 2");
  });

  it("reports division by zero cleanly", async () => {
    const code = "let x = 10 / 0;";
    const res = await runBolt(code);
    expect(res.error).toContain("Division by zero");
  });
});
