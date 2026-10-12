'use strict';

module.exports = {
  id: 'javascript',
  name: 'JavaScript',
  short: 'JS',
  blurb: 'The language under everything else here: arrays, closures, objects, async.',
  lang: 'javascript',
  runner: { kind: 'node', loader: 'js' },
  challenges: [
    {
      id: 'sum', title: 'Sum the array', tier: 1,
      prompt: "Write `sum(nums)` that returns the total of an array of numbers. An empty array sums to `0`.",
      starter: `function sum(nums) {\n  \n}\n`,
      solution: `function sum(nums) {\n  return nums.reduce((a, b) => a + b, 0);\n}\n`,
      tests: `test('adds numbers', () => eq(sum([1, 2, 3, 4]), 10));
test('handles negatives', () => eq(sum([-5, 5, 2]), 2));
test('empty array is 0', () => eq(sum([]), 0));`,
      hints: ['`reduce` takes a callback and a starting value.', 'Without a starting value, `reduce` on an empty array throws — pass `0`.'],
    },
    {
      id: 'fizzbuzz', title: 'FizzBuzz', tier: 1,
      prompt: "Write `fizzbuzz(n)` that returns an array for 1 through `n`: `'Fizz'` for multiples of 3, `'Buzz'` for multiples of 5, `'FizzBuzz'` for both, otherwise the number itself.",
      starter: `function fizzbuzz(n) {\n  \n}\n`,
      solution: `function fizzbuzz(n) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    out.push(i % 15 === 0 ? 'FizzBuzz' : i % 3 === 0 ? 'Fizz' : i % 5 === 0 ? 'Buzz' : i);
  }
  return out;
}
`,
      tests: `test('first five', () => eq(fizzbuzz(5), [1, 2, 'Fizz', 4, 'Buzz']));
test('fifteen is FizzBuzz', () => eq(fizzbuzz(15)[14], 'FizzBuzz'));
test('numbers stay numbers', () => eq(typeof fizzbuzz(2)[1], 'number'));
test('zero gives an empty array', () => eq(fizzbuzz(0), []));`,
      hints: ['`%` gives the remainder; `i % 3 === 0` means divisible by 3.', 'Check the "both" case first, or it will never be reached.'],
    },
    {
      id: 'reverse-words', title: 'Reverse the words', tier: 1,
      prompt: "Write `reverseWords(s)` that reverses the order of the words in a sentence. Words are separated by single spaces.\n\n`reverseWords('the quick fox')` → `'fox quick the'`",
      starter: `function reverseWords(s) {\n  \n}\n`,
      solution: `function reverseWords(s) {\n  return s.split(' ').reverse().join(' ');\n}\n`,
      tests: `test('three words', () => eq(reverseWords('the quick fox'), 'fox quick the'));
test('one word', () => eq(reverseWords('hello'), 'hello'));
test('letters inside words are untouched', () => eq(reverseWords('ab cd'), 'cd ab'));`,
      hints: ['Turn the string into an array, reorder it, turn it back.', '`split`, `reverse`, `join`.'],
    },
    {
      id: 'count-vowels', title: 'Count the vowels', tier: 1,
      prompt: "Write `countVowels(s)` that returns how many vowels (`a e i o u`, either case) are in the string.",
      starter: `function countVowels(s) {\n  \n}\n`,
      solution: `function countVowels(s) {\n  return [...s.toLowerCase()].filter((c) => 'aeiou'.includes(c)).length;\n}\n`,
      tests: `test('lowercase', () => eq(countVowels('banana'), 3));
test('uppercase counts too', () => eq(countVowels('AEIOU'), 5));
test('no vowels', () => eq(countVowels('rhythm'), 0));
test('empty string', () => eq(countVowels(''), 0));`,
      hints: ['Normalise the case first so you only compare against five letters.', 'A regex works too: `s.match(/[aeiou]/gi)` — but it returns `null` when nothing matches.'],
    },
    {
      id: 'unique', title: 'Remove duplicates', tier: 1,
      prompt: "Write `unique(arr)` that returns a new array with duplicates removed, keeping the first occurrence of each value in its original position.",
      starter: `function unique(arr) {\n  \n}\n`,
      solution: `function unique(arr) {\n  return [...new Set(arr)];\n}\n`,
      tests: `test('removes repeats', () => eq(unique([1, 2, 2, 3, 1]), [1, 2, 3]));
test('keeps first-seen order', () => eq(unique(['b', 'a', 'b', 'c', 'a']), ['b', 'a', 'c']));
test('does not modify the input', () => { const a = [1, 1]; unique(a); eq(a, [1, 1]); });`,
      hints: ['A `Set` only stores each value once, and remembers insertion order.', 'Spread a Set back into an array with `[...set]`.'],
    },
    {
      id: 'title-case', title: 'Title case', tier: 1,
      prompt: "Write `titleCase(s)` that capitalises the first letter of every word and lowercases the rest.\n\n`titleCase('hELLO wORLD')` → `'Hello World'`",
      starter: `function titleCase(s) {\n  \n}\n`,
      solution: `function titleCase(s) {\n  return s.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');\n}\n`,
      tests: `test('mixed case', () => eq(titleCase('hELLO wORLD'), 'Hello World'));
test('single word', () => eq(titleCase('dojo'), 'Dojo'));
test('empty string', () => eq(titleCase(''), ''));`,
      hints: ['Handle one word, then `map` that over all the words.', '`w.charAt(0)` is safe on an empty string; `w[0]` is `undefined`.'],
    },
    {
      id: 'range', title: 'Build a range', tier: 1,
      prompt: "Write `range(start, end, step = 1)` returning the numbers from `start` up to **but not including** `end`.\n\n`range(0, 10, 5)` → `[0, 5]`",
      starter: `function range(start, end, step = 1) {\n  \n}\n`,
      solution: `function range(start, end, step = 1) {\n  const out = [];\n  for (let i = start; i < end; i += step) out.push(i);\n  return out;\n}\n`,
      tests: `test('default step', () => eq(range(1, 5), [1, 2, 3, 4]));
test('custom step', () => eq(range(0, 10, 5), [0, 5]));
test('empty when start >= end', () => eq(range(3, 3), []));`,
      hints: ['A plain `for` loop with `i += step` is the clearest tool here.'],
    },
    {
      id: 'chunk', title: 'Chunk an array', tier: 1,
      prompt: "Write `chunk(arr, size)` that splits an array into groups of `size`. The last group may be smaller.\n\n`chunk([1,2,3,4,5], 2)` → `[[1,2],[3,4],[5]]`",
      starter: `function chunk(arr, size) {\n  \n}\n`,
      solution: `function chunk(arr, size) {\n  const out = [];\n  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));\n  return out;\n}\n`,
      tests: `test('uneven split', () => eq(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]));
test('exact split', () => eq(chunk(['a', 'b', 'c', 'd'], 2), [['a', 'b'], ['c', 'd']]));
test('empty input', () => eq(chunk([], 3), []));`,
      hints: ['Step through the array `size` items at a time.', '`slice(i, i + size)` never errors when it runs past the end.'],
    },
    {
      id: 'pick', title: 'Pick properties', tier: 1,
      prompt: "Write `pick(obj, keys)` that returns a new object containing only the listed keys. Keys that are not on the object are skipped.",
      starter: `function pick(obj, keys) {\n  \n}\n`,
      solution: `function pick(obj, keys) {\n  const out = {};\n  for (const k of keys) if (k in obj) out[k] = obj[k];\n  return out;\n}\n`,
      tests: `test('keeps listed keys', () => eq(pick({ a: 1, b: 2, c: 3 }, ['a', 'c']), { a: 1, c: 3 }));
test('skips missing keys', () => eq(pick({ a: 1 }, ['a', 'zzz']), { a: 1 }));
test('keeps falsy values', () => eq(pick({ n: 0, s: '' }, ['n', 's']), { n: 0, s: '' }));`,
      hints: ['Loop over `keys`, not over the object.', 'Test for presence with `k in obj` — checking `obj[k]` would drop `0` and empty strings.'],
    },
    {
      id: 'counter', title: 'Closure counter', tier: 1,
      prompt: "Write `makeCounter()` that returns a function. Each call to that function returns the next integer, starting at `1`. Separate counters must not share state.",
      starter: `function makeCounter() {\n  \n}\n`,
      solution: `function makeCounter() {\n  let n = 0;\n  return () => ++n;\n}\n`,
      tests: `test('counts up from 1', () => { const c = makeCounter(); eq([c(), c(), c()], [1, 2, 3]); });
test('counters are independent', () => { const a = makeCounter(), b = makeCounter(); a(); a(); eq(b(), 1); });`,
      hints: ['A variable declared inside `makeCounter` stays alive as long as the returned function does.', 'That is a closure: the inner function keeps a reference to `n`, not a copy.'],
    },
    {
      id: 'loop-bug', title: 'Fix: the loop that forgets', tier: 1,
      prompt: "**Bug hunt.** `makeAdders(3)` should return three functions where the *i*-th one adds `i` to its argument. Right now every one of them adds `3`. Fix it.",
      starter: `function makeAdders(n) {\n  var adders = [];\n  for (var i = 0; i < n; i++) {\n    adders.push(function (x) { return x + i; });\n  }\n  return adders;\n}\n`,
      solution: `function makeAdders(n) {\n  const adders = [];\n  for (let i = 0; i < n; i++) {\n    adders.push(function (x) { return x + i; });\n  }\n  return adders;\n}\n`,
      tests: `test('each adder remembers its own i', () => { const a = makeAdders(3); eq([a[0](10), a[1](10), a[2](10)], [10, 11, 12]); });
test('returns n functions', () => eq(makeAdders(5).length, 5));`,
      hints: ['All three functions close over the *same* `i`. What is its value once the loop has finished?', '`var` is one variable for the whole function. `let` creates a fresh one per iteration.'],
    },
    {
      id: 'group-by', title: 'Group by', tier: 2,
      prompt: "Write `groupBy(arr, fn)` that returns an object whose keys are the results of `fn(item)` and whose values are arrays of the items that produced that key.",
      starter: `function groupBy(arr, fn) {\n  \n}\n`,
      solution: `function groupBy(arr, fn) {\n  const out = {};\n  for (const item of arr) (out[fn(item)] ||= []).push(item);\n  return out;\n}\n`,
      tests: `test('by length', () => eq(groupBy(['a', 'bb', 'c', 'dd'], (s) => s.length), { 1: ['a', 'c'], 2: ['bb', 'dd'] }));
test('by property', () => eq(groupBy([{ t: 'x', n: 1 }, { t: 'y', n: 2 }, { t: 'x', n: 3 }], (o) => o.t), { x: [{ t: 'x', n: 1 }, { t: 'x', n: 3 }], y: [{ t: 'y', n: 2 }] }));
test('empty input', () => eq(groupBy([], (x) => x), {}));`,
      hints: ['For each item: work out its key, make sure an array exists for that key, push.', '`out[key] ||= []` creates the array only the first time.'],
    },
    {
      id: 'flatten', title: 'Flatten deeply', tier: 2,
      prompt: "Write `flatten(arr)` that flattens arbitrarily nested arrays into one flat array — **without** using `Array.prototype.flat`.",
      starter: `function flatten(arr) {\n  \n}\n`,
      solution: `function flatten(arr) {\n  const out = [];\n  for (const x of arr) {\n    if (Array.isArray(x)) out.push(...flatten(x));\n    else out.push(x);\n  }\n  return out;\n}\n`,
      tests: `test('nested', () => eq(flatten([1, [2, [3, [4]], 5]]), [1, 2, 3, 4, 5]));
test('already flat', () => eq(flatten([1, 2]), [1, 2]));
test('empty arrays vanish', () => eq(flatten([[], [[]], 1]), [1]));
test('does not use .flat()', () => ok(!/\\.flat\\s*\\(/.test(flatten.toString()), 'solve it without .flat()'));`,
      hints: ['This is a recursion problem: an item is either a value, or an array you flatten the same way.', '`Array.isArray(x)` tells the two cases apart.'],
    },
    {
      id: 'anagrams', title: 'Group the anagrams', tier: 2,
      prompt: "Write `groupAnagrams(words)` that returns an array of groups, where each group holds words that are anagrams of each other. Keep groups in order of first appearance, and words in their original order inside a group.",
      starter: `function groupAnagrams(words) {\n  \n}\n`,
      solution: `function groupAnagrams(words) {\n  const map = new Map();\n  for (const w of words) {\n    const key = [...w].sort().join('');\n    if (!map.has(key)) map.set(key, []);\n    map.get(key).push(w);\n  }\n  return [...map.values()];\n}\n`,
      tests: `test('groups anagrams', () => eq(groupAnagrams(['eat', 'tea', 'tan', 'ate', 'nat', 'bat']), [['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']]));
test('no anagrams', () => eq(groupAnagrams(['a', 'b']), [['a'], ['b']]));`,
      hints: ['Two words are anagrams when their letters, sorted, are identical. That sorted string is a perfect grouping key.', 'A `Map` remembers insertion order, which gives you "order of first appearance" for free.'],
    },
    {
      id: 'query-string', title: 'Parse a query string', tier: 2,
      prompt: "Write `parseQuery(qs)` that turns `'a=1&b=hello%20world'` into `{ a: '1', b: 'hello world' }`. A leading `?` is allowed. If a key repeats, its value becomes an array of all the values. Do it by hand — no `URLSearchParams`.",
      starter: `function parseQuery(qs) {\n  \n}\n`,
      solution: `function parseQuery(qs) {\n  const out = {};\n  for (const pair of qs.replace(/^\\?/, '').split('&')) {\n    if (!pair) continue;\n    const [k, v = ''] = pair.split('=').map(decodeURIComponent);\n    if (k in out) out[k] = [].concat(out[k], v);\n    else out[k] = v;\n  }\n  return out;\n}\n`,
      tests: `test('simple pairs', () => eq(parseQuery('a=1&b=2'), { a: '1', b: '2' }));
test('leading ? and decoding', () => eq(parseQuery('?q=hello%20world'), { q: 'hello world' }));
test('repeated keys become arrays', () => eq(parseQuery('t=a&t=b&t=c'), { t: ['a', 'b', 'c'] }));
test('empty string', () => eq(parseQuery(''), {}));
test('no URLSearchParams', () => ok(!/URLSearchParams/.test(parseQuery.toString()), 'parse it by hand'));`,
      hints: ['Split on `&` for pairs, then on `=` for key and value.', '`decodeURIComponent` turns `%20` back into a space.', '`"".split("&")` gives `[""]`, not `[]` — skip empty pairs.'],
    },
    {
      id: 'stack', title: 'A Stack class', tier: 2,
      prompt: "Write a class `Stack` with `push(x)`, `pop()`, `peek()` and a `size` **getter**. `pop()` and `peek()` on an empty stack must throw an `Error` with the message `'stack is empty'`. `push` should return the stack so calls can chain.",
      starter: `class Stack {\n  \n}\n`,
      solution: `class Stack {\n  #items = [];\n  push(x) { this.#items.push(x); return this; }\n  pop() { this.#check(); return this.#items.pop(); }\n  peek() { this.#check(); return this.#items[this.#items.length - 1]; }\n  get size() { return this.#items.length; }\n  #check() { if (!this.#items.length) throw new Error('stack is empty'); }\n}\n`,
      tests: `test('push and pop are last-in first-out', () => { const s = new Stack(); s.push(1); s.push(2); eq(s.pop(), 2); eq(s.pop(), 1); });
test('peek does not remove', () => { const s = new Stack(); s.push('a'); eq(s.peek(), 'a'); eq(s.size, 1); });
test('size is a getter, not a method', () => { const s = new Stack(); s.push(1); eq(typeof s.size, 'number'); });
test('push chains', () => eq(new Stack().push(1).push(2).size, 2));
test('pop on empty throws', () => eq(throws(() => new Stack().pop()).message, 'stack is empty'));
test('peek on empty throws', () => eq(throws(() => new Stack().peek()).message, 'stack is empty'));`,
      hints: ['`get size() { ... }` defines a property that is computed when read.', 'Chaining works when a method ends with `return this`.'],
    },
    {
      id: 'once', title: 'Run only once', tier: 2,
      prompt: "Write `once(fn)` that returns a wrapper. The first call runs `fn` with the given arguments and returns its result. Every later call returns that same first result **without** running `fn` again.",
      starter: `function once(fn) {\n  \n}\n`,
      solution: `function once(fn) {\n  let done = false, result;\n  return (...args) => {\n    if (!done) { done = true; result = fn(...args); }\n    return result;\n  };\n}\n`,
      tests: `test('runs the function the first time', () => eq(once((a, b) => a + b)(2, 3), 5));
test('later calls reuse the first result', () => { const f = once((x) => x * 2); f(4); eq(f(100), 8); });
test('the function really runs once', () => { let n = 0; const f = once(() => ++n); f(); f(); f(); eq(n, 1); });
test('works when the result is undefined', () => { let n = 0; const f = once(() => { n++; }); f(); f(); eq(n, 1); });`,
      hints: ['You need two pieces of remembered state: the result, and whether you have run yet.', 'Do not use the result itself as the "have I run" flag — the function might legitimately return `undefined`.'],
    },
    {
      id: 'memoize', title: 'Memoize', tier: 2,
      prompt: "Write `memoize(fn)` for single-argument functions. It returns a wrapper that caches results by argument, so `fn` runs at most once per distinct argument.",
      starter: `function memoize(fn) {\n  \n}\n`,
      solution: `function memoize(fn) {\n  const cache = new Map();\n  return (x) => {\n    if (!cache.has(x)) cache.set(x, fn(x));\n    return cache.get(x);\n  };\n}\n`,
      tests: `test('returns correct results', () => { const sq = memoize((x) => x * x); eq([sq(3), sq(4), sq(3)], [9, 16, 9]); });
test('calls fn once per argument', () => { let n = 0; const f = memoize((x) => { n++; return x; }); f(1); f(1); f(2); f(1); eq(n, 2); });
test('caches falsy results too', () => { let n = 0; const f = memoize(() => { n++; return 0; }); f('a'); f('a'); eq(n, 1); });`,
      hints: ['A `Map` keyed by the argument is the cache.', 'Use `cache.has(x)` to test — a cached value of `0` or `false` is still cached.'],
    },
    {
      id: 'pipe', title: 'Pipe functions', tier: 2,
      prompt: "Write `pipe(...fns)` that returns a function. Calling it passes its argument through each function **left to right**. With no functions, it returns its argument unchanged.",
      starter: `function pipe(...fns) {\n  \n}\n`,
      solution: `function pipe(...fns) {\n  return (x) => fns.reduce((acc, fn) => fn(acc), x);\n}\n`,
      tests: `test('left to right', () => eq(pipe((x) => x + 1, (x) => x * 10)(1), 20));
test('single function', () => eq(pipe((s) => s.toUpperCase())('hi'), 'HI'));
test('no functions is identity', () => eq(pipe()(42), 42));`,
      hints: ['The output of each function is the input of the next — that is a `reduce` where the accumulator is the value so far.'],
    },
    {
      id: 'deep-clone', title: 'Deep clone', tier: 2,
      prompt: "Write `deepClone(value)` that copies plain objects and arrays all the way down, so changing the copy never changes the original. Primitives are returned as-is. Do it yourself — no `structuredClone` or `JSON`.",
      starter: `function deepClone(value) {\n  \n}\n`,
      solution: `function deepClone(value) {\n  if (Array.isArray(value)) return value.map(deepClone);\n  if (value !== null && typeof value === 'object') {\n    const out = {};\n    for (const k of Object.keys(value)) out[k] = deepClone(value[k]);\n    return out;\n  }\n  return value;\n}\n`,
      tests: `test('equal but not the same object', () => { const o = { a: [1, { b: 2 }] }; const c = deepClone(o); eq(c, o); ok(c !== o && c.a !== o.a && c.a[1] !== o.a[1], 'nested objects must be new'); });
test('mutating the copy leaves the original alone', () => { const o = { list: [1, 2] }; deepClone(o).list.push(3); eq(o.list, [1, 2]); });
test('primitives and null pass through', () => eq([deepClone(5), deepClone('x'), deepClone(null)], [5, 'x', null]));
test('written by hand', () => ok(!/structuredClone|JSON\\./.test(deepClone.toString()), 'no structuredClone / JSON'));`,
      hints: ['Three cases: array, object, everything else.', '`typeof null` is `"object"` — rule `null` out first.'],
    },
    {
      id: 'delay', title: 'A promise that waits', tier: 1,
      prompt: "Write `delay(ms, value)` that returns a Promise which resolves with `value` after `ms` milliseconds.",
      starter: `function delay(ms, value) {\n  \n}\n`,
      solution: `function delay(ms, value) {\n  return new Promise((resolve) => setTimeout(() => resolve(value), ms));\n}\n`,
      tests: `test('returns a promise', () => ok(delay(1) instanceof Promise));
test('resolves with the value', async () => eq(await delay(5, 'done'), 'done'));
test('actually waits', async () => { const t = Date.now(); await delay(40); ok(Date.now() - t >= 30, 'resolved too early'); });`,
      hints: ['`new Promise((resolve) => { ... })` — call `resolve` when the work is finished.', '`setTimeout` is the thing that does the waiting.'],
    },
    {
      id: 'retry', title: 'Retry a flaky call', tier: 2,
      prompt: "Write `async retry(fn, attempts)`. Call the async function `fn`. If it rejects, try again, up to `attempts` total tries. Resolve with the first success. If every try fails, reject with the **last** error.",
      starter: `async function retry(fn, attempts) {\n  \n}\n`,
      solution: `async function retry(fn, attempts) {\n  let last;\n  for (let i = 0; i < attempts; i++) {\n    try { return await fn(); } catch (e) { last = e; }\n  }\n  throw last;\n}\n`,
      tests: `test('returns the first success', async () => eq(await retry(async () => 'ok', 3), 'ok'));
test('keeps trying after failures', async () => { let n = 0; eq(await retry(async () => { if (++n < 3) throw new Error('no'); return n; }, 5), 3); });
test('stops at the attempt limit', async () => { let n = 0; await rejects(retry(async () => { n++; throw new Error('x'); }, 4)); eq(n, 4); });
test('rejects with the last error', async () => { let n = 0; const e = await rejects(retry(async () => { throw new Error('fail ' + ++n); }, 2)); eq(e.message, 'fail 2'); });`,
      hints: ['`try { return await fn(); } catch (e) { ... }` inside a loop.', 'The `await` matters: without it, the rejection escapes your `try` block.'],
    },
    {
      id: 'debounce', title: 'Debounce', tier: 3,
      prompt: "Write `debounce(fn, ms)`. The returned function delays calling `fn` until `ms` milliseconds have passed **since the last call**. A burst of calls results in one call to `fn`, with the arguments of the final call.",
      starter: `function debounce(fn, ms) {\n  \n}\n`,
      solution: `function debounce(fn, ms) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), ms);\n  };\n}\n`,
      tests: `test('a burst collapses into one call', async () => { let n = 0; const d = debounce(() => n++, 30); d(); d(); d(); await sleep(80); eq(n, 1); });
test('uses the last arguments', async () => { let got; const d = debounce((x) => { got = x; }, 20); d('a'); d('b'); await sleep(60); eq(got, 'b'); });
test('does not fire early', async () => { let n = 0; const d = debounce(() => n++, 60); d(); await sleep(15); eq(n, 0); await sleep(90); eq(n, 1); });
test('separate bursts each fire', async () => { let n = 0; const d = debounce(() => n++, 15); d(); await sleep(50); d(); await sleep(50); eq(n, 2); });`,
      hints: ['Every call should cancel the timer the previous call started, then start a new one.', '`clearTimeout(undefined)` is harmless, so the first call needs no special case.'],
    },
    {
      id: 'curry', title: 'Curry', tier: 3,
      prompt: "Write `curry(fn)`. The curried function collects arguments across calls and runs `fn` once it has received as many as `fn` declares (`fn.length`). Arguments may arrive one at a time or several at once: `add(1)(2)(3)`, `add(1, 2)(3)` and `add(1)(2, 3)` all work.",
      starter: `function curry(fn) {\n  \n}\n`,
      solution: `function curry(fn) {\n  return function curried(...args) {\n    if (args.length >= fn.length) return fn(...args);\n    return (...more) => curried(...args, ...more);\n  };\n}\n`,
      tests: `const add3 = (a, b, c) => a + b + c;
test('one at a time', () => eq(curry(add3)(1)(2)(3), 6));
test('mixed grouping', () => { eq(curry(add3)(1, 2)(3), 6); eq(curry(add3)(1)(2, 3), 6); });
test('all at once', () => eq(curry(add3)(1, 2, 3), 6));
test('partials are reusable', () => { const add1 = curry(add3)(1); eq(add1(1)(1), 3); eq(add1(5)(5), 11); });`,
      hints: ['`fn.length` is the number of parameters a function declares.', 'If you have enough arguments, call `fn`. Otherwise return a function that gathers more and asks the same question again.'],
    },
    {
      id: 'emitter', title: 'Tiny event emitter', tier: 3,
      prompt: "Write a class `Emitter` with:\n\n- `on(event, listener)` — subscribe; returns an **unsubscribe function**\n- `emit(event, ...args)` — call every listener for that event, in subscription order; returns how many were called\n- `once(event, listener)` — like `on`, but the listener is removed after its first call",
      starter: `class Emitter {\n  \n}\n`,
      solution: `class Emitter {\n  #map = new Map();\n  on(event, listener) {\n    if (!this.#map.has(event)) this.#map.set(event, []);\n    this.#map.get(event).push(listener);\n    return () => {\n      const list = this.#map.get(event);\n      const i = list.indexOf(listener);\n      if (i !== -1) list.splice(i, 1);\n    };\n  }\n  once(event, listener) {\n    const off = this.on(event, (...args) => { off(); listener(...args); });\n    return off;\n  }\n  emit(event, ...args) {\n    const list = [...(this.#map.get(event) || [])];\n    for (const l of list) l(...args);\n    return list.length;\n  }\n}\n`,
      tests: `test('listeners receive the arguments', () => { const e = new Emitter(); let got; e.on('hi', (a, b) => { got = [a, b]; }); e.emit('hi', 1, 2); eq(got, [1, 2]); });
test('emit returns the listener count', () => { const e = new Emitter(); e.on('x', () => {}); e.on('x', () => {}); eq(e.emit('x'), 2); eq(e.emit('nobody'), 0); });
test('listeners run in order', () => { const e = new Emitter(); const log = []; e.on('x', () => log.push('a')); e.on('x', () => log.push('b')); e.emit('x'); eq(log, ['a', 'b']); });
test('on returns an unsubscribe function', () => { const e = new Emitter(); let n = 0; const off = e.on('x', () => n++); e.emit('x'); off(); e.emit('x'); eq(n, 1); });
test('once fires a single time', () => { const e = new Emitter(); let n = 0; e.once('x', () => n++); e.emit('x'); e.emit('x'); eq(n, 1); });
test('events are separate', () => { const e = new Emitter(); let n = 0; e.on('a', () => n++); e.emit('b'); eq(n, 0); });`,
      hints: ['Store a `Map` from event name to an array of listeners.', '`once` can be built on top of `on`: wrap the listener in a function that unsubscribes itself first.', 'Copy the listener array before looping in `emit` — a `once` listener removes itself mid-loop.'],
    },
    {
      id: 'map-limit', title: 'Boss: limited concurrency', tier: 3,
      prompt: "Write `async mapLimit(items, limit, fn)`. It runs the async `fn(item)` for every item, but never has more than `limit` calls in flight at once. It resolves with the results **in the same order as the input**, no matter which finished first.",
      starter: `async function mapLimit(items, limit, fn) {\n  \n}\n`,
      solution: `async function mapLimit(items, limit, fn) {\n  const results = new Array(items.length);\n  let next = 0;\n  async function worker() {\n    while (next < items.length) {\n      const i = next++;\n      results[i] = await fn(items[i]);\n    }\n  }\n  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));\n  return results;\n}\n`,
      tests: `test('results keep input order', async () => eq(await mapLimit([30, 5, 15], 3, async (ms) => { await sleep(ms); return ms; }), [30, 5, 15]));
test('never exceeds the limit', async () => { let live = 0, peak = 0; await mapLimit([1, 2, 3, 4, 5, 6], 2, async () => { live++; peak = Math.max(peak, live); await sleep(10); live--; }); eq(peak, 2); });
test('actually runs in parallel', async () => { const t = Date.now(); await mapLimit([1, 2, 3, 4], 4, () => sleep(40)); ok(Date.now() - t < 120, 'ran one at a time'); });
test('empty input', async () => eq(await mapLimit([], 3, async (x) => x), []));`,
      hints: ['Think of `limit` workers sharing one queue. Each worker loops: take the next index, await it, repeat.', 'Write each result into `results[i]` by index — that is what preserves order.', 'JavaScript is single-threaded, so `const i = next++` between awaits is safe: no two workers can grab the same index.'],
    },
    {
      id: 'lru', title: 'Boss: LRU cache', tier: 3,
      prompt: "Write a class `LRUCache` taking a `capacity`.\n\n- `get(key)` returns the value, or `undefined` if absent. A hit marks the key as most recently used.\n- `set(key, value)` stores it and marks it most recently used. If that pushes the cache over capacity, the **least recently used** key is evicted.\n- `has(key)` returns a boolean and does *not* count as a use.",
      starter: `class LRUCache {\n  constructor(capacity) {\n    \n  }\n}\n`,
      solution: `class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n    this.map = new Map();\n  }\n  get(key) {\n    if (!this.map.has(key)) return undefined;\n    const v = this.map.get(key);\n    this.map.delete(key);\n    this.map.set(key, v);\n    return v;\n  }\n  set(key, value) {\n    this.map.delete(key);\n    this.map.set(key, value);\n    if (this.map.size > this.capacity) this.map.delete(this.map.keys().next().value);\n  }\n  has(key) { return this.map.has(key); }\n}\n`,
      tests: `test('stores and reads', () => { const c = new LRUCache(2); c.set('a', 1); eq(c.get('a'), 1); eq(c.get('zzz'), undefined); });
test('evicts the oldest when full', () => { const c = new LRUCache(2); c.set('a', 1); c.set('b', 2); c.set('c', 3); eq([c.has('a'), c.has('b'), c.has('c')], [false, true, true]); });
test('get refreshes a key', () => { const c = new LRUCache(2); c.set('a', 1); c.set('b', 2); c.get('a'); c.set('c', 3); eq([c.has('a'), c.has('b')], [true, false]); });
test('set on an existing key refreshes it', () => { const c = new LRUCache(2); c.set('a', 1); c.set('b', 2); c.set('a', 9); c.set('c', 3); eq([c.get('a'), c.has('b')], [9, false]); });
test('has does not refresh', () => { const c = new LRUCache(2); c.set('a', 1); c.set('b', 2); c.has('a'); c.set('c', 3); eq(c.has('a'), false); });`,
      hints: ['A `Map` iterates in insertion order. If you delete and re-insert a key every time it is used, the *first* key in the Map is always the least recently used.', '`map.keys().next().value` is the first key.'],
    },
    {
      id: 'clamp', title: 'Clamp a number', tier: 1,
      prompt: "Write `clamp(n, min, max)` that returns `n` limited to the range `min`–`max`: values below `min` become `min`, values above `max` become `max`.",
      starter: `function clamp(n, min, max) {\n  \n}\n`,
      solution: `function clamp(n, min, max) {\n  return Math.min(Math.max(n, min), max);\n}\n`,
      tests: `test('inside the range', () => eq(clamp(5, 0, 10), 5));
test('below', () => eq(clamp(-3, 0, 10), 0));
test('above', () => eq(clamp(99, 0, 10), 10));
test('on the edges', () => eq([clamp(0, 0, 10), clamp(10, 0, 10)], [0, 10]));`,
      hints: ['`Math.max(n, min)` lifts a value that is too low.', 'Wrap that in `Math.min(..., max)` to cap one that is too high.'],
    },
    {
      id: 'palindrome', title: 'Palindrome check', tier: 1,
      prompt: "Write `isPalindrome(s)` that returns `true` when the text reads the same in both directions, ignoring case and anything that is not a letter or digit.\n\n`isPalindrome('A man, a plan, a canal: Panama')` → `true`",
      starter: `function isPalindrome(s) {\n  \n}\n`,
      solution: `function isPalindrome(s) {\n  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');\n  return clean === [...clean].reverse().join('');\n}\n`,
      tests: `test('simple word', () => eq(isPalindrome('level'), true));
test('ignores case and punctuation', () => eq(isPalindrome('A man, a plan, a canal: Panama'), true));
test('not a palindrome', () => eq(isPalindrome('dojo'), false));
test('empty string counts', () => eq(isPalindrome(''), true));
test('digits matter', () => eq([isPalindrome('12 21'), isPalindrome('12 31')], [true, false]));`,
      hints: ['Clean the string first: lower-case it and strip everything that is not `a-z` or `0-9`.', 'Then compare it with its reverse.'],
    },
    {
      id: 'most-frequent', title: 'Most frequent value', tier: 1,
      prompt: "Write `mostFrequent(arr)` returning the value that appears most often. On a tie, return the one that appeared **first**. An empty array returns `undefined`.",
      starter: `function mostFrequent(arr) {\n  \n}\n`,
      solution: `function mostFrequent(arr) {\n  const counts = new Map();\n  let best, bestCount = 0;\n  for (const x of arr) counts.set(x, (counts.get(x) || 0) + 1);\n  for (const [value, count] of counts) {\n    if (count > bestCount) { best = value; bestCount = count; }\n  }\n  return best;\n}\n`,
      tests: `test('clear winner', () => eq(mostFrequent(['a', 'b', 'a', 'c', 'a']), 'a'));
test('tie goes to the first seen', () => eq(mostFrequent([2, 1, 1, 2]), 2));
test('single item', () => eq(mostFrequent([7]), 7));
test('empty array', () => eq(mostFrequent([]), undefined));`,
      hints: ['Count first, then find the largest count.', 'A `Map` iterates in insertion order, so using `>` (not `>=`) keeps the earliest value on a tie.'],
    },
    {
      id: 'intersection', title: 'Intersection', tier: 1,
      prompt: "Write `intersection(a, b)` returning the values that appear in **both** arrays — each value once, in the order they appear in `a`.",
      starter: `function intersection(a, b) {\n  \n}\n`,
      solution: `function intersection(a, b) {\n  const inB = new Set(b);\n  return [...new Set(a)].filter((x) => inB.has(x));\n}\n`,
      tests: `test('common values', () => eq(intersection([1, 2, 3, 4], [4, 2, 9]), [2, 4]));
test('no duplicates in the result', () => eq(intersection([1, 1, 2], [1, 1]), [1]));
test('nothing in common', () => eq(intersection([1], [2]), []));`,
      hints: ['Looking things up in a `Set` is instant; `array.includes` rescans the array every time.', 'De-duplicate `a` with a Set too.'],
    },
    {
      id: 'omit', title: 'Omit properties', tier: 1,
      prompt: "Write `omit(obj, keys)` — the opposite of `pick`. Return a new object with every property of `obj` **except** the listed keys. The original must not change.",
      starter: `function omit(obj, keys) {\n  \n}\n`,
      solution: `function omit(obj, keys) {\n  const out = { ...obj };\n  for (const k of keys) delete out[k];\n  return out;\n}\n`,
      tests: `test('drops listed keys', () => eq(omit({ a: 1, b: 2, c: 3 }, ['b']), { a: 1, c: 3 }));
test('unknown keys are fine', () => eq(omit({ a: 1 }, ['zzz']), { a: 1 }));
test('does not mutate', () => { const o = { a: 1, password: 'x' }; omit(o, ['password']); eq(o, { a: 1, password: 'x' }); });`,
      hints: ['Copy the object with spread, then `delete` from the copy.'],
    },
    {
      id: 'sort-by', title: 'Sort by a key', tier: 1,
      prompt: "Write `sortBy(arr, key)` returning a **new** array of the objects sorted ascending by the given property. It must work for both numbers and strings, and must not reorder the original array.",
      starter: `function sortBy(arr, key) {\n  \n}\n`,
      solution: `function sortBy(arr, key) {\n  return [...arr].sort((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0));\n}\n`,
      tests: `const _people = [{ n: 'Linus', age: 29 }, { n: 'Ada', age: 36 }, { n: 'Ken', age: 9 }];
test('numbers sort numerically', () => eq(sortBy(_people, 'age').map((p) => p.age), [9, 29, 36]));
test('strings sort alphabetically', () => eq(sortBy(_people, 'n').map((p) => p.n), ['Ada', 'Ken', 'Linus']));
test('original is untouched', () => { sortBy(_people, 'age'); eq(_people[0].n, 'Linus'); });`,
      hints: ['`sort` mutates the array it is called on — copy first with `[...arr]`.', 'A comparator returns a negative number, zero, or a positive number. `a - b` only works for numbers; `<` and `>` work for both.'],
    },
    {
      id: 'this-bug', title: 'Fix: the lost this', tier: 2,
      prompt: "**Bug hunt.** `runThree(counter)` should call the counter's `increment` method three times and return the count. Instead it throws `Cannot read properties of undefined`. Fix `runThree` — leave the `Counter` class alone.",
      starter: `class Counter {\n  constructor() { this.count = 0; }\n  increment() { this.count++; }\n}\n\nfunction runThree(counter) {\n  const inc = counter.increment;\n  inc();\n  inc();\n  inc();\n  return counter.count;\n}\n`,
      solution: `class Counter {\n  constructor() { this.count = 0; }\n  increment() { this.count++; }\n}\n\nfunction runThree(counter) {\n  const inc = counter.increment.bind(counter);\n  inc();\n  inc();\n  inc();\n  return counter.count;\n}\n`,
      tests: `test('increments three times', () => eq(runThree(new Counter()), 3));
test('works on a counter that already has a count', () => { const c = new Counter(); c.count = 10; eq(runThree(c), 13); });`,
      hints: ['`this` is decided by *how a function is called*, not where it was defined. `inc()` has nothing before the dot.', '`counter.increment.bind(counter)` returns a copy permanently tied to that object. An arrow wrapper `() => counter.increment()` works too.'],
    },
    {
      id: 'deep-equal', title: 'Deep equality', tier: 2,
      prompt: "Write `deepEqual(a, b)` that returns `true` when two values are structurally the same: primitives compare with `===`, arrays and plain objects compare element by element, recursively. Key order in objects does not matter.",
      starter: `function deepEqual(a, b) {\n  \n}\n`,
      solution: `function deepEqual(a, b) {\n  if (a === b) return true;\n  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;\n  if (Array.isArray(a) !== Array.isArray(b)) return false;\n  const ka = Object.keys(a), kb = Object.keys(b);\n  if (ka.length !== kb.length) return false;\n  return ka.every((k) => Object.hasOwn(b, k) && deepEqual(a[k], b[k]));\n}\n`,
      tests: `test('primitives', () => eq([deepEqual(1, 1), deepEqual('a', 'b'), deepEqual(null, null)], [true, false, true]));
test('nested structures', () => eq(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] }), true));
test('key order is irrelevant', () => eq(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 }), true));
test('a difference deep inside', () => eq(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 3 }] }), false));
test('extra keys', () => eq(deepEqual({ a: 1 }, { a: 1, b: undefined }), false));
test('array is not an object with the same keys', () => eq(deepEqual([1], { 0: 1 }), false));
test('null is not an object', () => eq(deepEqual(null, {}), false));`,
      hints: ['Start with the easy exits: identical values are equal; anything that is not a non-null object is not.', 'Compare the number of keys, then every key recursively.'],
    },
    {
      id: 'binary-search', title: 'Binary search', tier: 2,
      prompt: "Write `binarySearch(sorted, target)` returning the index of `target` in a **sorted** array of numbers, or `-1` if it is absent. Halve the search range each step — do not scan the whole array.",
      starter: `function binarySearch(sorted, target) {\n  \n}\n`,
      solution: `function binarySearch(sorted, target) {\n  let lo = 0, hi = sorted.length - 1;\n  while (lo <= hi) {\n    const mid = (lo + hi) >> 1;\n    if (sorted[mid] === target) return mid;\n    if (sorted[mid] < target) lo = mid + 1;\n    else hi = mid - 1;\n  }\n  return -1;\n}\n`,
      tests: `const _arr = [1, 3, 5, 7, 9, 11];
test('finds each element', () => eq(_arr.map((x) => binarySearch(_arr, x)), [0, 1, 2, 3, 4, 5]));
test('absent values', () => eq([binarySearch(_arr, 0), binarySearch(_arr, 6), binarySearch(_arr, 12)], [-1, -1, -1]));
test('empty array', () => eq(binarySearch([], 1), -1));
test('is logarithmic', () => { let reads = 0; const big = new Proxy(Array.from({ length: 100000 }, (_, i) => i), { get(t, k) { if (typeof k === 'string' && /^\\d+$/.test(k)) reads++; return t[k]; } }); eq(binarySearch(big, 77777), 77777); ok(reads <= 40, 'read ' + reads + ' elements — that is a linear scan'); });`,
      hints: ['Keep two indexes, `lo` and `hi`, and look at the middle.', 'If the middle is too small, the answer is to its right: `lo = mid + 1`. Otherwise `hi = mid - 1`.', 'Stop when `lo` passes `hi`.'],
    },
    {
      id: 'roman', title: 'Roman numerals', tier: 2,
      prompt: "Write `toRoman(n)` converting an integer from 1 to 3999 to a Roman numeral. Remember the subtractive forms: 4 is `IV`, 9 is `IX`, 40 is `XL`, 90 is `XC`, 400 is `CD`, 900 is `CM`.",
      starter: `function toRoman(n) {\n  \n}\n`,
      solution: `function toRoman(n) {\n  const table = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];\n  let out = '';\n  for (const [value, symbol] of table) {\n    while (n >= value) { out += symbol; n -= value; }\n  }\n  return out;\n}\n`,
      tests: `test('small numbers', () => eq([1, 2, 3, 4, 5, 9].map(toRoman), ['I', 'II', 'III', 'IV', 'V', 'IX']));
test('tens and hundreds', () => eq([14, 40, 90, 400].map(toRoman), ['XIV', 'XL', 'XC', 'CD']));
test('years', () => eq([1994, 2024, 3999].map(toRoman), ['MCMXCIV', 'MMXXIV', 'MMMCMXCIX']));`,
      hints: ['Make a table of values from largest to smallest — and include the subtractive pairs (900, 400, 90, 40, 9, 4) as entries of their own.', 'Then repeatedly subtract the largest value that still fits, appending its symbol.'],
    },
    {
      id: 'template', title: 'Tiny template engine', tier: 2,
      prompt: "Write `render(template, data)` that replaces every `{{ name }}` placeholder with `data.name`. Spaces inside the braces are optional. A placeholder with no matching key becomes an empty string.\n\n`render('Hi {{name}}!', { name: 'Ada' })` → `'Hi Ada!'`",
      starter: `function render(template, data) {\n  \n}\n`,
      solution: `function render(template, data) {\n  return template.replace(/{{\\s*(\\w+)\\s*}}/g, (match, name) => (name in data ? String(data[name]) : ''));\n}\n`,
      tests: `test('one placeholder', () => eq(render('Hi {{name}}!', { name: 'Ada' }), 'Hi Ada!'));
test('several, with spaces', () => eq(render('{{ a }} + {{b}} = {{ sum }}', { a: 1, b: 2, sum: 3 }), '1 + 2 = 3'));
test('missing keys become empty', () => eq(render('[{{nope}}]', {}), '[]'));
test('falsy values still print', () => eq(render('{{n}} items', { n: 0 }), '0 items'));
test('no placeholders', () => eq(render('plain', { a: 1 }), 'plain'));`,
      hints: ['`string.replace(regex, fn)` calls `fn` for every match; its return value is the replacement.', 'A capture group `(\\w+)` hands the name to that function as its second argument.', 'Test with `name in data`, so a value of `0` is not treated as missing.'],
    },
    {
      id: 'promise-all', title: 'Rebuild Promise.all', tier: 3,
      prompt: "Write `promiseAll(items)` that behaves like `Promise.all` — without using it.\n\n- resolves with an array of results **in input order**\n- items that are not promises are passed through as values\n- rejects as soon as any item rejects, with that error\n- an empty array resolves to `[]`",
      starter: `function promiseAll(items) {\n  \n}\n`,
      solution: `function promiseAll(items) {\n  return new Promise((resolve, reject) => {\n    const results = new Array(items.length);\n    let pending = items.length;\n    if (pending === 0) return resolve(results);\n    items.forEach((item, i) => {\n      Promise.resolve(item).then((value) => {\n        results[i] = value;\n        if (--pending === 0) resolve(results);\n      }, reject);\n    });\n  });\n}\n`,
      tests: `test('keeps input order', async () => eq(await promiseAll([sleep(30).then(() => 'slow'), sleep(5).then(() => 'fast')]), ['slow', 'fast']));
test('passes plain values through', async () => eq(await promiseAll([1, Promise.resolve(2), 'three']), [1, 2, 'three']));
test('empty array', async () => eq(await promiseAll([]), []));
test('rejects with the first error', async () => eq((await rejects(promiseAll([sleep(5).then(() => 1), Promise.reject(new Error('boom'))]))).message, 'boom'));
test('rejects without waiting for the slow ones', async () => { const t = Date.now(); await rejects(promiseAll([sleep(300), Promise.reject(new Error('x'))])); ok(Date.now() - t < 150, 'waited for every promise before rejecting'); });
test('written by hand', () => ok(!/Promise\\.all/.test(promiseAll.toString()), 'no Promise.all'));`,
      hints: ['Return `new Promise((resolve, reject) => ...)` and keep a counter of how many are still pending.', 'Store each result at its own index — completion order is not input order.', '`Promise.resolve(item)` turns a plain value into a promise, so both cases share one code path.'],
    },
    {
      id: 'throttle', title: 'Throttle', tier: 3,
      prompt: "Write `throttle(fn, ms)`. The returned function calls `fn` **immediately** the first time, then ignores further calls until `ms` milliseconds have passed. After that the next call goes through again. (Compare with debounce, which waits for quiet.)",
      starter: `function throttle(fn, ms) {\n  \n}\n`,
      solution: `function throttle(fn, ms) {\n  let last = -Infinity;\n  return (...args) => {\n    const now = Date.now();\n    if (now - last >= ms) {\n      last = now;\n      fn(...args);\n    }\n  };\n}\n`,
      tests: `test('first call runs straight away', () => { let n = 0; throttle(() => n++, 50)(); eq(n, 1); });
test('a burst counts once', () => { let n = 0; const t = throttle(() => n++, 50); t(); t(); t(); eq(n, 1); });
test('passes arguments', () => { let got; throttle((a, b) => { got = [a, b]; }, 50)(1, 2); eq(got, [1, 2]); });
test('opens again after the wait', async () => { let n = 0; const t = throttle(() => n++, 30); t(); await sleep(60); t(); t(); eq(n, 2); });
test('separate throttles are independent', () => { let n = 0; throttle(() => n++, 50)(); throttle(() => n++, 50)(); eq(n, 2); });`,
      hints: ['Remember the time of the last call that was let through.', 'On each call, compare `Date.now()` with it. Only if at least `ms` has passed: update the time and call `fn`.'],
    },
  ],
  drills: [
    { q: 'What does this log?', code: `console.log(typeof null);`, choices: ['"null"', '"object"', '"undefined"', 'It throws'], answer: 1, why: 'A bug from the first version of JavaScript that can never be fixed without breaking the web. Check for null with `x === null`.' },
    { q: 'What does this log?', code: `console.log(0.1 + 0.2 === 0.3);`, choices: ['true', 'false', 'NaN', 'undefined'], answer: 1, why: 'Numbers are binary floating point; 0.1 + 0.2 is 0.30000000000000004. Compare money in integer cents.' },
    { q: 'What does this log?', code: `console.log([10, 9, 1].sort());`, choices: ['[1, 9, 10]', '[1, 10, 9]', '[10, 9, 1]', '[9, 10, 1]'], answer: 1, why: 'With no comparator, sort() compares elements as strings, and "10" < "9". Pass `(a, b) => a - b` for numbers.' },
    { q: 'What does this log?', code: `const a = [1, 2];\nconst b = a;\nb.push(3);\nconsole.log(a.length);`, choices: ['2', '3', 'It throws: a is const', 'undefined'], answer: 1, why: '`b = a` copies the reference, not the array. `const` only stops you re-assigning the variable, not mutating what it points to.' },
    { q: 'Which of these is NOT falsy?', choices: ['0', '""', '[]', 'NaN'], answer: 2, why: 'An empty array is an object, and every object is truthy. Test `arr.length` instead.' },
    { q: 'What does this log?', code: `console.log(1 + '2' - 1);`, choices: ['2', '"121"', '11', 'NaN'], answer: 2, why: '`+` with a string concatenates: "12". `-` only works on numbers, so "12" becomes 12, minus 1.' },
    { q: 'In what order do these print?', code: `console.log('A');\nsetTimeout(() => console.log('B'), 0);\nPromise.resolve().then(() => console.log('C'));\nconsole.log('D');`, choices: ['A B C D', 'A D B C', 'A D C B', 'A C D B'], answer: 2, why: 'Synchronous code first (A, D). Then the microtask queue — promise callbacks (C). Only then the next timer task (B).' },
    { q: 'What is `this` inside an arrow function?', choices: ['The object the function was called on', 'Whatever `this` was where the arrow was defined', 'Always `undefined`', 'The global object'], answer: 1, why: 'Arrows have no `this` of their own; they capture it from the surrounding scope. That is why they work well as callbacks inside methods.' },
    { q: 'What does this log?', code: `const o = { a: 1 };\nconst p = { ...o, a: 2, b: 3 };\nconsole.log(o.a, p.a);`, choices: ['1 2', '2 2', '1 1', '2 1'], answer: 0, why: 'Spread makes a shallow copy. Later keys win, and the original object is untouched.' },
    { q: '`==` vs `===`: what does `null == undefined` give?', choices: ['false', 'true', 'It throws', 'undefined'], answer: 1, why: 'Loose equality treats null and undefined as equal to each other (and nothing else). `x == null` is a handy check for both.' },
    { q: 'What does this log?', code: `console.log(['a', 'b', 'c'].map((x, i) => i));`, choices: ["['a', 'b', 'c']", '[0, 1, 2]', '[1, 2, 3]', '[undefined, undefined, undefined]'], answer: 1, why: 'The callback receives (item, index, array). Returning the index gives an array of indexes.' },
    { q: 'What happens here?', code: `async function f() { throw new Error('x'); }\nconst r = f();`, choices: ['It throws immediately at `f()`', '`r` is a rejected promise', '`r` is undefined', '`r` is the Error object'], answer: 1, why: 'An async function always returns a promise. A throw inside becomes a rejection, which you catch with `await` in try/catch or `.catch()`.' },
    { q: 'What does optional chaining return here?', code: `const user = {};\nconsole.log(user.address?.zip);`, choices: ['null', 'undefined', "It throws a TypeError", '""'], answer: 1, why: '`?.` short-circuits to undefined as soon as the left side is null or undefined, instead of throwing.' },
    { q: 'What does this log?', code: `console.log(0 || 'default', 0 ?? 'default');`, choices: ["'default' 'default'", "0 0", "'default' 0", "0 'default'"], answer: 2, why: '`||` falls back on any falsy value. `??` falls back only on null or undefined — the right one when 0 or "" are valid.' },
    { q: 'What does this log?', code: `let a = 1;\nlet b = a++;\nconsole.log(a, b);`, choices: ['1 1', '2 1', '2 2', '1 2'], answer: 1, why: 'Postfix `a++` returns the old value, then increments. Prefix `++a` increments first and returns the new value.' },
    { q: 'What does this log?', code: `console.log([1, 2, 3].includes('2'));`, choices: ['true', 'false', 'It throws', 'undefined'], answer: 1, why: '`includes` compares strictly, with no type conversion. The string "2" is not the number 2.' },
    { q: 'What does this log?', code: `const { a, ...rest } = { a: 1, b: 2, c: 3 };\nconsole.log(rest);`, choices: ['{ a: 1 }', '{ b: 2, c: 3 }', '[2, 3]', 'undefined'], answer: 1, why: 'In destructuring, `...rest` collects every property that was not picked out by name.' },
    { q: 'What does this log?', code: `console.log(typeof NaN);`, choices: ['"NaN"', '"number"', '"undefined"', '"object"'], answer: 1, why: 'NaN is a value of the number type meaning "not a valid number". Test for it with `Number.isNaN(x)` — `NaN === NaN` is false.' },
    { q: 'What does this log?', code: `const nums = [1, 2, 3];\nconst out = nums.forEach((n) => n * 2);\nconsole.log(out);`, choices: ['[2, 4, 6]', 'undefined', '[1, 2, 3]', '6'], answer: 1, why: '`forEach` always returns undefined; it exists for side effects. Use `map` when you want the new array.' },
    { q: 'What is the difference between `slice` and `splice` on an array?', choices: ['None', '`slice` returns a copy of a range; `splice` removes or inserts in place', '`splice` returns a copy; `slice` mutates', 'Both mutate the array'], answer: 1, why: '`slice` is safe and non-destructive. `splice` changes the original array and returns what it removed.' },
    { q: 'What does this log?', code: `console.log(parseInt('42px'), Number('42px'));`, choices: ['42 42', '42 NaN', 'NaN NaN', 'NaN 42'], answer: 1, why: '`parseInt` reads digits until it hits something else. `Number` requires the whole string to be numeric.' },
    { q: 'What does this log?', code: `function f() {\n  return\n    { ok: true };\n}\nconsole.log(f());`, choices: ['{ ok: true }', 'undefined', 'It throws a syntax error', 'null'], answer: 1, why: 'A line break after `return` ends the statement — automatic semicolon insertion. Keep the opening brace on the same line.' },
    { q: 'What does this log?', code: `console.log(x);\nvar x = 5;`, choices: ['5', 'undefined', 'ReferenceError', 'null'], answer: 1, why: '`var` declarations are hoisted and start as undefined. With `let` or `const` this line would throw a ReferenceError.' },
    { q: 'What does `Object.freeze(obj)` do to nested objects?', choices: ['Freezes them too', 'Nothing — the freeze is shallow', 'Throws an error', 'Converts them to strings'], answer: 1, why: 'Only the top level is frozen. `obj.inner.value = 1` still works unless you freeze `inner` as well.' },
    { q: 'What does this log?', code: `const a = { n: 1 };\nconst b = { n: 1 };\nconsole.log(a === b);`, choices: ['true', 'false', 'undefined', 'It throws'], answer: 1, why: 'Objects are compared by identity, not contents. Two separate objects are never `===`, however alike they look.' },
    { q: 'What does `await` do when used on a value that is not a promise?', choices: ['Throws', 'Wraps it and continues with that value on the next microtask', 'Blocks forever', 'Returns undefined'], answer: 1, why: '`await 5` gives 5. The function still pauses briefly, which is why code after an `await` never runs synchronously.' },
  ],
};
