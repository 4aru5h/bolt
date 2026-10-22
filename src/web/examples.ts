export interface Example {
  id: string;
  name: string;
  description: string;
  code: string;
}

export const EXAMPLES: Example[] = [
  {
    id: "calculator",
    name: "1. Calculator",
    description: "Takes an operator and two numbers, computes the result.",
    code: `# Interactive Calculator in Bolt

def calculate(op, a, b) {
    if op == "+" {
        give a + b;
    } elif op == "-" {
        give a - b;
    } elif op == "*" {
        give a * b;
    } elif op == "/" {
        if b == 0 {
            emit("Error: division by zero");
            give none;
        }
        give a / b;
    } elif op == "//" {
        if b == 0 {
            emit("Error: integer division by zero");
            give none;
        }
        give a // b;
    } elif op == "%" {
        give a % b;
    } elif op == "**" {
        give a ** b;
    } else {
        emit("Error: unknown operator");
        give none;
    }
}

let op = input("Enter operator (+, -, *, /, //, %, **): ");
let a = float(input("Enter first number: "));
let b = float(input("Enter second number: "));

let result = calculate(op, a, b);
if result != none {
    emit("Result:");
    emit(result);
}
`
  },
  {
    id: "quicksort",
    name: "2. Recursive QuickSort",
    description: "Takes numbers from user input, loads them into an array, and sorts them.",
    code: `# Recursive QuickSort with User Input

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

let count = int(input("How many numbers do you want to sort? "));
let numbers = [];

for i in 0..count {
    let val = int(input("Enter number: "));
    push(numbers, val);
}

emit("Original array:");
emit(numbers);

let sorted = quicksort(numbers);
emit("Sorted array:");
emit(sorted);
`
  },
  {
    id: "fibonacci",
    name: "3. Fibonacci",
    description: "Prompts for N and computes the Fibonacci sequence.",
    code: `# Fibonacci with User Input

def fib(n) {
    if n <= 0 {
        give 0;
    }
    if n == 1 {
        give 1;
    }
    give fib(n - 1) + fib(n - 2);
}

let n = int(input("Enter n to calculate Fibonacci(n): "));

emit("Calculating fib(n)...");
let result = fib(n);
emit("Result:");
emit(result);
`
  },
  {
    id: "loops",
    name: "4. Loop Showcase",
    description: "Uses user input to control repeat and range loops.",
    code: `# Loop Showcase with User Input

let reps = int(input("How many times should we repeat? "));
repeat reps {
    emit("Loop iteration");
}

let limit = int(input("Enter range upper bound (0..N): "));
emit("Printing exclusive range 0..N:");
for i in 0..limit {
    emit(i);
}

# Infinite loop controlled by user input
loop {
    let cmd = input("Type 'stop' to break the loop, or press Enter to continue: ");
    if cmd == "stop" {
        emit("Exiting loop.");
        break;
    }
    emit("Loop continuing...");
}
`
  },
  {
    id: "arrays",
    name: "5. Array Operations",
    description: "Builds an array from user inputs and demonstrates push, pop, and index updates.",
    code: `# Array Operations with User Input

let list = [];
let count = int(input("How many items to push into the array? "));

for i in 0..count {
    let item = input("Enter item: ");
    push(list, item);
}

emit("Current array:");
emit(list);

if len(list) > 0 {
    let new_val = input("Enter new value for index 0: ");
    list[0] = new_val;
    emit("After index assignment list[0] = new_val:");
    emit(list);

    emit("Popping last element:");
    let removed = pop(list);
    emit("Popped item:");
    emit(removed);
    emit("Remaining array:");
    emit(list);
}
`
  }
];
