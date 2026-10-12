'use strict';
// Compiled with the real `rustc --test`. The learner's code becomes the crate
// root and `tests` is pasted into `mod tests { use super::*; … }`. A compile
// error is shown in full — reading rustc's messages is half of learning Rust.
// Starters use todo!() so they compile but panic when called.

module.exports = {
  id: 'rust',
  name: 'Rust',
  short: 'Rs',
  blurb: 'Ownership, borrowing, enums, traits and iterators — checked by the real compiler.',
  lang: 'rust',
  runner: { kind: 'rust' },
  challenges: [
    {
      id: 'add', title: 'Functions and types', tier: 1,
      prompt: "Write `add`, taking two `i32` values and returning their sum. In Rust the last expression of a function — with **no semicolon** — is its return value.",
      starter: `fn add(a: i32, b: i32) -> i32 {\n    todo!()\n}\n`,
      solution: `fn add(a: i32, b: i32) -> i32 {\n    a + b\n}\n`,
      tests: `    #[test]
    fn adds_positive_numbers() { assert_eq!(add(2, 3), 5); }
    #[test]
    fn adds_negative_numbers() { assert_eq!(add(-4, 1), -3); }`,
      hints: ['`a + b` on the last line, without a semicolon, returns the value.', 'Adding a semicolon turns it into a statement, and the function would return `()` instead — a type error.'],
    },
    {
      id: 'greet', title: 'String and &str', tier: 1,
      prompt: "Rust has two string types: `&str` is a borrowed view of text, `String` is an owned, growable buffer. Write `greet`, taking a `&str` name and returning a new `String` reading `Hello, <name>!`.",
      starter: `fn greet(name: &str) -> String {\n    todo!()\n}\n`,
      solution: `fn greet(name: &str) -> String {\n    format!("Hello, {}!", name)\n}\n`,
      tests: `    #[test]
    fn greets_by_name() { assert_eq!(greet("Ada"), "Hello, Ada!"); }
    #[test]
    fn works_with_an_owned_string_too() { let owned = String::from("Linus"); assert_eq!(greet(&owned), "Hello, Linus!"); }`,
      hints: ['`format!("Hello, {}!", name)` works like `println!` but returns a `String`.', 'Taking `&str` lets callers pass either a literal or `&some_string`.'],
    },
    {
      id: 'fizzbuzz', title: 'if, else if, else', tier: 1,
      prompt: "Write `fizzbuzz(n: u32) -> String`: `\"FizzBuzz\"` for multiples of 15, `\"Fizz\"` for multiples of 3, `\"Buzz\"` for multiples of 5, otherwise the number as a string.",
      starter: `fn fizzbuzz(n: u32) -> String {\n    todo!()\n}\n`,
      solution: `fn fizzbuzz(n: u32) -> String {\n    if n % 15 == 0 {\n        "FizzBuzz".to_string()\n    } else if n % 3 == 0 {\n        "Fizz".to_string()\n    } else if n % 5 == 0 {\n        "Buzz".to_string()\n    } else {\n        n.to_string()\n    }\n}\n`,
      tests: `    #[test]
    fn plain_numbers() { assert_eq!(fizzbuzz(7), "7"); }
    #[test]
    fn fizz() { assert_eq!(fizzbuzz(9), "Fizz"); }
    #[test]
    fn buzz() { assert_eq!(fizzbuzz(10), "Buzz"); }
    #[test]
    fn fizzbuzz_for_both() { assert_eq!(fizzbuzz(30), "FizzBuzz"); }`,
      hints: ['`if` is an expression: every branch must produce the same type, here `String`.', 'A literal like `"Fizz"` is a `&str`; convert with `.to_string()`.'],
    },
    {
      id: 'sum-to', title: 'Loops and mutability', tier: 1,
      prompt: "Write `sum_to(n: u64) -> u64` returning `1 + 2 + … + n`, using a `for` loop over a range. Variables are immutable unless declared with `mut`.",
      starter: `fn sum_to(n: u64) -> u64 {\n    todo!()\n}\n`,
      solution: `fn sum_to(n: u64) -> u64 {\n    let mut total = 0;\n    for i in 1..=n {\n        total += i;\n    }\n    total\n}\n`,
      tests: `    #[test]
    fn sums_to_ten() { assert_eq!(sum_to(10), 55); }
    #[test]
    fn zero_is_zero() { assert_eq!(sum_to(0), 0); }
    #[test]
    fn one_is_one() { assert_eq!(sum_to(1), 1); }`,
      hints: ['`let mut total = 0;` — without `mut`, `total += i` will not compile.', '`1..n` stops before `n`; `1..=n` includes it.'],
    },
    {
      id: 'move-bug', title: 'Fix: use after move', tier: 1,
      prompt: "**Bug hunt.** This does not compile: `error[E0382]: borrow of moved value`. `longest_len` *takes ownership* of the vector, so `describe` cannot use it afterwards. Fix it by making `longest_len` **borrow** instead. Do not clone the vector.",
      starter: `fn longest_len(words: Vec<String>) -> usize {\n    words.iter().map(|w| w.len()).max().unwrap_or(0)\n}\n\nfn describe(words: Vec<String>) -> String {\n    let longest = longest_len(words);\n    format!("{} words, longest has {} letters", words.len(), longest)\n}\n`,
      solution: `fn longest_len(words: &[String]) -> usize {\n    words.iter().map(|w| w.len()).max().unwrap_or(0)\n}\n\nfn describe(words: Vec<String>) -> String {\n    let longest = longest_len(&words);\n    format!("{} words, longest has {} letters", words.len(), longest)\n}\n`,
      tests: `    #[test]
    fn describes_the_list() {
        let words = vec!["hi".to_string(), "hello".to_string(), "hey".to_string()];
        assert_eq!(describe(words), "3 words, longest has 5 letters");
    }
    #[test]
    fn empty_list() { assert_eq!(describe(vec![]), "0 words, longest has 0 letters"); }`,
      hints: ['Passing `words` by value *moves* it: the caller no longer owns it.', 'Change the parameter to a reference — `&[String]` or `&Vec<String>` — and pass `&words`.'],
    },
    {
      id: 'double-all', title: 'Mutable borrows', tier: 1,
      prompt: "Write `double_all`, which takes a **mutable reference** to a vector of `i32` and doubles every element in place. It returns nothing.",
      starter: `fn double_all(values: &mut Vec<i32>) {\n    todo!()\n}\n`,
      solution: `fn double_all(values: &mut Vec<i32>) {\n    for v in values.iter_mut() {\n        *v *= 2;\n    }\n}\n`,
      tests: `    #[test]
    fn doubles_in_place() { let mut v = vec![1, 2, 3]; double_all(&mut v); assert_eq!(v, vec![2, 4, 6]); }
    #[test]
    fn empty_is_fine() { let mut v: Vec<i32> = vec![]; double_all(&mut v); assert!(v.is_empty()); }`,
      hints: ['`iter_mut()` yields `&mut i32` — a mutable reference to each element.', 'Write through a reference with the dereference operator: `*v *= 2`.'],
    },
    {
      id: 'first-even', title: 'Option', tier: 1,
      prompt: "Rust has no `null`. \"Maybe a value\" is `Option<T>`: either `Some(value)` or `None`. Write `first_even`, returning the first even number in a slice, or `None` if there is none.",
      starter: `fn first_even(nums: &[i32]) -> Option<i32> {\n    todo!()\n}\n`,
      solution: `fn first_even(nums: &[i32]) -> Option<i32> {\n    for &n in nums {\n        if n % 2 == 0 {\n            return Some(n);\n        }\n    }\n    None\n}\n`,
      tests: `    #[test]
    fn finds_the_first() { assert_eq!(first_even(&[1, 3, 4, 6]), Some(4)); }
    #[test]
    fn none_when_all_odd() { assert_eq!(first_even(&[1, 3, 5]), None); }
    #[test]
    fn none_when_empty() { assert_eq!(first_even(&[]), None); }
    #[test]
    fn negative_evens_count() { assert_eq!(first_even(&[-3, -2]), Some(-2)); }`,
      hints: ['Return early with `return Some(n);` and fall through to `None`.', 'Or in one line: `nums.iter().copied().find(|n| n % 2 == 0)`.'],
    },
    {
      id: 'rectangle', title: 'Structs and methods', tier: 1,
      prompt: "Define a struct `Rectangle` with `width` and `height` fields (both `u32`), and an `impl` block with:\n\n- `Rectangle::new(width, height)` — an associated function that builds one\n- `area(&self) -> u32`\n- `is_square(&self) -> bool`\n- `scale(&mut self, factor: u32)` — multiplies both sides",
      starter: `struct Rectangle {\n    // fields\n}\n\nimpl Rectangle {\n    fn new(width: u32, height: u32) -> Rectangle {\n        todo!()\n    }\n}\n`,
      solution: `struct Rectangle {\n    width: u32,\n    height: u32,\n}\n\nimpl Rectangle {\n    fn new(width: u32, height: u32) -> Rectangle {\n        Rectangle { width, height }\n    }\n\n    fn area(&self) -> u32 {\n        self.width * self.height\n    }\n\n    fn is_square(&self) -> bool {\n        self.width == self.height\n    }\n\n    fn scale(&mut self, factor: u32) {\n        self.width *= factor;\n        self.height *= factor;\n    }\n}\n`,
      tests: `    #[test]
    fn computes_area() { assert_eq!(Rectangle::new(3, 4).area(), 12); }
    #[test]
    fn detects_squares() { assert!(Rectangle::new(5, 5).is_square()); assert!(!Rectangle::new(5, 6).is_square()); }
    #[test]
    fn scales_in_place() { let mut r = Rectangle::new(2, 3); r.scale(3); assert_eq!((r.width, r.height), (6, 9)); assert_eq!(r.area(), 54); }`,
      hints: ['`&self` borrows the struct to read it; `&mut self` borrows it to change it.', 'A function in `impl` without `self` is called with `Type::name(...)`.', '`Rectangle { width, height }` is shorthand when variables match field names.'],
    },
    {
      id: 'shapes', title: 'Enums and match', tier: 2,
      prompt: "Define `enum Shape` with three variants that carry data:\n\n- `Circle(f64)` — radius\n- `Rect(f64, f64)` — width, height\n- `Triangle { base: f64, height: f64 }`\n\nWrite `area(shape: &Shape) -> f64` using `match`. Use `std::f64::consts::PI`.",
      starter: `enum Shape {\n    // variants\n}\n\nfn area(shape: &Shape) -> f64 {\n    todo!()\n}\n`,
      solution: `use std::f64::consts::PI;\n\nenum Shape {\n    Circle(f64),\n    Rect(f64, f64),\n    Triangle { base: f64, height: f64 },\n}\n\nfn area(shape: &Shape) -> f64 {\n    match shape {\n        Shape::Circle(r) => PI * r * r,\n        Shape::Rect(w, h) => w * h,\n        Shape::Triangle { base, height } => 0.5 * base * height,\n    }\n}\n`,
      tests: `    fn close(a: f64, b: f64) -> bool { (a - b).abs() < 1e-9 }
    #[test]
    fn circle() { assert!(close(area(&Shape::Circle(2.0)), std::f64::consts::PI * 4.0)); }
    #[test]
    fn rect() { assert!(close(area(&Shape::Rect(3.0, 4.0)), 12.0)); }
    #[test]
    fn triangle() { assert!(close(area(&Shape::Triangle { base: 6.0, height: 3.0 }), 9.0)); }`,
      hints: ['Each `match` arm destructures a variant: `Shape::Circle(r) => ...`.', '`match` must cover every variant — leave one out and the compiler tells you which.'],
    },
    {
      id: 'parse-sum', title: 'Result and ?', tier: 2,
      prompt: "Operations that can fail return `Result<T, E>`: `Ok(value)` or `Err(error)`. Write `parse_sum`, which parses two strings as `i32` and returns their sum — or the parse error if either is not a number. Use the `?` operator.",
      starter: `use std::num::ParseIntError;\n\nfn parse_sum(a: &str, b: &str) -> Result<i32, ParseIntError> {\n    todo!()\n}\n`,
      solution: `use std::num::ParseIntError;\n\nfn parse_sum(a: &str, b: &str) -> Result<i32, ParseIntError> {\n    let x: i32 = a.trim().parse()?;\n    let y: i32 = b.trim().parse()?;\n    Ok(x + y)\n}\n`,
      tests: `    #[test]
    fn adds_valid_numbers() { assert_eq!(parse_sum("2", "40"), Ok(42)); }
    #[test]
    fn tolerates_surrounding_spaces() { assert_eq!(parse_sum(" 7 ", "3"), Ok(10)); }
    #[test]
    fn first_argument_bad() { assert!(parse_sum("two", "40").is_err()); }
    #[test]
    fn second_argument_bad() { assert!(parse_sum("2", "").is_err()); }`,
      hints: ['`"42".parse::<i32>()` returns a `Result`.', '`?` after a `Result` unwraps an `Ok`, or returns the `Err` from the whole function immediately.', 'The final success value needs wrapping: `Ok(x + y)`.'],
    },
    {
      id: 'custom-error', title: 'Your own error type', tier: 2,
      prompt: "Define `enum MathError` with the variants `DivideByZero` and `NegativeRoot`, deriving `Debug` and `PartialEq`.\n\nThen write:\n\n- `divide(a: f64, b: f64) -> Result<f64, MathError>`\n- `sqrt(x: f64) -> Result<f64, MathError>`\n- `root_of_ratio(a: f64, b: f64) -> Result<f64, MathError>` — the square root of `a / b`, propagating either error with `?`",
      starter: `// enum MathError { ... }\n\nfn divide(a: f64, b: f64) -> Result<f64, MathError> {\n    todo!()\n}\n\nfn sqrt(x: f64) -> Result<f64, MathError> {\n    todo!()\n}\n\nfn root_of_ratio(a: f64, b: f64) -> Result<f64, MathError> {\n    todo!()\n}\n`,
      solution: `#[derive(Debug, PartialEq)]\nenum MathError {\n    DivideByZero,\n    NegativeRoot,\n}\n\nfn divide(a: f64, b: f64) -> Result<f64, MathError> {\n    if b == 0.0 {\n        Err(MathError::DivideByZero)\n    } else {\n        Ok(a / b)\n    }\n}\n\nfn sqrt(x: f64) -> Result<f64, MathError> {\n    if x < 0.0 {\n        Err(MathError::NegativeRoot)\n    } else {\n        Ok(x.sqrt())\n    }\n}\n\nfn root_of_ratio(a: f64, b: f64) -> Result<f64, MathError> {\n    let ratio = divide(a, b)?;\n    sqrt(ratio)\n}\n`,
      tests: `    #[test]
    fn divides() { assert_eq!(divide(9.0, 3.0), Ok(3.0)); }
    #[test]
    fn divide_by_zero() { assert_eq!(divide(1.0, 0.0), Err(MathError::DivideByZero)); }
    #[test]
    fn negative_root() { assert_eq!(sqrt(-4.0), Err(MathError::NegativeRoot)); }
    #[test]
    fn happy_path() { assert_eq!(root_of_ratio(18.0, 2.0), Ok(3.0)); }
    #[test]
    fn propagates_the_first_error() { assert_eq!(root_of_ratio(1.0, 0.0), Err(MathError::DivideByZero)); }
    #[test]
    fn propagates_the_second_error() { assert_eq!(root_of_ratio(-8.0, 2.0), Err(MathError::NegativeRoot)); }`,
      hints: ['`#[derive(Debug, PartialEq)]` above the enum lets tests print and compare it.', 'An enum with no data per variant is the simplest error type.', 'Because both helpers share the error type, `?` chains them with no conversion.'],
    },
    {
      id: 'iterators', title: 'Iterator chains', tier: 2,
      prompt: "Write `sum_of_odd_squares`, which takes a slice of `i32` and returns the sum of the squares of the **odd** numbers. Solve it with an iterator chain — `filter`, `map`, `sum` — and no explicit loop.",
      starter: `fn sum_of_odd_squares(nums: &[i32]) -> i32 {\n    todo!()\n}\n`,
      solution: `fn sum_of_odd_squares(nums: &[i32]) -> i32 {\n    nums.iter().filter(|n| *n % 2 != 0).map(|n| n * n).sum()\n}\n`,
      tests: `    #[test]
    fn mixed_numbers() { assert_eq!(sum_of_odd_squares(&[1, 2, 3, 4, 5]), 35); }
    #[test]
    fn negatives_are_odd_too() { assert_eq!(sum_of_odd_squares(&[-3, 2]), 9); }
    #[test]
    fn empty_slice() { assert_eq!(sum_of_odd_squares(&[]), 0); }`,
      hints: ['`nums.iter()` yields `&i32`. Inside `filter` the closure gets a reference to *that* — hence `**n` or `*n % 2`.', 'Test oddness with `!= 0`, not `== 1`: in Rust `-3 % 2` is `-1`.', 'Iterators are lazy; `sum()` is what drives the chain.'],
    },
    {
      id: 'unique-sorted', title: 'Vectors', tier: 2,
      prompt: "Write `unique_sorted`, which takes ownership of a `Vec<i32>` and returns it sorted ascending with duplicates removed.",
      starter: `fn unique_sorted(values: Vec<i32>) -> Vec<i32> {\n    todo!()\n}\n`,
      solution: `fn unique_sorted(mut values: Vec<i32>) -> Vec<i32> {\n    values.sort();\n    values.dedup();\n    values\n}\n`,
      tests: `    #[test]
    fn sorts_and_removes_duplicates() { assert_eq!(unique_sorted(vec![3, 1, 2, 3, 1]), vec![1, 2, 3]); }
    #[test]
    fn already_unique() { assert_eq!(unique_sorted(vec![5, -1]), vec![-1, 5]); }
    #[test]
    fn empty() { assert_eq!(unique_sorted(vec![]), Vec::<i32>::new()); }`,
      hints: ['You own the vector, so you may change it: mark the parameter `mut values`.', '`dedup()` only removes *adjacent* duplicates — sort first.'],
    },
    {
      id: 'word-count', title: 'HashMap', tier: 2,
      prompt: "Write `word_count`, returning a `HashMap<String, usize>` of how many times each word appears in the text. Words are separated by whitespace and compared case-insensitively (store them lower-cased).",
      starter: `use std::collections::HashMap;\n\nfn word_count(text: &str) -> HashMap<String, usize> {\n    todo!()\n}\n`,
      solution: `use std::collections::HashMap;\n\nfn word_count(text: &str) -> HashMap<String, usize> {\n    let mut counts = HashMap::new();\n    for word in text.split_whitespace() {\n        *counts.entry(word.to_lowercase()).or_insert(0) += 1;\n    }\n    counts\n}\n`,
      tests: `    #[test]
    fn counts_words() {
        let c = word_count("the cat The dog  the end");
        assert_eq!(c.get("the"), Some(&3));
        assert_eq!(c.get("dog"), Some(&1));
        assert_eq!(c.len(), 4);
    }
    #[test]
    fn empty_text() { assert!(word_count("   ").is_empty()); }`,
      hints: ['`text.split_whitespace()` iterates over the words.', '`map.entry(key).or_insert(0)` returns a mutable reference to the value, inserting 0 first if the key is new.', 'Add to it through the reference: `*entry += 1`.'],
    },
    {
      id: 'palindrome', title: 'Working with chars', tier: 2,
      prompt: "Write `is_palindrome`, true when the text reads the same forwards and backwards, **ignoring case and anything that is not a letter or digit**. `\"A man, a plan, a canal: Panama\"` is a palindrome.",
      starter: `fn is_palindrome(text: &str) -> bool {\n    todo!()\n}\n`,
      solution: `fn is_palindrome(text: &str) -> bool {\n    let cleaned: Vec<char> = text\n        .chars()\n        .filter(|c| c.is_alphanumeric())\n        .map(|c| c.to_ascii_lowercase())\n        .collect();\n    cleaned.iter().eq(cleaned.iter().rev())\n}\n`,
      tests: `    #[test]
    fn simple_word() { assert!(is_palindrome("level")); }
    #[test]
    fn ignores_case_and_punctuation() { assert!(is_palindrome("A man, a plan, a canal: Panama")); }
    #[test]
    fn rejects_non_palindromes() { assert!(!is_palindrome("rust")); }
    #[test]
    fn empty_counts() { assert!(is_palindrome("")); }
    #[test]
    fn digits_matter() { assert!(is_palindrome("12 21")); assert!(!is_palindrome("12 31")); }`,
      hints: ['You cannot index a `String` by position — it is UTF-8. Use `.chars()`.', '`.collect()` gathers an iterator into a collection; the type annotation picks which.', 'Compare an iterator with its reverse: `v.iter().eq(v.iter().rev())`.'],
    },
    {
      id: 'port', title: 'Option combinators', tier: 2,
      prompt: "Write `port_from`, which takes an optional string setting and returns the port to use:\n\n- `None` → `8080`\n- a string that parses as a `u16` → that number\n- anything else → `8080`\n\nDo it without `match` or `if`, by chaining `Option` methods.",
      starter: `fn port_from(setting: Option<&str>) -> u16 {\n    todo!()\n}\n`,
      solution: `fn port_from(setting: Option<&str>) -> u16 {\n    setting.and_then(|s| s.trim().parse().ok()).unwrap_or(8080)\n}\n`,
      tests: `    #[test]
    fn missing_setting() { assert_eq!(port_from(None), 8080); }
    #[test]
    fn valid_setting() { assert_eq!(port_from(Some("3000")), 3000); }
    #[test]
    fn garbage_setting() { assert_eq!(port_from(Some("http")), 8080); }
    #[test]
    fn out_of_range_setting() { assert_eq!(port_from(Some("70000")), 8080); }
    #[test]
    fn padded_setting() { assert_eq!(port_from(Some(" 22 ")), 22); }`,
      hints: ['`.ok()` turns a `Result` into an `Option`, discarding the error.', '`.and_then(f)` runs `f` only on `Some`, where `f` itself returns an `Option`.', '`.unwrap_or(default)` supplies the fallback.'],
    },
    {
      id: 'traits', title: 'Traits', tier: 2,
      prompt: "A trait is shared behaviour. Define `trait Speak` with one method, `fn speak(&self) -> String`.\n\nDefine structs `Dog` and `Cat`, each with a `name: String` field. A dog says `<name> says woof`; a cat says `<name> says meow`.\n\nThen write `chorus(animals: &[Box<dyn Speak>]) -> Vec<String>` returning what each one says, in order.",
      starter: `// trait Speak { ... }\n\nstruct Dog {\n    name: String,\n}\n\nstruct Cat {\n    name: String,\n}\n\nfn chorus(animals: &[Box<dyn Speak>]) -> Vec<String> {\n    todo!()\n}\n`,
      solution: `trait Speak {\n    fn speak(&self) -> String;\n}\n\nstruct Dog {\n    name: String,\n}\n\nstruct Cat {\n    name: String,\n}\n\nimpl Speak for Dog {\n    fn speak(&self) -> String {\n        format!("{} says woof", self.name)\n    }\n}\n\nimpl Speak for Cat {\n    fn speak(&self) -> String {\n        format!("{} says meow", self.name)\n    }\n}\n\nfn chorus(animals: &[Box<dyn Speak>]) -> Vec<String> {\n    animals.iter().map(|a| a.speak()).collect()\n}\n`,
      tests: `    #[test]
    fn each_speaks() {
        assert_eq!(Dog { name: "Rex".to_string() }.speak(), "Rex says woof");
        assert_eq!(Cat { name: "Tom".to_string() }.speak(), "Tom says meow");
    }
    #[test]
    fn mixed_chorus() {
        let zoo: Vec<Box<dyn Speak>> = vec![Box::new(Cat { name: "Tom".to_string() }), Box::new(Dog { name: "Rex".to_string() })];
        assert_eq!(chorus(&zoo), vec!["Tom says meow", "Rex says woof"]);
    }`,
      hints: ['`trait Name { fn method(&self) -> Type; }` declares; `impl Name for Struct { ... }` implements.', '`Box<dyn Speak>` means "some type that implements Speak, behind a pointer" — which is how one vector can hold both dogs and cats.'],
    },
    {
      id: 'largest', title: 'Generics with trait bounds', tier: 2,
      prompt: "Write a generic `largest` that returns the largest item in a slice, or `None` if the slice is empty. It must work for any type that can be compared and copied — `i32`, `f64`, `char`…",
      starter: `fn largest(items: &[i32]) -> Option<i32> {\n    todo!()\n}\n`,
      solution: `fn largest<T: PartialOrd + Copy>(items: &[T]) -> Option<T> {\n    let mut best = *items.first()?;\n    for &item in items {\n        if item > best {\n            best = item;\n        }\n    }\n    Some(best)\n}\n`,
      tests: `    #[test]
    fn integers() { assert_eq!(largest(&[3, 9, 2]), Some(9)); }
    #[test]
    fn floats() { assert_eq!(largest(&[1.5, -2.0, 0.25]), Some(1.5)); }
    #[test]
    fn chars() { assert_eq!(largest(&['a', 'z', 'm']), Some('z')); }
    #[test]
    fn empty() { assert_eq!(largest::<i32>(&[]), None); }`,
      hints: ['`fn largest<T>(items: &[T])` makes it generic — but then `>` will not compile, because not every `T` can be compared.', 'A trait bound says what `T` must support: `T: PartialOrd + Copy`.', '`?` works on `Option` too: `items.first()?` returns `None` early when the slice is empty.'],
    },
    {
      id: 'display', title: 'Implement Display', tier: 2,
      prompt: "Given `struct Money { cents: i64 }`, implement `std::fmt::Display` so it prints as dollars with two decimals: `Money { cents: 1250 }` → `$12.50`, and negative amounts as `-$0.05`.\n\nImplementing `Display` gives you `.to_string()` and `{}` formatting for free.",
      starter: `use std::fmt;\n\nstruct Money {\n    cents: i64,\n}\n\n// impl fmt::Display for Money { ... }\n`,
      solution: `use std::fmt;\n\nstruct Money {\n    cents: i64,\n}\n\nimpl fmt::Display for Money {\n    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {\n        let sign = if self.cents < 0 { "-" } else { "" };\n        let abs = self.cents.abs();\n        write!(f, "{}\${}.{:02}", sign, abs / 100, abs % 100)\n    }\n}\n`,
      tests: `    #[test]
    fn whole_and_cents() { assert_eq!(Money { cents: 1250 }.to_string(), "$12.50"); }
    #[test]
    fn pads_single_digit_cents() { assert_eq!(format!("{}", Money { cents: 305 }), "$3.05"); }
    #[test]
    fn zero() { assert_eq!(Money { cents: 0 }.to_string(), "$0.00"); }
    #[test]
    fn negative() { assert_eq!(Money { cents: -5 }.to_string(), "-$0.05"); }`,
      hints: ['`impl fmt::Display for Money { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { write!(f, "...", ...) } }`.', '`{:02}` pads a number to two digits with a leading zero.', 'Keep money in integer cents; floats cannot represent 0.10 exactly.'],
    },
    {
      id: 'closures', title: 'Closures', tier: 2,
      prompt: "Write two functions:\n\n- `make_adder(n: i32)` returns a closure that adds `n` to its argument\n- `apply_twice(f, x)` takes any function or closure from `i32` to `i32` and applies it to `x` two times",
      starter: `fn make_adder(n: i32) -> impl Fn(i32) -> i32 {\n    todo!();\n    |x| x\n}\n\nfn apply_twice<F: Fn(i32) -> i32>(f: F, x: i32) -> i32 {\n    todo!()\n}\n`,
      solution: `fn make_adder(n: i32) -> impl Fn(i32) -> i32 {\n    move |x| x + n\n}\n\nfn apply_twice<F: Fn(i32) -> i32>(f: F, x: i32) -> i32 {\n    f(f(x))\n}\n`,
      tests: `    #[test]
    fn adder_captures_its_argument() { let add5 = make_adder(5); assert_eq!(add5(1), 6); assert_eq!(add5(10), 15); }
    #[test]
    fn adders_are_independent() { let a = make_adder(1); let b = make_adder(100); assert_eq!(a(0) + b(0), 101); }
    #[test]
    fn applies_twice() { assert_eq!(apply_twice(|x| x * 3, 2), 18); }
    #[test]
    fn works_together() { assert_eq!(apply_twice(make_adder(4), 0), 8); }`,
      hints: ['A closure is written `|args| body`.', 'To return a closure that uses a local variable, add `move` so it takes ownership of what it captures: `move |x| x + n`.', '`impl Fn(i32) -> i32` means "some closure type with this signature".'],
    },
    {
      id: 'lifetimes', title: 'Lifetimes', tier: 3,
      prompt: "This does not compile: `error[E0106]: missing lifetime specifier`. The function returns a reference, and the compiler cannot tell whether it borrows from `a` or from `b`. Add a lifetime parameter saying the result lives as long as **both** inputs. The body is already correct.",
      starter: `fn longest(a: &str, b: &str) -> &str {\n    if b.len() > a.len() { b } else { a }\n}\n`,
      solution: `fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {\n    if b.len() > a.len() { b } else { a }\n}\n`,
      tests: `    #[test]
    fn picks_the_longer() { assert_eq!(longest("hi", "hello"), "hello"); }
    #[test]
    fn first_wins_a_tie() { assert_eq!(longest("ab", "cd"), "ab"); }
    #[test]
    fn works_across_scopes() {
        let outer = String::from("a long string");
        let result;
        { let inner = String::from("short"); result = longest(&outer, &inner).len(); }
        assert_eq!(result, 13);
    }`,
      hints: ["Declare a lifetime like a generic: `fn longest<'a>(...)`.", "Then tag each reference with it: `a: &'a str, b: &'a str) -> &'a str`.", 'This changes nothing at runtime; it tells the borrow checker how the references relate.'],
    },
    {
      id: 'stack', title: 'A generic struct', tier: 3,
      prompt: "Write `struct Stack<T>` backed by a `Vec<T>`, with:\n\n- `Stack::new()`\n- `push(&mut self, item: T)`\n- `pop(&mut self) -> Option<T>`\n- `peek(&self) -> Option<&T>` — look at the top without removing it\n- `len(&self) -> usize` and `is_empty(&self) -> bool`",
      starter: `struct Stack<T> {\n    items: Vec<T>,\n}\n\nimpl<T> Stack<T> {\n    fn new() -> Self {\n        todo!()\n    }\n}\n`,
      solution: `struct Stack<T> {\n    items: Vec<T>,\n}\n\nimpl<T> Stack<T> {\n    fn new() -> Self {\n        Stack { items: Vec::new() }\n    }\n\n    fn push(&mut self, item: T) {\n        self.items.push(item);\n    }\n\n    fn pop(&mut self) -> Option<T> {\n        self.items.pop()\n    }\n\n    fn peek(&self) -> Option<&T> {\n        self.items.last()\n    }\n\n    fn len(&self) -> usize {\n        self.items.len()\n    }\n\n    fn is_empty(&self) -> bool {\n        self.items.is_empty()\n    }\n}\n`,
      tests: `    #[test]
    fn last_in_first_out() { let mut s = Stack::new(); s.push(1); s.push(2); assert_eq!(s.pop(), Some(2)); assert_eq!(s.pop(), Some(1)); assert_eq!(s.pop(), None); }
    #[test]
    fn peek_does_not_remove() { let mut s = Stack::new(); s.push("a"); assert_eq!(s.peek(), Some(&"a")); assert_eq!(s.len(), 1); }
    #[test]
    fn tracks_emptiness() { let mut s: Stack<String> = Stack::new(); assert!(s.is_empty()); s.push(String::from("x")); assert!(!s.is_empty()); }
    #[test]
    fn works_with_non_copy_types() { let mut s = Stack::new(); s.push(vec![1, 2]); assert_eq!(s.pop(), Some(vec![1, 2])); }`,
      hints: ['The type parameter appears three times: `struct Stack<T>`, `impl<T> Stack<T>`.', '`peek` returns `Option<&T>` — a borrow of the top item — because moving it out would remove it. `Vec::last()` already does exactly that.'],
    },
    {
      id: 'countdown-iter', title: 'Implement Iterator', tier: 3,
      prompt: "Write `struct Countdown` holding a `u32`, and implement the `Iterator` trait for it so that `Countdown::new(3)` yields `3`, `2`, `1` and then stops. Once you implement `next`, every iterator adaptor (`map`, `filter`, `sum`, `collect`…) works on it.",
      starter: `struct Countdown {\n    remaining: u32,\n}\n\nimpl Countdown {\n    fn new(from: u32) -> Self {\n        Countdown { remaining: from }\n    }\n}\n\n// impl Iterator for Countdown { ... }\n`,
      solution: `struct Countdown {\n    remaining: u32,\n}\n\nimpl Countdown {\n    fn new(from: u32) -> Self {\n        Countdown { remaining: from }\n    }\n}\n\nimpl Iterator for Countdown {\n    type Item = u32;\n\n    fn next(&mut self) -> Option<u32> {\n        if self.remaining == 0 {\n            None\n        } else {\n            let current = self.remaining;\n            self.remaining -= 1;\n            Some(current)\n        }\n    }\n}\n`,
      tests: `    #[test]
    fn counts_down() { assert_eq!(Countdown::new(3).collect::<Vec<u32>>(), vec![3, 2, 1]); }
    #[test]
    fn zero_yields_nothing() { assert_eq!(Countdown::new(0).count(), 0); }
    #[test]
    fn adaptors_work() { assert_eq!(Countdown::new(4).filter(|n| n % 2 == 0).map(|n| n * 10).sum::<u32>(), 60); }
    #[test]
    fn stays_finished() { let mut c = Countdown::new(1); assert_eq!(c.next(), Some(1)); assert_eq!(c.next(), None); assert_eq!(c.next(), None); }`,
      hints: ['`impl Iterator for Countdown { type Item = u32; fn next(&mut self) -> Option<Self::Item> { ... } }`.', '`next` returns `Some(value)` while there is more and `None` when finished.', 'Guard against subtracting from 0 — unsigned underflow panics in debug builds.'],
    },
    {
      id: 'threads', title: 'Threads, Arc and Mutex', tier: 3,
      prompt: "Write `count_in_parallel(threads: usize, per_thread: usize) -> usize`. Spawn `threads` OS threads; each one adds 1 to a **shared** counter `per_thread` times. Wait for them all, then return the final count.\n\nSharing across threads needs `Arc` (shared ownership) around a `Mutex` (one writer at a time).",
      starter: `use std::sync::{Arc, Mutex};\nuse std::thread;\n\nfn count_in_parallel(threads: usize, per_thread: usize) -> usize {\n    todo!()\n}\n`,
      solution: `use std::sync::{Arc, Mutex};\nuse std::thread;\n\nfn count_in_parallel(threads: usize, per_thread: usize) -> usize {\n    let counter = Arc::new(Mutex::new(0usize));\n    let mut handles = Vec::new();\n    for _ in 0..threads {\n        let counter = Arc::clone(&counter);\n        handles.push(thread::spawn(move || {\n            for _ in 0..per_thread {\n                *counter.lock().unwrap() += 1;\n            }\n        }));\n    }\n    for h in handles {\n        h.join().unwrap();\n    }\n    let total = *counter.lock().unwrap();\n    total\n}\n`,
      tests: `    #[test]
    fn counts_everything() { assert_eq!(count_in_parallel(8, 1000), 8000); }
    #[test]
    fn one_thread() { assert_eq!(count_in_parallel(1, 5), 5); }
    #[test]
    fn no_threads() { assert_eq!(count_in_parallel(0, 100), 0); }`,
      hints: ['`Arc::new(Mutex::new(0))` — then give each thread its own `Arc::clone(&counter)`.', '`thread::spawn(move || { ... })` moves that clone into the thread.', '`*counter.lock().unwrap() += 1` locks, increments, and unlocks when the guard goes out of scope.', 'Keep the `JoinHandle`s and `.join()` each one, or you will read the counter before the threads finish.'],
    },
    {
      id: 'boss-inventory', title: 'Boss: parse an inventory', tier: 3,
      prompt: "Each line of the input is `name,quantity,price` — for example `widget,4,2.50`.\n\nDefine `struct Item { name: String, quantity: u32, price: f64 }` deriving `Debug` and `PartialEq`, then write:\n\n- `parse_inventory(input: &str) -> Result<Vec<Item>, String>` — blank lines are skipped and fields are trimmed. On a bad line, return `Err` with exactly one of these messages, where `N` is the 1-based line number:\n  - `line N: expected 3 fields`\n  - `line N: bad quantity`\n  - `line N: bad price`\n- `total_value(items: &[Item]) -> f64` — the sum of `quantity × price`",
      starter: `// struct Item { ... }\n\nfn parse_inventory(input: &str) -> Result<Vec<Item>, String> {\n    todo!()\n}\n\nfn total_value(items: &[Item]) -> f64 {\n    todo!()\n}\n`,
      solution: `#[derive(Debug, PartialEq)]\nstruct Item {\n    name: String,\n    quantity: u32,\n    price: f64,\n}\n\nfn parse_inventory(input: &str) -> Result<Vec<Item>, String> {\n    let mut items = Vec::new();\n    for (i, line) in input.lines().enumerate() {\n        let n = i + 1;\n        if line.trim().is_empty() {\n            continue;\n        }\n        let fields: Vec<&str> = line.split(',').map(|f| f.trim()).collect();\n        if fields.len() != 3 {\n            return Err(format!("line {}: expected 3 fields", n));\n        }\n        let quantity = fields[1].parse::<u32>().map_err(|_| format!("line {}: bad quantity", n))?;\n        let price = fields[2].parse::<f64>().map_err(|_| format!("line {}: bad price", n))?;\n        items.push(Item { name: fields[0].to_string(), quantity, price });\n    }\n    Ok(items)\n}\n\nfn total_value(items: &[Item]) -> f64 {\n    items.iter().map(|i| i.quantity as f64 * i.price).sum()\n}\n`,
      tests: `    #[test]
    fn parses_good_input() {
        let items = parse_inventory("widget,4,2.50\\n\\n gadget , 1 , 10 \\n").unwrap();
        assert_eq!(items, vec![
            Item { name: "widget".to_string(), quantity: 4, price: 2.5 },
            Item { name: "gadget".to_string(), quantity: 1, price: 10.0 },
        ]);
    }
    #[test]
    fn empty_input_is_an_empty_list() { assert_eq!(parse_inventory(""), Ok(vec![])); }
    #[test]
    fn wrong_field_count() { assert_eq!(parse_inventory("a,1,1\\nb,2"), Err("line 2: expected 3 fields".to_string())); }
    #[test]
    fn bad_quantity() { assert_eq!(parse_inventory("a,-1,1"), Err("line 1: bad quantity".to_string())); }
    #[test]
    fn bad_price() { assert_eq!(parse_inventory("a,1,1\\n\\nb,2,cheap"), Err("line 3: bad price".to_string())); }
    #[test]
    fn totals() {
        let items = parse_inventory("widget,4,2.50\\ngadget,1,10").unwrap();
        assert!((total_value(&items) - 20.0).abs() < 1e-9);
        assert_eq!(total_value(&[]), 0.0);
    }`,
      hints: ['`input.lines().enumerate()` gives `(index, line)` pairs; the index starts at 0.', '`.map_err(|_| format!(...))` swaps a library error for your own message, and `?` then returns it.', 'Count line numbers *before* skipping blanks, so the number matches what the user sees in their file.'],
    },
    {
      id: 'leap-year', title: 'Boolean logic', tier: 1,
      prompt: "Write `is_leap_year(year: u32) -> bool`. A year is a leap year if it is divisible by 4 — except century years, which must also be divisible by 400. So 2024 and 2000 are leap years; 1900 and 2023 are not.",
      starter: `fn is_leap_year(year: u32) -> bool {\n    todo!()\n}\n`,
      solution: `fn is_leap_year(year: u32) -> bool {\n    (year % 4 == 0 && year % 100 != 0) || year % 400 == 0\n}\n`,
      tests: `    #[test]
    fn ordinary_leap_year() { assert!(is_leap_year(2024)); }
    #[test]
    fn ordinary_common_year() { assert!(!is_leap_year(2023)); }
    #[test]
    fn century_is_not_leap() { assert!(!is_leap_year(1900)); }
    #[test]
    fn four_hundredth_year_is_leap() { assert!(is_leap_year(2000)); }`,
      hints: ['Combine conditions with `&&` and `||`.', 'The whole boolean expression can be the function body — no `if` needed.'],
    },
    {
      id: 'grade', title: 'match with ranges', tier: 1,
      prompt: "Write `grade(score: u8) -> char` using `match` with **range patterns**: 90–100 is `'A'`, 80–89 `'B'`, 70–79 `'C'`, 60–69 `'D'`, and anything else `'F'`.",
      starter: `fn grade(score: u8) -> char {\n    todo!()\n}\n`,
      solution: `fn grade(score: u8) -> char {\n    match score {\n        90..=100 => 'A',\n        80..=89 => 'B',\n        70..=79 => 'C',\n        60..=69 => 'D',\n        _ => 'F',\n    }\n}\n`,
      tests: `    #[test]
    fn top_marks() { assert_eq!(grade(100), 'A'); assert_eq!(grade(90), 'A'); }
    #[test]
    fn middle_bands() { assert_eq!((grade(89), grade(75), grade(60)), ('B', 'C', 'D')); }
    #[test]
    fn failing() { assert_eq!(grade(59), 'F'); assert_eq!(grade(0), 'F'); }
    #[test]
    fn out_of_range_is_f() { assert_eq!(grade(200), 'F'); }`,
      hints: ['A pattern can be an inclusive range: `90..=100 => ...`.', '`_` matches whatever is left. A `char` literal uses single quotes.'],
    },
    {
      id: 'min-max', title: 'Tuples', tier: 1,
      prompt: "Write `min_max`, taking a slice of `i32` and returning the smallest and largest values together as a tuple — or `None` for an empty slice.",
      starter: `fn min_max(nums: &[i32]) -> Option<(i32, i32)> {\n    todo!()\n}\n`,
      solution: `fn min_max(nums: &[i32]) -> Option<(i32, i32)> {\n    let first = *nums.first()?;\n    let mut lo = first;\n    let mut hi = first;\n    for &n in nums {\n        if n < lo { lo = n; }\n        if n > hi { hi = n; }\n    }\n    Some((lo, hi))\n}\n`,
      tests: `    #[test]
    fn finds_both_ends() { assert_eq!(min_max(&[3, -2, 9, 4]), Some((-2, 9))); }
    #[test]
    fn single_value() { assert_eq!(min_max(&[5]), Some((5, 5))); }
    #[test]
    fn empty_slice() { assert_eq!(min_max(&[]), None); }
    #[test]
    fn destructures() { let (lo, hi) = min_max(&[1, 2]).unwrap(); assert_eq!(hi - lo, 1); }`,
      hints: ['A tuple groups values: `(lo, hi)`. Return it inside `Some(...)` — note the double parentheses.', '`nums.first()?` returns `None` from the function when the slice is empty.'],
    },
    {
      id: 'reverse-words', title: 'Split and join', tier: 1,
      prompt: "Write `reverse_words(text: &str) -> String` returning the words in reverse order, separated by single spaces. Extra whitespace in the input is dropped.",
      starter: `fn reverse_words(text: &str) -> String {\n    todo!()\n}\n`,
      solution: `fn reverse_words(text: &str) -> String {\n    text.split_whitespace().rev().collect::<Vec<&str>>().join(" ")\n}\n`,
      tests: `    #[test]
    fn reverses_order() { assert_eq!(reverse_words("the quick fox"), "fox quick the"); }
    #[test]
    fn collapses_whitespace() { assert_eq!(reverse_words("  hello   world "), "world hello"); }
    #[test]
    fn single_word() { assert_eq!(reverse_words("rust"), "rust"); }
    #[test]
    fn empty() { assert_eq!(reverse_words(""), ""); }`,
      hints: ['`split_whitespace()` gives an iterator of words; `.rev()` reverses it.', 'Collect into a `Vec<&str>`, then `.join(" ")` makes the `String`.'],
    },
    {
      id: 'config-default', title: 'Default and builders', tier: 2,
      prompt: "Define `struct Config { host: String, port: u16, debug: bool }` deriving `Debug` and `PartialEq`.\n\n- implement the `Default` trait: host `\"localhost\"`, port `8080`, debug `false`\n- add two builder methods that take `self` **by value** and return the changed config: `with_port(self, port: u16) -> Self` and `with_debug(self, debug: bool) -> Self`\n\nso that `Config::default().with_port(3000).with_debug(true)` works.",
      starter: `// struct Config { ... }\n\n// impl Default for Config { ... }\n`,
      solution: `#[derive(Debug, PartialEq)]\nstruct Config {\n    host: String,\n    port: u16,\n    debug: bool,\n}\n\nimpl Default for Config {\n    fn default() -> Self {\n        Config { host: "localhost".to_string(), port: 8080, debug: false }\n    }\n}\n\nimpl Config {\n    fn with_port(mut self, port: u16) -> Self {\n        self.port = port;\n        self\n    }\n\n    fn with_debug(mut self, debug: bool) -> Self {\n        self.debug = debug;\n        self\n    }\n}\n`,
      tests: `    #[test]
    fn defaults() { assert_eq!(Config::default(), Config { host: "localhost".to_string(), port: 8080, debug: false }); }
    #[test]
    fn builders_chain() { let c = Config::default().with_port(3000).with_debug(true); assert_eq!((c.port, c.debug), (3000, true)); assert_eq!(c.host, "localhost"); }
    #[test]
    fn struct_update_syntax() { let c = Config { port: 22, ..Default::default() }; assert_eq!(c.port, 22); assert!(!c.debug); }`,
      hints: ['`impl Default for Config { fn default() -> Self { ... } }`.', 'A builder method takes `mut self`, changes a field, and returns `self` — ownership passes straight through the chain.', 'Once `Default` exists, `Config { port: 22, ..Default::default() }` fills in the rest.'],
    },
    {
      id: 'point-ops', title: 'From and operator traits', tier: 2,
      prompt: "Given `struct Point { x: i32, y: i32 }` (derive `Debug`, `PartialEq`, `Clone`, `Copy`):\n\n- implement `From<(i32, i32)>` so a tuple converts with `.into()` or `Point::from`\n- implement `std::ops::Add` so two points can be added with `+`",
      starter: `// #[derive(...)]\nstruct Point {\n    x: i32,\n    y: i32,\n}\n`,
      solution: `use std::ops::Add;\n\n#[derive(Debug, PartialEq, Clone, Copy)]\nstruct Point {\n    x: i32,\n    y: i32,\n}\n\nimpl From<(i32, i32)> for Point {\n    fn from(pair: (i32, i32)) -> Self {\n        Point { x: pair.0, y: pair.1 }\n    }\n}\n\nimpl Add for Point {\n    type Output = Point;\n\n    fn add(self, other: Point) -> Point {\n        Point { x: self.x + other.x, y: self.y + other.y }\n    }\n}\n`,
      tests: `    #[test]
    fn converts_from_a_tuple() { assert_eq!(Point::from((3, 4)), Point { x: 3, y: 4 }); }
    #[test]
    fn into_works_too() { let p: Point = (1, -1).into(); assert_eq!(p, Point { x: 1, y: -1 }); }
    #[test]
    fn adds() { assert_eq!(Point { x: 1, y: 2 } + Point { x: 10, y: 20 }, Point { x: 11, y: 22 }); }
    #[test]
    fn is_copy() { let a = Point { x: 1, y: 1 }; let b = a + a; assert_eq!(b, Point { x: 2, y: 2 }); assert_eq!(a.x, 1); }`,
      hints: ['`impl From<(i32, i32)> for Point { fn from(pair: (i32, i32)) -> Self { ... } }` — implementing `From` gives you `.into()` for free.', '`impl Add for Point { type Output = Point; fn add(self, other: Point) -> Point { ... } }` is what `+` calls.', 'Tuple fields are read with `.0` and `.1`.'],
    },
    {
      id: 'collect-results', title: 'Collecting Options and Results', tier: 2,
      prompt: "Write two functions:\n\n- `sum_present(items: &[Option<i32>]) -> i32` — add up the `Some` values, ignoring every `None`\n- `parse_all(items: &[&str]) -> Result<Vec<i32>, std::num::ParseIntError>` — parse every string; if **any** fails, return that error, otherwise the full vector\n\nBoth are one iterator chain.",
      starter: `use std::num::ParseIntError;\n\nfn sum_present(items: &[Option<i32>]) -> i32 {\n    todo!()\n}\n\nfn parse_all(items: &[&str]) -> Result<Vec<i32>, ParseIntError> {\n    todo!()\n}\n`,
      solution: `use std::num::ParseIntError;\n\nfn sum_present(items: &[Option<i32>]) -> i32 {\n    items.iter().flatten().sum()\n}\n\nfn parse_all(items: &[&str]) -> Result<Vec<i32>, ParseIntError> {\n    items.iter().map(|s| s.trim().parse::<i32>()).collect()\n}\n`,
      tests: `    #[test]
    fn sums_only_some() { assert_eq!(sum_present(&[Some(2), None, Some(5), None]), 7); }
    #[test]
    fn all_none_is_zero() { assert_eq!(sum_present(&[None, None]), 0); }
    #[test]
    fn parses_everything() { assert_eq!(parse_all(&["1", " 2 ", "-3"]), Ok(vec![1, 2, -3])); }
    #[test]
    fn one_bad_item_fails_the_lot() { assert!(parse_all(&["1", "two", "3"]).is_err()); }
    #[test]
    fn empty_is_ok() { assert_eq!(parse_all(&[]), Ok(vec![])); }`,
      hints: ['An `Option` is itself iterable (zero or one item), so `.flatten()` on an iterator of options drops the `None`s.', '`collect()` can build a `Result<Vec<T>, E>` from an iterator of `Result<T, E>`: it stops at the first `Err`.'],
    },
    {
      id: 'chunk-sums', title: 'Slices in pieces', tier: 2,
      prompt: "Write `chunk_sums(nums: &[i32], size: usize) -> Vec<i32>` that splits the slice into consecutive groups of `size` and returns the sum of each group. The final group may be shorter. `chunk_sums(&[1,2,3,4,5], 2)` → `[3, 7, 5]`.",
      starter: `fn chunk_sums(nums: &[i32], size: usize) -> Vec<i32> {\n    todo!()\n}\n`,
      solution: `fn chunk_sums(nums: &[i32], size: usize) -> Vec<i32> {\n    nums.chunks(size).map(|chunk| chunk.iter().sum()).collect()\n}\n`,
      tests: `    #[test]
    fn uneven_groups() { assert_eq!(chunk_sums(&[1, 2, 3, 4, 5], 2), vec![3, 7, 5]); }
    #[test]
    fn exact_groups() { assert_eq!(chunk_sums(&[1, 1, 1, 1], 2), vec![2, 2]); }
    #[test]
    fn group_bigger_than_slice() { assert_eq!(chunk_sums(&[4, 6], 10), vec![10]); }
    #[test]
    fn empty() { assert_eq!(chunk_sums(&[], 3), Vec::<i32>::new()); }`,
      hints: ['Slices have a `.chunks(n)` method that yields sub-slices.', 'Each chunk is a `&[i32]`: `chunk.iter().sum()`.'],
    },
    {
      id: 'top-scorers', title: 'Sorting structs', tier: 2,
      prompt: "Given `struct Player { name: String, score: u32 }`, write `top_scorers(players: Vec<Player>, n: usize) -> Vec<String>` returning the names of the `n` highest scorers, best first. Players with equal scores are ordered alphabetically by name.",
      starter: `struct Player {\n    name: String,\n    score: u32,\n}\n\nfn top_scorers(players: Vec<Player>, n: usize) -> Vec<String> {\n    todo!()\n}\n`,
      solution: `struct Player {\n    name: String,\n    score: u32,\n}\n\nfn top_scorers(mut players: Vec<Player>, n: usize) -> Vec<String> {\n    players.sort_by(|a, b| b.score.cmp(&a.score).then_with(|| a.name.cmp(&b.name)));\n    players.into_iter().take(n).map(|p| p.name).collect()\n}\n`,
      tests: `    fn p(name: &str, score: u32) -> Player { Player { name: name.to_string(), score } }
    #[test]
    fn best_first() { assert_eq!(top_scorers(vec![p("Ken", 10), p("Ada", 30), p("Linus", 20)], 2), vec!["Ada", "Linus"]); }
    #[test]
    fn ties_break_alphabetically() { assert_eq!(top_scorers(vec![p("Zed", 5), p("Amy", 5), p("Bob", 9)], 3), vec!["Bob", "Amy", "Zed"]); }
    #[test]
    fn asking_for_more_than_exist() { assert_eq!(top_scorers(vec![p("Solo", 1)], 5), vec!["Solo"]); }
    #[test]
    fn none() { assert!(top_scorers(vec![], 3).is_empty()); }`,
      hints: ['`sort_by(|a, b| ...)` takes a closure returning an `Ordering`.', 'Swap the operands for descending: `b.score.cmp(&a.score)`.', '`.then_with(|| a.name.cmp(&b.name))` adds a tie-breaker.', '`into_iter()` consumes the vector, so you can move each `name` out without cloning.'],
    },
    {
      id: 'caesar', title: 'Caesar cipher', tier: 2,
      prompt: "Write `caesar(text: &str, shift: u8) -> String` that rotates every ASCII letter forward by `shift` positions, wrapping from `z` back to `a`, and preserving case. Everything else — digits, spaces, punctuation — is left unchanged. `caesar(\"Hello, World!\", 3)` → `\"Khoor, Zruog!\"`.",
      starter: `fn caesar(text: &str, shift: u8) -> String {\n    todo!()\n}\n`,
      solution: `fn caesar(text: &str, shift: u8) -> String {\n    text.chars()\n        .map(|c| {\n            if c.is_ascii_alphabetic() {\n                let base = if c.is_ascii_uppercase() { b'A' } else { b'a' };\n                (((c as u8 - base) + shift % 26) % 26 + base) as char\n            } else {\n                c\n            }\n        })\n        .collect()\n}\n`,
      tests: `    #[test]
    fn shifts_letters() { assert_eq!(caesar("abc", 1), "bcd"); }
    #[test]
    fn wraps_around() { assert_eq!(caesar("xyz", 3), "abc"); }
    #[test]
    fn keeps_case_and_punctuation() { assert_eq!(caesar("Hello, World!", 3), "Khoor, Zruog!"); }
    #[test]
    fn thirteen_twice_is_identity() { assert_eq!(caesar(&caesar("Rust 2024", 13), 13), "Rust 2024"); }
    #[test]
    fn large_shifts_wrap() { assert_eq!(caesar("a", 27), "b"); assert_eq!(caesar("z", 255), "u"); }`,
      hints: ['Work in bytes: `c as u8 - b\'a\'` is the letter\'s position 0–25.', 'Add the shift, take `% 26` to wrap, add the base back, and cast `as char`.', 'Reduce the shift with `% 26` *before* adding, or a shift of 255 overflows a `u8`.'],
    },
    {
      id: 'traffic-light', title: 'A state machine', tier: 2,
      prompt: "Define `enum Light { Red, Green, Yellow }` deriving `Debug`, `PartialEq`, `Clone` and `Copy`, with two methods:\n\n- `next(self) -> Light` — Red → Green → Yellow → Red\n- `seconds(self) -> u32` — Red lasts 30, Green 25, Yellow 5\n\nThen write `cycle_time(start: Light, steps: usize) -> u32`: the total seconds spent in `steps` consecutive lights beginning with `start`.",
      starter: `// enum Light { ... }\n\nfn cycle_time(start: Light, steps: usize) -> u32 {\n    todo!()\n}\n`,
      solution: `#[derive(Debug, PartialEq, Clone, Copy)]\nenum Light {\n    Red,\n    Green,\n    Yellow,\n}\n\nimpl Light {\n    fn next(self) -> Light {\n        match self {\n            Light::Red => Light::Green,\n            Light::Green => Light::Yellow,\n            Light::Yellow => Light::Red,\n        }\n    }\n\n    fn seconds(self) -> u32 {\n        match self {\n            Light::Red => 30,\n            Light::Green => 25,\n            Light::Yellow => 5,\n        }\n    }\n}\n\nfn cycle_time(start: Light, steps: usize) -> u32 {\n    let mut light = start;\n    let mut total = 0;\n    for _ in 0..steps {\n        total += light.seconds();\n        light = light.next();\n    }\n    total\n}\n`,
      tests: `    #[test]
    fn transitions() { assert_eq!(Light::Red.next(), Light::Green); assert_eq!(Light::Green.next(), Light::Yellow); assert_eq!(Light::Yellow.next(), Light::Red); }
    #[test]
    fn durations() { assert_eq!((Light::Red.seconds(), Light::Green.seconds(), Light::Yellow.seconds()), (30, 25, 5)); }
    #[test]
    fn full_cycle() { assert_eq!(cycle_time(Light::Red, 3), 60); }
    #[test]
    fn partial_cycle_from_green() { assert_eq!(cycle_time(Light::Green, 2), 30); }
    #[test]
    fn wraps_past_one_cycle() { assert_eq!(cycle_time(Light::Yellow, 4), 65); }
    #[test]
    fn zero_steps() { assert_eq!(cycle_time(Light::Red, 0), 0); }`,
      hints: ['Enums can have methods, in an `impl` block just like structs.', 'Deriving `Copy` lets methods take `self` by value without using the light up.', 'A `match` over the variants is the whole transition table — and the compiler checks you covered them all.'],
    },
    {
      id: 'transpose', title: 'Boss: transpose a matrix', tier: 3,
      prompt: "Write `transpose(matrix: &[Vec<i32>]) -> Result<Vec<Vec<i32>>, String>`, flipping rows and columns: a 2×3 matrix becomes 3×2.\n\n- an empty matrix transposes to an empty matrix\n- if the rows are not all the same length, return `Err(\"ragged matrix\".to_string())`",
      starter: `fn transpose(matrix: &[Vec<i32>]) -> Result<Vec<Vec<i32>>, String> {\n    todo!()\n}\n`,
      solution: `fn transpose(matrix: &[Vec<i32>]) -> Result<Vec<Vec<i32>>, String> {\n    let width = match matrix.first() {\n        Some(row) => row.len(),\n        None => return Ok(Vec::new()),\n    };\n    if matrix.iter().any(|row| row.len() != width) {\n        return Err("ragged matrix".to_string());\n    }\n    Ok((0..width).map(|col| matrix.iter().map(|row| row[col]).collect()).collect())\n}\n`,
      tests: `    #[test]
    fn two_by_three() { assert_eq!(transpose(&[vec![1, 2, 3], vec![4, 5, 6]]), Ok(vec![vec![1, 4], vec![2, 5], vec![3, 6]])); }
    #[test]
    fn square() { assert_eq!(transpose(&[vec![1, 2], vec![3, 4]]), Ok(vec![vec![1, 3], vec![2, 4]])); }
    #[test]
    fn single_row_becomes_a_column() { assert_eq!(transpose(&[vec![7, 8, 9]]), Ok(vec![vec![7], vec![8], vec![9]])); }
    #[test]
    fn empty_matrix() { assert_eq!(transpose(&[]), Ok(vec![])); }
    #[test]
    fn ragged_rows_are_an_error() { assert_eq!(transpose(&[vec![1, 2], vec![3]]), Err("ragged matrix".to_string())); }
    #[test]
    fn twice_is_identity() { let m = vec![vec![1, 2, 3], vec![4, 5, 6]]; assert_eq!(transpose(&transpose(&m).unwrap()), Ok(m)); }`,
      hints: ['Column `c` of the result is "element `c` of every row".', 'So: for each column index `0..width`, map over the rows and collect — a `map` inside a `map`.', 'Check the row lengths first; indexing a short row with `row[col]` would panic.'],
    },
  ],
  drills: [
    { q: 'What happens to `a` here?', code: `let a = String::from("hi");\nlet b = a;\nprintln!("{}", a);`, choices: ['Prints hi', 'Compile error: a was moved into b', 'Runtime panic', 'Prints an empty string'], answer: 1, why: 'A `String` owns heap memory, so assignment moves ownership. Use `&a` to borrow, or `a.clone()` to copy.' },
    { q: 'Why does the same code compile with `let a = 5; let b = a;`?', choices: ['Integers are never moved', '`i32` implements Copy, so it is duplicated instead of moved', 'The compiler optimises it', 'It does not compile'], answer: 1, why: 'Small fixed-size types (integers, floats, bool, char) are `Copy`: both variables stay usable.' },
    { q: 'How many mutable references to one value may exist at a time?', choices: ['Any number', 'Exactly one, and no shared references alongside it', 'Two', 'None'], answer: 1, why: 'Many readers *or* one writer. This rule is what rules out data races at compile time.' },
    { q: 'What does `?` do after a `Result`?', choices: ['Ignores the error', 'Unwraps Ok, or returns the Err from the current function', 'Panics on Err', 'Converts it to Option'], answer: 1, why: 'It is early-return error propagation. The enclosing function must itself return a compatible `Result`.' },
    { q: 'What does `.unwrap()` do on a `None`?', choices: ['Returns a default', 'Panics', 'Returns null', 'Compile error'], answer: 1, why: 'Fine in tests and prototypes; in real code prefer `?`, `unwrap_or`, or `match`.' },
    { q: 'What is the type of `"hello"`?', choices: ['String', "&'static str", 'char[]', 'str'], answer: 1, why: 'A literal is a borrowed string slice baked into the binary. `String::from("hello")` makes an owned one.' },
    { q: 'What does `let x = 5; x = 6;` do?', choices: ['Sets x to 6', 'Compile error: x is not mutable', 'Creates a second x', 'Runtime error'], answer: 1, why: 'Bindings are immutable by default. Write `let mut x = 5;`.' },
    { q: 'What does `match` require?', choices: ['A default arm always', 'Every possible value to be covered', 'Only enums', 'At most three arms'], answer: 1, why: 'Matches are exhaustive. Add a variant to an enum and the compiler points at every `match` you need to update.' },
    { q: 'When is a value freed in Rust?', choices: ['When the garbage collector runs', 'When its owner goes out of scope', 'When you call free()', 'At program exit'], answer: 1, why: 'No GC and no manual free. Ownership makes the drop point known at compile time.' },
    { q: 'What is the difference between `iter()` and `into_iter()` on a Vec?', choices: ['None', '`iter()` borrows the items; `into_iter()` consumes the vector and yields owned items', '`into_iter()` is slower', '`iter()` copies everything'], answer: 1, why: 'After `into_iter()` the vector is gone. `iter_mut()` is the third option: mutable borrows.' },
    { q: 'What does `#[derive(Debug)]` give a struct?', choices: ['A debugger breakpoint', 'The ability to be printed with {:?}', 'Runtime type checks', 'Faster compilation'], answer: 1, why: 'The compiler writes the formatting code for you. `{:#?}` pretty-prints.' },
    { q: 'What is `cargo`?', choices: ['The Rust compiler', "Rust's build tool and package manager", 'A linter', 'A test framework only'], answer: 1, why: '`cargo new`, `cargo build`, `cargo run`, `cargo test`. It calls `rustc` and fetches crates listed in Cargo.toml.' },
    { q: 'Why does this fail to compile?', code: `fn dangle() -> &String {\n    let s = String::from("x");\n    &s\n}`, choices: ['Missing semicolon', 's is dropped at the end of the function, so the reference would point at freed memory', 'Strings cannot be returned', '& is not allowed in return position'], answer: 1, why: 'The borrow checker refuses dangling references. Return the `String` itself to hand over ownership.' },
    { q: 'What does this function return?', code: `fn five() -> i32 {\n    5;\n}`, choices: ['5', 'It does not compile: the body evaluates to ()', '0', 'It panics'], answer: 1, why: 'The semicolon turns `5` into a statement, leaving no value. Remove it and the function returns 5.' },
    { q: 'What is shadowing?', code: `let x = 5;\nlet x = x + 1;`, choices: ['A compile error', 'Declaring a new variable with the same name, hiding the old one', 'Mutating x', 'A memory leak'], answer: 1, why: 'Each `let` makes a fresh binding, which may even have a different type. It is not mutation.' },
    { q: 'What does `&mut` mean in `fn push(v: &mut Vec<i32>)`?', choices: ['v is moved in', 'The function borrows v and is allowed to change it', 'v is copied', 'v is immutable'], answer: 1, why: 'The caller writes `push(&mut v)` and keeps ownership. Only one mutable borrow may exist at a time.' },
    { q: 'What does `vec[10]` do on a three-element vector?', choices: ['Returns None', 'Panics at runtime', 'Returns 0', 'Fails to compile'], answer: 1, why: 'Indexing is bounds-checked and panics. `vec.get(10)` returns an `Option` instead.' },
    { q: 'What is the difference between `String::from("a")` and `"a"`?', choices: ['None', 'The first is an owned, growable heap string; the second is a borrowed slice', 'The second is slower', 'The first is immutable'], answer: 1, why: 'Take `&str` in function parameters to accept both; return `String` when you create new text.' },
    { q: 'What does `#[derive(Clone)]` allow?', choices: ['Implicit copies on assignment', 'Calling `.clone()` to make an explicit deep copy', 'Comparison with ==', 'Printing with {}'], answer: 1, why: 'Clone is always explicit. `Copy` is the trait that makes assignment duplicate implicitly, and only for simple types.' },
    { q: 'What does `if let Some(x) = maybe { … }` do?', choices: ['Assigns Some to maybe', 'Runs the block only when maybe is Some, binding its contents to x', 'Panics on None', 'Loops until Some'], answer: 1, why: 'It is a `match` with one arm you care about. `let … else` is the inverse for early returns.' },
    { q: 'What is a crate?', choices: ['A function', 'A compilation unit: a library or a binary', 'A struct', 'A test'], answer: 1, why: 'Crates are what you publish to and download from crates.io; modules organise code inside one.' },
    { q: 'What happens on integer overflow in a debug build?', code: `let x: u8 = 255;\nlet y = x + 1;`, choices: ['y is 0', 'The program panics', 'y is 256', 'Undefined behaviour'], answer: 1, why: 'Debug builds check and panic; release builds wrap. Use `wrapping_add`, `checked_add` or `saturating_add` to say what you mean.' },
    { q: 'What does `impl Trait for Type` do?', choices: ['Declares a new trait', 'Provides that trait\'s methods for that type', 'Inherits from Type', 'Creates an instance'], answer: 1, why: 'Rust has no inheritance. Shared behaviour comes from implementing traits.' },
    { q: 'What does `pub` do?', choices: ['Makes an item mutable', 'Makes an item visible outside its module', 'Publishes to crates.io', 'Makes it static'], answer: 1, why: 'Everything is private to its module by default — including struct fields, which need their own `pub`.' },
    { q: 'What does `cargo check` do compared with `cargo build`?', choices: ['The same thing', 'Type-checks without producing a binary, so it is much faster', 'Runs the tests', 'Formats the code'], answer: 1, why: 'The quick feedback loop while writing. `cargo clippy` adds lints; `cargo fmt` formats.' },
  ],
};
