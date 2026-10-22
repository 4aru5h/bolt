# Bolt Programming Language & Web Playground

Bolt is a toy programming language built from scratch in TypeScript, featuring an interactive web-based playground with a Monaco code editor, Web Worker sandboxing, and live terminal output.

It blends Python's readability and dynamic typing with C++'s curly braces and mandatory semicolons.

---

## Architecture Pipeline

```text
Source Code
    │
    ▼
[Lexer / Tokenizer]       (Character scanning, line/column tracking, escape sequences)
    │
    ▼
[Recursive Descent Parser] (Precedence climbing for binary expressions, AST generation)
    │
    ▼
[Abstract Syntax Tree]    (Typed AST nodes with line/column positions)
    │
    ▼
[Tree-Walking Interpreter](Lexical environment chains, dynamic values, async input, step/recursion limits)
    │
    ▼
[Web Worker & Playground] (Thread-isolated execution in browser with Run/Stop and terminal output)
```

---

## Language Syntax & Features

### 1. Variables & Types
Dynamic typing with `int`, `float`, `string`, `bool`, `array`, and `none`. Every statement ends with a semicolon:
```bolt
let x = 10;
let pi = 3.14;
let message = "hello";
let flag = true;
let empty = none;
```

### 2. Operators & Arithmetic
- `/` is true float division (`5 / 2 -> 2.5`).
- `//` is integer floor division (`5 // 2 -> 2`).
- `**` is power (`2 ** 8 -> 256`), `%` is modulo.
- Word operators: `and`, `or`, `not`.
- Compound assignments: `+=`, `-=`, `*=`, `/=`.

### 3. Interactive Input & Conversions
```bolt
let name = input("Enter your name: ");
let age = int(input("Enter your age: "));

emit("Hello " + name);
emit("Next year you will be:");
emit(age + 1);
```

### 4. Conditionals
No parentheses around conditions. Braces are mandatory:
```bolt
if score >= 90 {
    emit("A");
} elif score >= 80 {
    emit("B");
} else {
    emit("F");
}
```

### 5. Loops
Supports all five loop constructs with `break` and `continue`:
```bolt
# Exclusive range 0..5 (0, 1, 2, 3, 4)
for i in 0..5 {
    emit(i);
}

# Iterate array
for item in ["a", "b", "c"] {
    emit(item);
}

# Repeat N times
repeat 3 {
    emit("tick");
}

# While loop
let n = 0;
while n < 3 {
    emit(n);
    n += 1;
}

# Loop with break and continue
let count = 0;
loop {
    count += 1;
    if count == 2 {
        continue;
    }
    if count > 4 {
        break;
    }
    emit(count);
}
```

### 6. Functions & `give`
Declared with `def`. Returns are done using the `give` keyword:
```bolt
def add(a, b) {
    give a + b;
}

def factorial(n) {
    if n <= 1 {
        give 1;
    }
    give n * factorial(n - 1);
}

emit(add(5, 7));
emit(factorial(5));
```

### 7. Arrays & Built-ins
Arrays have reference semantics. Built-in functions include:
- `len(arr)`: array or string length
- `push(arr, x)`: appends item
- `pop(arr)`: removes and returns last item
- `emit(x)`: prints to terminal output
- `input([prompt])`: reads line from user
- `int(x)`, `float(x)`, `string(x)`: type conversions

---

## Local Development & Testing

### 1. Install dependencies
```bash
npm install
```

### 2. Run the test suite
Runs all 33 unit and integration tests across Lexer, Parser, and Interpreter:
```bash
npm test
```

### 3. Start the local playground
```bash
npm run dev
```
Open the localhost URL displayed in the terminal to test your code.

### 4. Build for production
```bash
npm run build
```
Generates a static web bundle in `dist/`.

---

## Deploying to GitHub Pages

This repo includes a preconfigured GitHub Actions workflow in `.github/workflows/deploy.yml`.

### Instructions:
1. Create a new repository on GitHub.
2. In your local folder, link your repository and push to `main`:
   ```bash
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git branch -M main
   git push -u origin main
   ```
3. In GitHub, go to your repo **Settings -> Pages**.
4. Under **Build and deployment -> Source**, select **GitHub Actions**.
5. Your playground will automatically build, test, and deploy to:
   `https://<your-username>.github.io/<repo-name>/`
