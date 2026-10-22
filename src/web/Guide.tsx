import React from "react";

interface GuideProps {
  onLoadSnippet: (code: string) => void;
}

export const Guide: React.FC<GuideProps> = ({ onLoadSnippet }) => {
  const sections = [
    {
      title: "Variables & Types",
      note: "Dynamic typing. Types: int, float, string, bool, array, none. Variables are declared with let. Statements end with a semicolon.",
      code: `let a = 10;
let pi = 3.14;
let name = "bolt";
let flag = true;
let empty = none;

emit(a);
emit(name);
`
    },
    {
      title: "Input & Type Conversions",
      note: "input([prompt]) waits for the user to type in the console and returns a string. Use int(s), float(s), or string(x) to convert types.",
      code: `let name = input("Enter name: ");
let age_str = input("Enter age: ");
let age = int(age_str);

emit("Hello, " + name + "!");
emit("In 5 years you will be:");
emit(age + 5);
`
    },
    {
      title: "Operators & Math",
      note: "Division / always gives a float. Use // for integer division. Power is ** and modulo is %. Word operators: and, or, not.",
      code: `emit(5 / 2);     # 2.5 (float)
emit(5 // 2);    # 2 (int)
emit(2 ** 8);    # 256
emit(10 % 3);    # 1

let x = 10;
x += 5;
emit(x);
`
    },
    {
      title: "Conditionals",
      note: "No parentheses around conditions. Braces are mandatory. Uses elif and else.",
      code: `let x = 12;

if x > 10 and x < 20 {
    emit("in range");
} elif x >= 20 {
    emit("too high");
} else {
    emit("too low");
}
`
    },
    {
      title: "Loops",
      note: "Five loop forms: while, for-in, for-range (exclusive end), repeat N, and infinite loop. Supports break and continue.",
      code: `# range loop (0 to 4)
for i in 0..5 {
    emit(i);
}

# iterate array
for x in ["a", "b", "c"] {
    emit(x);
}

# repeat N times
repeat 3 {
    emit("tick");
}

# while
let n = 0;
while n < 2 {
    emit(n);
    n += 1;
}

# infinite loop with break/continue
let count = 0;
loop {
    count += 1;
    if count == 2 {
        continue;
    }
    if count > 3 {
        break;
    }
    emit(count);
}
`
    },
    {
      title: "Arrays",
      note: "Arrays are reference types. Modifying an array modifies the original. Built-ins: len(arr), push(arr, x), pop(arr).",
      code: `let arr = [1, 2, 3];
push(arr, 4);

emit(len(arr));   # 4
arr[0] = 99;      # index assignment

let last = pop(arr);
emit(last);       # 4
emit(arr);        # [99, 2, 3]
`
    },
    {
      title: "Functions",
      note: "Defined with def. Returns are done with 'give'. Missing give returns none implicitly. Recursion works.",
      code: `def add(x, y) {
    give x + y;
}

def factorial(n) {
    if n <= 1 {
        give 1;
    }
    give n * factorial(n - 1);
}

emit(add(10, 20));
emit(factorial(5));
`
    }
  ];

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "16px 12px", color: "#cccccc" }}>
      <h1 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px", color: "#ffffff" }}>
        Bolt Language Guide
      </h1>
      <p style={{ fontSize: "13px", lineHeight: "1.6", marginBottom: "20px", color: "#999999" }}>
        I built this interpreter from scratch: defined the grammar, wrote a tokenizer/lexer, built a recursive descent parser to produce an AST, and implemented a tree-walking interpreter with lexical scoping. It combines Python&apos;s readability and dynamic typing with C++&apos;s curly braces and mandatory semicolons. Output is done via{" "}
        <code style={{ background: "#222", padding: "2px 4px", color: "#e0e0e0" }}>emit()</code> and returns use{" "}
        <code style={{ background: "#222", padding: "2px 4px", color: "#e0e0e0" }}>give</code>.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {sections.map((sec, idx) => (
          <div
            key={idx}
            style={{
              background: "#1e1e1e",
              border: "1px solid #2d2d2d",
              padding: "12px 12px"
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px"
              }}
            >
              <span style={{ fontWeight: "bold", fontSize: "13px", color: "#ffffff" }}>
                {sec.title}
              </span>
              <button
                onClick={() => onLoadSnippet(sec.code)}
                style={{
                  background: "transparent",
                  border: "1px solid #444444",
                  color: "#aaaaaa",
                  padding: "4px 10px",
                  fontSize: "11px",
                  cursor: "pointer",
                  minHeight: "28px"
                }}
              >
                load into editor
              </button>
            </div>
            <p style={{ fontSize: "12px", color: "#888888", marginBottom: "8px", lineHeight: "1.4" }}>
              {sec.note}
            </p>
            <pre
              style={{
                background: "#141414",
                padding: "8px 10px",
                border: "1px solid #252525",
                fontSize: "12px",
                color: "#d4d4d4",
                overflowX: "auto",
                fontFamily: "Consolas, 'Courier New', monospace"
              }}
            >
              <code>{sec.code}</code>
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};
