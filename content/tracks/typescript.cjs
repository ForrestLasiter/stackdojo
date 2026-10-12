'use strict';
// Every submission is type-checked under `strict` first, then run. `typeTests`
// are appended to the learner's code for the type check only: Expect<Equal<..>>
// lines assert a type, and `// @ts-expect-error` lines assert that bad code is
// rejected (an unused directive is itself an error, so loose types fail).

module.exports = {
  id: 'typescript',
  name: 'TypeScript',
  short: 'TS',
  blurb: 'Make the compiler catch your mistakes: annotations, unions, generics, type-level tricks.',
  lang: 'typescript',
  runner: { kind: 'node', loader: 'ts', typecheck: true },
  challenges: [
    {
      id: 'annotate', title: 'Annotate a function', tier: 1,
      prompt: "This function works, but under `strict` its parameters are implicitly `any`, which is an error. Add type annotations so `add` takes two numbers and returns a number.",
      starter: `function add(a, b) {\n  return a + b;\n}\n`,
      solution: `function add(a: number, b: number): number {\n  return a + b;\n}\n`,
      typeTests: `type _A1 = Expect<Equal<ReturnType<typeof add>, number>>;
type _A2 = Expect<Equal<Parameters<typeof add>, [a: number, b: number]>>;
// @ts-expect-error
add('1', 2);`,
      tests: `test('adds', () => eq(add(2, 3), 5));`,
      hints: ['Parameters are annotated as `name: type`.', 'The return type goes after the parameter list: `function f(): number`.'],
    },
    {
      id: 'interface', title: 'Describe a shape', tier: 1,
      prompt: "Declare an `interface User` with a numeric `id`, a string `name`, and an **optional** string `email`.\n\nThen write `label(user: User): string` returning `'Name <email>'` when there is an email, and just the name when there is not.",
      starter: `// interface User ...\n\nfunction label(user) {\n  \n}\n`,
      solution: `interface User {\n  id: number;\n  name: string;\n  email?: string;\n}\n\nfunction label(user: User): string {\n  return user.email ? \`\${user.name} <\${user.email}>\` : user.name;\n}\n`,
      typeTests: `const _u1: User = { id: 1, name: 'Ada' };
const _u2: User = { id: 2, name: 'Linus', email: 'l@x.test' };
type _I1 = Expect<Equal<User['email'], string | undefined>>;
// @ts-expect-error
const _u3: User = { id: 3 };
// @ts-expect-error
const _u4: User = { id: '4', name: 'x' };`,
      tests: `test('with email', () => eq(label({ id: 1, name: 'Ada', email: 'ada@x.test' }), 'Ada <ada@x.test>'));
test('without email', () => eq(label({ id: 2, name: 'Linus' }), 'Linus'));`,
      hints: ['A `?` after a property name makes it optional: `email?: string`.', 'An optional property has the type `string | undefined`, so check it before using it.'],
    },
    {
      id: 'narrow', title: 'Narrow a union', tier: 1,
      prompt: "Write `size(x)` where `x` is a `string`, an array of strings, or `null`. Return the string's length, the array's length, or `0` for `null`. Type the parameter precisely — no `any`.",
      starter: `function size(x) {\n  \n}\n`,
      solution: `function size(x: string | string[] | null): number {\n  if (x === null) return 0;\n  return x.length;\n}\n`,
      typeTests: `type _N1 = Expect<Equal<Parameters<typeof size>[0], string | string[] | null>>;
type _N2 = Expect<Equal<ReturnType<typeof size>, number>>;`,
      tests: `test('string', () => eq(size('abc'), 3));
test('array', () => eq(size(['a', 'b']), 2));
test('null', () => eq(size(null), 0));`,
      hints: ['A union type is written with `|`.', 'After `if (x === null) return`, the compiler knows `x` is no longer null. That is narrowing.'],
    },
    {
      id: 'literal-union', title: 'Literal unions', tier: 1,
      prompt: "Declare `type Direction` as exactly the four strings `'up'`, `'down'`, `'left'`, `'right'`.\n\nWrite `move(p, d)` taking a point `{ x: number; y: number }` and a `Direction`, returning a **new** point one step in that direction. `up` decreases `y`.",
      starter: `// type Direction = ...\n\nfunction move(p, d) {\n  \n}\n`,
      solution: `type Direction = 'up' | 'down' | 'left' | 'right';\ntype Point = { x: number; y: number };\n\nfunction move(p: Point, d: Direction): Point {\n  switch (d) {\n    case 'up': return { x: p.x, y: p.y - 1 };\n    case 'down': return { x: p.x, y: p.y + 1 };\n    case 'left': return { x: p.x - 1, y: p.y };\n    case 'right': return { x: p.x + 1, y: p.y };\n  }\n}\n`,
      typeTests: `type _D1 = Expect<Equal<Direction, 'up' | 'down' | 'left' | 'right'>>;
type _D2 = Expect<Equal<ReturnType<typeof move>, { x: number; y: number }>>;
// @ts-expect-error
move({ x: 0, y: 0 }, 'north');`,
      tests: `test('all four directions', () => { const p = { x: 5, y: 5 }; eq([move(p, 'up'), move(p, 'down'), move(p, 'left'), move(p, 'right')], [{ x: 5, y: 4 }, { x: 5, y: 6 }, { x: 4, y: 5 }, { x: 6, y: 5 }]); });
test('returns a new point', () => { const p = { x: 0, y: 0 }; move(p, 'up'); eq(p, { x: 0, y: 0 }); });`,
      hints: ["A string literal is a type: `'up'` only accepts the string \"up\".", 'A `switch` over every member of the union needs no `default` — the compiler can see it is exhaustive.'],
    },
    {
      id: 'generic-first', title: 'Your first generic', tier: 1,
      prompt: "Write a generic `first<T>(items)` that returns the first element of an array, or `undefined` if it is empty. The return type must follow the element type: `first([1, 2])` is `number | undefined`, `first(['a'])` is `string | undefined`.",
      starter: `function first(items: any[]): any {\n  return items[0];\n}\n`,
      solution: `function first<T>(items: T[]): T | undefined {\n  return items[0];\n}\n`,
      typeTests: `const _f1 = first([1, 2, 3]);
type _F1 = Expect<Equal<typeof _f1, number | undefined>>;
const _f2 = first(['a']);
type _F2 = Expect<Equal<typeof _f2, string | undefined>>;`,
      tests: `test('first element', () => eq(first([7, 8]), 7));
test('empty array', () => eq(first([]), undefined));`,
      hints: ['`any` switches the checker off. A type parameter `<T>` keeps the link between input and output.', 'Declare it after the function name: `function first<T>(items: T[])`.'],
    },
    {
      id: 'as-const', title: 'Derive a type from data', tier: 1,
      prompt: "Declare a constant `ROLES` holding `'admin'`, `'editor'`, `'viewer'` so that TypeScript keeps the exact strings, not just `string[]`.\n\nThen derive `type Role` **from `ROLES`** (do not retype the strings), and write `isRole(x: string): x is Role`.",
      starter: `const ROLES = ['admin', 'editor', 'viewer'];\n\ntype Role = string;\n\nfunction isRole(x: string): boolean {\n  return ROLES.includes(x);\n}\n`,
      solution: `const ROLES = ['admin', 'editor', 'viewer'] as const;\n\ntype Role = (typeof ROLES)[number];\n\nfunction isRole(x: string): x is Role {\n  return (ROLES as readonly string[]).includes(x);\n}\n`,
      typeTests: `type _R1 = Expect<Equal<Role, 'admin' | 'editor' | 'viewer'>>;
type _R2 = Expect<Equal<typeof ROLES, readonly ['admin', 'editor', 'viewer']>>;
declare const _s: string;
if (isRole(_s)) { type _R3 = Expect<Equal<typeof _s, Role>>; }`,
      tests: `test('accepts a role', () => eq(isRole('editor'), true));
test('rejects anything else', () => eq(isRole('root'), false));`,
      hints: ['`as const` freezes an array literal into a readonly tuple of literal types.', '`(typeof ROLES)[number]` means "the type of any element of ROLES".', '`includes` on a readonly tuple of literals only accepts those literals; widen the array to `readonly string[]` for the lookup.'],
    },
    {
      id: 'zip', title: 'Typed tuples', tier: 1,
      prompt: "Write `zip(a, b)` that pairs up two arrays element by element, stopping at the shorter one. With `A[]` and `B[]` in, the result type must be an array of `[A, B]` tuples.",
      starter: `function zip(a: any[], b: any[]): any[] {\n  \n}\n`,
      solution: `function zip<A, B>(a: A[], b: B[]): [A, B][] {\n  const out: [A, B][] = [];\n  for (let i = 0; i < Math.min(a.length, b.length); i++) out.push([a[i], b[i]]);\n  return out;\n}\n`,
      typeTests: `const _z = zip([1, 2], ['a', 'b']);
type _Z1 = Expect<Equal<typeof _z, [number, string][]>>;`,
      tests: `test('pairs elements', () => eq(zip([1, 2], ['a', 'b']), [[1, 'a'], [2, 'b']]));
test('stops at the shorter', () => eq(zip([1, 2, 3], ['a']), [[1, 'a']]));`,
      hints: ['Two type parameters: `function zip<A, B>(...)`.', 'A tuple type is written `[A, B]`; an array of them is `[A, B][]`.'],
    },
    {
      id: 'unknown', title: 'unknown, not any', tier: 2,
      prompt: "Write `toNumber(x: unknown): number`.\n\n- a number is returned as-is\n- a string is parsed with `Number()`; if the result is `NaN`, throw\n- anything else throws\n\nThrow `new Error('not a number')`. The parameter must stay `unknown`.",
      starter: `function toNumber(x: any): number {\n  return x;\n}\n`,
      solution: `function toNumber(x: unknown): number {\n  if (typeof x === 'number') return x;\n  if (typeof x === 'string') {\n    const n = Number(x);\n    if (!Number.isNaN(n)) return n;\n  }\n  throw new Error('not a number');\n}\n`,
      typeTests: `type _U1 = Expect<Equal<Parameters<typeof toNumber>[0], unknown>>;`,
      tests: `test('numbers pass through', () => eq(toNumber(4.5), 4.5));
test('numeric strings parse', () => eq(toNumber('42'), 42));
test('garbage strings throw', () => eq(throws(() => toNumber('abc')).message, 'not a number'));
test('other types throw', () => { throws(() => toNumber(null)); throws(() => toNumber({})); });`,
      hints: ['`unknown` accepts anything but lets you do nothing with it until you narrow.', '`typeof x === "string"` narrows `unknown` to `string` inside that branch.'],
    },
    {
      id: 'shapes', title: 'Discriminated unions', tier: 2,
      prompt: "Declare `type Shape` as a union of three object types, told apart by a `kind` field:\n\n- `{ kind: 'circle'; radius: number }`\n- `{ kind: 'square'; side: number }`\n- `{ kind: 'rect'; width: number; height: number }`\n\nWrite `area(shape: Shape): number`. Use `Math.PI` for the circle.",
      starter: `// type Shape = ...\n\nfunction area(shape) {\n  \n}\n`,
      solution: `type Shape =\n  | { kind: 'circle'; radius: number }\n  | { kind: 'square'; side: number }\n  | { kind: 'rect'; width: number; height: number };\n\nfunction area(shape: Shape): number {\n  switch (shape.kind) {\n    case 'circle': return Math.PI * shape.radius ** 2;\n    case 'square': return shape.side ** 2;\n    case 'rect': return shape.width * shape.height;\n  }\n}\n`,
      typeTests: `type _S1 = Expect<Equal<Shape['kind'], 'circle' | 'square' | 'rect'>>;
type _S2 = Expect<Equal<Extract<Shape, { kind: 'rect' }>, { kind: 'rect'; width: number; height: number }>>;
// @ts-expect-error
area({ kind: 'circle', side: 2 });
// @ts-expect-error
area({ kind: 'triangle' });`,
      tests: `test('circle', () => near(area({ kind: 'circle', radius: 2 }), Math.PI * 4));
test('square', () => eq(area({ kind: 'square', side: 3 }), 9));
test('rect', () => eq(area({ kind: 'rect', width: 2, height: 5 }), 10));`,
      hints: ['Each member carries a literal `kind`. Checking it tells the compiler which member you are holding.', 'Inside `case "circle":` the type is narrowed, so `shape.radius` is allowed and `shape.side` is not.'],
    },
    {
      id: 'keyof', title: 'keyof and indexed access', tier: 2,
      prompt: "Write `prop(obj, key)` that returns `obj[key]`. It must be generic so that:\n\n- `key` can only be a real key of `obj`\n- the return type is the type of *that* property\n\n`prop({ name: 'Ada', age: 36 }, 'age')` has type `number`.",
      starter: `function prop(obj: any, key: string): any {\n  return obj[key];\n}\n`,
      solution: `function prop<T, K extends keyof T>(obj: T, key: K): T[K] {\n  return obj[key];\n}\n`,
      typeTests: `const _p = { name: 'Ada', age: 36 };
const _p1 = prop(_p, 'age');
type _P1 = Expect<Equal<typeof _p1, number>>;
const _p2 = prop(_p, 'name');
type _P2 = Expect<Equal<typeof _p2, string>>;
// @ts-expect-error
prop(_p, 'email');`,
      tests: `test('reads the property', () => eq(prop({ a: 1, b: 'x' }, 'b'), 'x'));`,
      hints: ['`keyof T` is the union of T\'s property names.', '`K extends keyof T` constrains K to those names; `T[K]` is the type stored under that name.'],
    },
    {
      id: 'partial', title: 'Partial updates', tier: 2,
      prompt: "Write `patch(obj, changes)` returning a **new** object with `changes` applied on top of `obj`. `changes` may contain any subset of `obj`'s properties, with matching types — and nothing else. The result has the same type as `obj`.",
      starter: `function patch(obj: any, changes: any): any {\n  \n}\n`,
      solution: `function patch<T extends object>(obj: T, changes: Partial<T>): T {\n  return { ...obj, ...changes };\n}\n`,
      typeTests: `const _o = { id: 1, title: 'a', done: false };
const _o1 = patch(_o, { done: true });
type _PA1 = Expect<Equal<typeof _o1, { id: number; title: string; done: boolean }>>;
// @ts-expect-error
patch(_o, { done: 'yes' });
// @ts-expect-error
patch(_o, { nope: 1 });`,
      tests: `test('applies changes', () => eq(patch({ id: 1, done: false }, { done: true }), { id: 1, done: true }));
test('does not mutate', () => { const o = { a: 1 }; patch(o, { a: 2 }); eq(o, { a: 1 }); });`,
      hints: ['`Partial<T>` is T with every property made optional.', 'Object spread copies: later spreads overwrite earlier ones.'],
    },
    {
      id: 'type-guard', title: 'Write a type guard', tier: 2,
      prompt: "Declare `interface Cat { name: string; meow(): string }`.\n\nWrite a type guard `isCat(x: unknown): x is Cat` that is true only for non-null objects with a string `name` and a function `meow`.\n\nThen write `cats(xs: unknown[]): Cat[]` that keeps only the cats.",
      starter: `interface Cat { name: string; meow(): string }\n\nfunction isCat(x: unknown): boolean {\n  return false;\n}\n\nfunction cats(xs: unknown[]) {\n  return xs.filter(isCat);\n}\n`,
      solution: `interface Cat { name: string; meow(): string }\n\nfunction isCat(x: unknown): x is Cat {\n  if (typeof x !== 'object' || x === null) return false;\n  const o = x as Record<string, unknown>;\n  return typeof o.name === 'string' && typeof o.meow === 'function';\n}\n\nfunction cats(xs: unknown[]): Cat[] {\n  return xs.filter(isCat);\n}\n`,
      typeTests: `const _c = cats([]);
type _C1 = Expect<Equal<typeof _c, Cat[]>>;
declare const _x: unknown;
if (isCat(_x)) { type _C2 = Expect<Equal<typeof _x, Cat>>; }`,
      tests: `const tom = { name: 'Tom', meow: () => 'meow' };
test('accepts a cat', () => eq(isCat(tom), true));
test('rejects near-misses', () => eq([isCat(null), isCat('cat'), isCat({ name: 'x' }), isCat({ name: 1, meow() {} })], [false, false, false, false]));
test('filters a mixed list', () => eq(cats([1, tom, null, { name: 'no' }]), [tom]));`,
      hints: ['The return type `x is Cat` is what makes a boolean function a type guard.', '`Array.prototype.filter` has an overload that understands type guards, so `xs.filter(isCat)` is `Cat[]`.', '`typeof null` is "object" — rule it out.'],
    },
    {
      id: 'constraint', title: 'Generic constraints', tier: 2,
      prompt: "Write `longest(a, b)` returning whichever argument has the greater `length` (return `a` on a tie). It must accept anything with a numeric `length` — strings, arrays — and reject things without one. The return type is the argument type.",
      starter: `function longest(a: any, b: any): any {\n  \n}\n`,
      solution: `function longest<T extends { length: number }>(a: T, b: T): T {\n  return b.length > a.length ? b : a;\n}\n`,
      typeTests: `const _l1 = longest([1, 2], [3]);
type _L1 = Expect<Equal<typeof _l1, number[]>>;
const _l2: string = longest('ab', 'abc');
// @ts-expect-error
longest(1, 2);`,
      tests: `test('strings', () => eq(longest('ab', 'abc'), 'abc'));
test('arrays', () => eq(longest([1, 2], [3]), [1, 2]));
test('tie returns the first', () => eq(longest('aa', 'bb'), 'aa'));`,
      hints: ['`<T extends { length: number }>` means "any T, as long as it has a numeric length".'],
    },
    {
      id: 'result', title: 'A Result type', tier: 2,
      prompt: "Declare `type Result<T>` as a union of `{ ok: true; value: T }` and `{ ok: false; error: string }`.\n\nWrite `parseJson(text: string): Result<unknown>` — never throws; on bad JSON, `error` is `'invalid json'`.\n\nWrite `unwrap<T>(r: Result<T>): T` — returns the value, or throws `new Error(r.error)`.",
      starter: `// type Result<T> = ...\n\nfunction parseJson(text: string) {\n  \n}\n\nfunction unwrap(r) {\n  \n}\n`,
      solution: `type Result<T> = { ok: true; value: T } | { ok: false; error: string };\n\nfunction parseJson(text: string): Result<unknown> {\n  try {\n    return { ok: true, value: JSON.parse(text) };\n  } catch {\n    return { ok: false, error: 'invalid json' };\n  }\n}\n\nfunction unwrap<T>(r: Result<T>): T {\n  if (r.ok) return r.value;\n  throw new Error(r.error);\n}\n`,
      typeTests: `type _RS1 = Expect<Equal<Result<number>, { ok: true; value: number } | { ok: false; error: string }>>;
type _RS2 = Expect<Equal<ReturnType<typeof parseJson>, Result<unknown>>>;
const _rs = unwrap({ ok: true, value: 5 } as Result<number>);
type _RS3 = Expect<Equal<typeof _rs, number>>;`,
      tests: `test('good json', () => eq(parseJson('{"a":1}'), { ok: true, value: { a: 1 } }));
test('bad json does not throw', () => eq(parseJson('{oops'), { ok: false, error: 'invalid json' }));
test('unwrap returns the value', () => eq(unwrap({ ok: true, value: 7 }), 7));
test('unwrap throws the error', () => eq(throws(() => unwrap({ ok: false, error: 'boom' })).message, 'boom'));`,
      hints: ['The boolean literal `ok` is the discriminant. After `if (r.ok)`, `r.value` exists; otherwise `r.error` does.', 'A `catch` clause may omit its variable: `catch { ... }`.'],
    },
    {
      id: 'pluck', title: 'Pluck a column', tier: 2,
      prompt: "Write `pluck(items, key)` that returns an array of `item[key]` for every item. `key` must be a real property of the items, and the result must be typed as an array of that property's type.",
      starter: `function pluck(items: any[], key: string): any[] {\n  return items.map((i) => i[key]);\n}\n`,
      solution: `function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {\n  return items.map((i) => i[key]);\n}\n`,
      typeTests: `const _rows = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }];
const _ids = pluck(_rows, 'id');
type _PL1 = Expect<Equal<typeof _ids, number[]>>;
const _names = pluck(_rows, 'name');
type _PL2 = Expect<Equal<typeof _names, string[]>>;
// @ts-expect-error
pluck(_rows, 'missing');`,
      tests: `test('plucks values', () => eq(pluck([{ n: 1 }, { n: 2 }], 'n'), [1, 2]));`,
      hints: ['Same two-parameter pattern as `prop`: `T` for the item, `K extends keyof T` for the key.', '`T[K][]` reads as "array of whatever T stores under K".'],
    },
    {
      id: 'record', title: 'Record and counting', tier: 2,
      prompt: "Write `tally(items)` taking an array of strings and returning how many times each appears. When called with a literal union, the result's keys must be that union: `tally<'a' | 'b'>([...])` returns `Record<'a' | 'b', number>`.",
      starter: `function tally(items: string[]): any {\n  \n}\n`,
      solution: `function tally<T extends string>(items: T[]): Record<T, number> {\n  const out = {} as Record<T, number>;\n  for (const i of items) out[i] = (out[i] ?? 0) + 1;\n  return out;\n}\n`,
      typeTests: `type Vote = 'yes' | 'no';
declare const _votes: Vote[];
const _t = tally(_votes);
type _T1 = Expect<Equal<typeof _t, Record<Vote, number>>>;
// @ts-expect-error
tally([1, 2]);`,
      tests: `test('counts', () => eq(tally(['a', 'b', 'a']), { a: 2, b: 1 }));
test('empty', () => eq(tally([]), {}));`,
      hints: ['`Record<K, V>` is an object type with keys K and values V.', 'Starting from `{}` needs an assertion: `{} as Record<T, number>` — you are promising to fill it in.'],
    },
    {
      id: 'queue-class', title: 'A generic class', tier: 2,
      prompt: "Write `class Queue<T>` with a **private** items array and:\n\n- `enqueue(item: T): void`\n- `dequeue(): T | undefined` (first in, first out)\n- a readonly `length` getter",
      starter: `class Queue {\n  \n}\n`,
      solution: `class Queue<T> {\n  private items: T[] = [];\n  enqueue(item: T): void { this.items.push(item); }\n  dequeue(): T | undefined { return this.items.shift(); }\n  get length(): number { return this.items.length; }\n}\n`,
      typeTests: `const _q = new Queue<number>();
_q.enqueue(1);
const _q1 = _q.dequeue();
type _Q1 = Expect<Equal<typeof _q1, number | undefined>>;
// @ts-expect-error
_q.enqueue('two');
// @ts-expect-error
_q.items;
// @ts-expect-error
_q.length = 5;`,
      tests: `test('first in, first out', () => { const q = new Queue(); q.enqueue('a'); q.enqueue('b'); eq([q.dequeue(), q.dequeue(), q.dequeue()], ['a', 'b', undefined]); });
test('length', () => { const q = new Queue(); q.enqueue(1); q.enqueue(2); eq(q.length, 2); });`,
      hints: ['The type parameter goes on the class: `class Queue<T>`.', '`private items: T[] = []` hides the array from outside code at compile time.', 'A getter with no setter is read-only.'],
    },
    {
      id: 'my-pick', title: 'Rebuild Pick', tier: 2,
      prompt: "**Type-only challenge.** Without using the built-in `Pick`, write `MyPick<T, K>`: an object type containing only the properties of `T` whose names are in `K`. `K` must be limited to keys of `T`.",
      starter: `type MyPick<T, K> = any;\n`,
      solution: `type MyPick<T, K extends keyof T> = { [P in K]: T[P] };\n`,
      typeTests: `interface Todo { title: string; done: boolean; due: number }
type _MP1 = Expect<Equal<MyPick<Todo, 'title'>, { title: string }>>;
type _MP2 = Expect<Equal<MyPick<Todo, 'title' | 'done'>, { title: string; done: boolean }>>;
// @ts-expect-error
type _MP3 = MyPick<Todo, 'nope'>;`,
      tests: ``,
      hints: ['A mapped type loops over a union of keys: `{ [P in K]: ... }`.', 'Inside the loop, `T[P]` is the type of that property.', 'Constrain K with `K extends keyof T` so bad keys are rejected.'],
    },
    {
      id: 'nullable', title: 'Mapped types', tier: 2,
      prompt: "**Type-only challenge.** Write two mapped types:\n\n- `Nullable<T>` — every property may also be `null`\n- `Mutable<T>` — removes `readonly` from every property",
      starter: `type Nullable<T> = T;\ntype Mutable<T> = T;\n`,
      solution: `type Nullable<T> = { [K in keyof T]: T[K] | null };\ntype Mutable<T> = { -readonly [K in keyof T]: T[K] };\n`,
      typeTests: `type _NU1 = Expect<Equal<Nullable<{ a: string; b: number }>, { a: string | null; b: number | null }>>;
type _MU1 = Expect<Equal<Mutable<{ readonly a: string; readonly b: number }>, { a: string; b: number }>>;
type _MU2 = Expect<Equal<Mutable<readonly [1, 2]>, [1, 2]>>;`,
      tests: ``,
      hints: ['`{ [K in keyof T]: T[K] }` copies a type unchanged. Edit the right-hand side to change every property.', 'Modifiers can be removed with a minus sign: `-readonly`, `-?`.'],
    },
    {
      id: 'infer', title: 'infer', tier: 3,
      prompt: "**Type-only challenge.** Using conditional types and `infer`, write:\n\n- `ElementOf<T>` — the element type of an array (`never` for non-arrays)\n- `MyReturn<F>` — the return type of a function, without using `ReturnType`\n- `MyAwaited<T>` — unwraps `Promise`s all the way down; non-promises are returned unchanged",
      starter: `type ElementOf<T> = any;\ntype MyReturn<F> = any;\ntype MyAwaited<T> = any;\n`,
      solution: `type ElementOf<T> = T extends readonly (infer E)[] ? E : never;\ntype MyReturn<F> = F extends (...args: any[]) => infer R ? R : never;\ntype MyAwaited<T> = T extends Promise<infer U> ? MyAwaited<U> : T;\n`,
      typeTests: `type _E1 = Expect<Equal<ElementOf<string[]>, string>>;
type _E2 = Expect<Equal<ElementOf<readonly (number | boolean)[]>, number | boolean>>;
type _E3 = Expect<Equal<ElementOf<string>, never>>;
type _MR1 = Expect<Equal<MyReturn<() => number>, number>>;
type _MR2 = Expect<Equal<MyReturn<(a: string, b: number) => string[]>, string[]>>;
type _AW1 = Expect<Equal<MyAwaited<Promise<string>>, string>>;
type _AW2 = Expect<Equal<MyAwaited<Promise<Promise<number>>>, number>>;
type _AW3 = Expect<Equal<MyAwaited<boolean>, boolean>>;`,
      tests: ``,
      hints: ['A conditional type: `T extends Something ? A : B`.', '`infer E` inside the `extends` clause captures part of the matched type into a new type variable.', 'A type alias may refer to itself — that is how you unwrap nested promises.'],
    },
    {
      id: 'getters', title: 'Template literal keys', tier: 3,
      prompt: "**Type-only challenge.** Write `Getters<T>`: for each property `name: X` in `T`, the result has a method `getName: () => X`. The first letter of the key is capitalised.\n\n`Getters<{ name: string; age: number }>` → `{ getName: () => string; getAge: () => number }`",
      starter: `type Getters<T> = any;\n`,
      solution: `type Getters<T> = { [K in keyof T & string as \`get\${Capitalize<K>}\`]: () => T[K] };\n`,
      typeTests: `type _G1 = Expect<Equal<Getters<{ name: string; age: number }>, { getName: () => string; getAge: () => number }>>;
type _G2 = Expect<Equal<Getters<{}>, {}>>;`,
      tests: ``,
      hints: ['Mapped types can rename keys with `as`: `{ [K in keyof T as NewName]: ... }`.', 'Template literal types build strings at the type level: `` `get${...}` ``.', '`Capitalize<S>` is built in. Keys may be symbols or numbers, so intersect with `string` first.'],
    },
    {
      id: 'deep-readonly', title: 'Boss: DeepReadonly', tier: 3,
      prompt: "**Type-only boss.** Write `DeepReadonly<T>`: every property is `readonly`, recursively, through nested objects and arrays. Functions and primitives are left as they are.",
      starter: `type DeepReadonly<T> = Readonly<T>;\n`,
      solution: `type DeepReadonly<T> = T extends (...args: any[]) => any\n  ? T\n  : T extends object\n    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }\n    : T;\n`,
      typeTests: `type _In = { a: string; b: { c: number; d: { e: boolean } }; list: { id: number }[]; fn: () => void };
type _Out = DeepReadonly<_In>;
type _DR1 = Expect<Equal<_Out['b'], { readonly c: number; readonly d: { readonly e: boolean } }>>;
type _DR2 = Expect<Equal<_Out['fn'], () => void>>;
type _DR3 = Expect<Equal<_Out['list'], readonly { readonly id: number }[]>>;
declare const _dr: _Out;
// @ts-expect-error
_dr.a = 'x';
// @ts-expect-error
_dr.b.d.e = true;
// @ts-expect-error
_dr.list[0].id = 2;
// @ts-expect-error
_dr.list.push({ id: 1 });`,
      tests: ``,
      hints: ['`Readonly<T>` only goes one level deep. You need a mapped type that applies *itself* to each property.', 'Functions are objects too — peel them off first with a conditional type so they are not mangled.', 'A mapped type over an array type produces an array type, so arrays need no special case.'],
    },
    {
      id: 'typed-emitter', title: 'Boss: typed event emitter', tier: 3,
      prompt: "Write `class TypedEmitter<E>` where `E` maps event names to **argument tuples**, e.g. `{ login: [user: string]; move: [x: number, y: number] }`.\n\n- `on(event, listener)` — the listener's parameters must match that event's tuple\n- `emit(event, ...args)` — the arguments must match too\n\nMisspelled events and wrong argument types must be compile errors.",
      starter: `class TypedEmitter {\n  on(event: string, listener: Function) {}\n  emit(event: string, ...args: any[]) {}\n}\n`,
      solution: `class TypedEmitter<E extends Record<string, unknown[]>> {\n  private listeners: { [K in keyof E]?: ((...args: E[K]) => void)[] } = {};\n  on<K extends keyof E>(event: K, listener: (...args: E[K]) => void): void {\n    (this.listeners[event] ??= []).push(listener);\n  }\n  emit<K extends keyof E>(event: K, ...args: E[K]): void {\n    for (const l of this.listeners[event] ?? []) l(...args);\n  }\n}\n`,
      typeTests: `type _Ev = { login: [user: string]; move: [x: number, y: number]; quit: [] };
const _em = new TypedEmitter<_Ev>();
_em.on('move', (x, y) => { type _TE1 = Expect<Equal<[typeof x, typeof y], [number, number]>>; });
_em.on('login', (user) => { type _TE2 = Expect<Equal<typeof user, string>>; });
_em.emit('move', 1, 2);
_em.emit('quit');
// @ts-expect-error
_em.emit('move', 1);
// @ts-expect-error
_em.emit('login', 42);
// @ts-expect-error
_em.emit('logout');
// @ts-expect-error
_em.on('login', (n: number) => {});`,
      tests: `test('delivers arguments', () => { const e = new TypedEmitter(); let got; e.on('move', (x, y) => { got = [x, y]; }); e.emit('move', 3, 4); eq(got, [3, 4]); });
test('multiple listeners', () => { const e = new TypedEmitter(); let n = 0; e.on('a', () => n++); e.on('a', () => n++); e.emit('a'); eq(n, 2); });
test('unknown events are a no-op', () => { new TypedEmitter().emit('nothing'); });`,
      hints: ['Make each method generic over the event name: `on<K extends keyof E>(event: K, ...)`.', 'With `K` known, `E[K]` is that event\'s argument tuple. A rest parameter can be typed with a tuple: `...args: E[K]`.', 'Constrain the class parameter: `E extends Record<string, unknown[]>`.'],
    },
    {
      id: 'readonly-param', title: 'Promise not to mutate', tier: 1,
      prompt: "Write `total(items)` returning the sum of an array of numbers. Type the parameter as a **readonly** array, so the signature itself promises callers that their array will not be changed — and so frozen `as const` arrays can be passed in.",
      starter: `function total(items: number[]): number {\n  let sum = 0;\n  for (const n of items) sum += n;\n  return sum;\n}\n`,
      solution: `function total(items: readonly number[]): number {\n  let sum = 0;\n  for (const n of items) sum += n;\n  return sum;\n}\n`,
      typeTests: `type _RO1 = Expect<Equal<Parameters<typeof total>[0], readonly number[]>>;
const _frozen = [1, 2, 3] as const;
total(_frozen);`,
      tests: `test('sums', () => eq(total([1, 2, 3]), 6));
test('empty', () => eq(total([]), 0));`,
      hints: ['`readonly number[]` (or `ReadonlyArray<number>`) removes `push`, `sort` and friends from the type.', 'A mutable array can always be passed where a readonly one is expected — but not the other way round.'],
    },
    {
      id: 'keyof-typeof', title: 'Types from an object', tier: 1,
      prompt: "Given the `COLORS` object, derive `type ColorName` from it — the union of its keys — without typing the names again. Then write `hex(name: ColorName): string` returning the colour's value.",
      starter: `const COLORS = {\n  red: '#ff0000',\n  green: '#00ff00',\n  blue: '#0000ff',\n};\n\ntype ColorName = string;\n\nfunction hex(name: ColorName): string {\n  return '';\n}\n`,
      solution: `const COLORS = {\n  red: '#ff0000',\n  green: '#00ff00',\n  blue: '#0000ff',\n};\n\ntype ColorName = keyof typeof COLORS;\n\nfunction hex(name: ColorName): string {\n  return COLORS[name];\n}\n`,
      typeTests: `type _KT1 = Expect<Equal<ColorName, 'red' | 'green' | 'blue'>>;
// @ts-expect-error
hex('purple');`,
      tests: `test('looks up a colour', () => eq(hex('green'), '#00ff00'));`,
      hints: ['`typeof COLORS` is the *type* of the object; `keyof` of that is the union of its property names.', 'Add a colour to the object and the type updates by itself.'],
    },
    {
      id: 'record-prices', title: 'Record over a union', tier: 1,
      prompt: "Declare `type Size` as `'S' | 'M' | 'L'`, and a constant `PRICES` typed `Record<Size, number>` with the prices 8, 10 and 12. Then write `cost(size: Size, quantity: number): number`.\n\nBecause of the `Record` type, forgetting a size in `PRICES` is a compile error.",
      starter: `// type Size = ...\n\nconst PRICES = {};\n\nfunction cost(size, quantity) {\n  \n}\n`,
      solution: `type Size = 'S' | 'M' | 'L';\n\nconst PRICES: Record<Size, number> = { S: 8, M: 10, L: 12 };\n\nfunction cost(size: Size, quantity: number): number {\n  return PRICES[size] * quantity;\n}\n`,
      typeTests: `type _RP1 = Expect<Equal<Size, 'S' | 'M' | 'L'>>;
type _RP2 = Expect<Equal<typeof PRICES, Record<Size, number>>>;
// @ts-expect-error
cost('XL', 1);`,
      tests: `test('prices', () => eq([cost('S', 1), cost('M', 2), cost('L', 3)], [8, 20, 36]));`,
      hints: ['`Record<Size, number>` means "an object with exactly the keys of Size, each holding a number".', 'Annotate the constant: `const PRICES: Record<Size, number> = { ... }`.'],
    },
    {
      id: 'predicate', title: 'Function types', tier: 2,
      prompt: "Declare a generic type alias `Predicate<T>` for a function that takes a `T` and returns a boolean. Then write `countWhere<T>(items, test)` returning how many items pass the test. The callback's parameter type must be inferred from the array.",
      starter: `// type Predicate<T> = ...\n\nfunction countWhere(items: any[], test: any): number {\n  \n}\n`,
      solution: `type Predicate<T> = (item: T) => boolean;\n\nfunction countWhere<T>(items: T[], test: Predicate<T>): number {\n  return items.filter(test).length;\n}\n`,
      typeTests: `type _PR1 = Expect<Equal<Predicate<string>, (item: string) => boolean>>;
countWhere(['a', 'bb'], (s) => { type _PR2 = Expect<Equal<typeof s, string>>; return s.length > 1; });
// @ts-expect-error
countWhere([1, 2], (s: string) => s.length > 1);`,
      tests: `test('counts matches', () => eq(countWhere([1, 2, 3, 4], (n) => n % 2 === 0), 2));
test('none', () => eq(countWhere([], () => true), 0));`,
      hints: ['A function type is written like an arrow function: `(item: T) => boolean`.', 'With `items: T[]` and `test: Predicate<T>`, TypeScript works out `T` from the array and then types the callback for you.'],
    },
    {
      id: 'overloads', title: 'Overloads', tier: 2,
      prompt: "Write `flip`, which turns a string into a number and a number into a string — and whose **return type follows the argument**: `flip('5')` is typed `number`, `flip(5)` is typed `string`. Use function overloads.",
      starter: `function flip(value: string | number): string | number {\n  return typeof value === 'string' ? Number(value) : String(value);\n}\n`,
      solution: `function flip(value: string): number;\nfunction flip(value: number): string;\nfunction flip(value: string | number): string | number {\n  return typeof value === 'string' ? Number(value) : String(value);\n}\n`,
      typeTests: `const _fl1 = flip('5');
type _FL1 = Expect<Equal<typeof _fl1, number>>;
const _fl2 = flip(5);
type _FL2 = Expect<Equal<typeof _fl2, string>>;
// @ts-expect-error
flip(true);`,
      tests: `test('string to number', () => eq(flip('42'), 42));
test('number to string', () => eq(flip(42), '42'));`,
      hints: ['Write one signature per case *above* the implementation, each ending in a semicolon.', 'Callers only see the overload signatures; the implementation signature underneath must be compatible with all of them.'],
    },
    {
      id: 'variadic-tuple', title: 'Keep the tuple', tier: 2,
      prompt: "Write `tuple(...args)` that returns its arguments as an array — typed as a **tuple** that remembers each position's type, not as a loose array. `tuple(1, 'a', true)` must have the type `[number, string, boolean]`.",
      starter: `function tuple(...args: unknown[]): unknown[] {\n  return args;\n}\n`,
      solution: `function tuple<T extends unknown[]>(...args: T): T {\n  return args;\n}\n`,
      typeTests: `const _tu = tuple(1, 'a', true);
type _TU1 = Expect<Equal<typeof _tu, [number, string, boolean]>>;
const _tu0 = tuple();
type _TU2 = Expect<Equal<typeof _tu0, []>>;`,
      tests: `test('returns the arguments', () => eq(tuple(1, 'a'), [1, 'a']));`,
      hints: ['Make the whole rest parameter generic: `<T extends unknown[]>(...args: T)`.', 'When a rest parameter has a generic array type, TypeScript infers a tuple for it.'],
    },
    {
      id: 'group-by-typed', title: 'A typed groupBy', tier: 2,
      prompt: "Write `groupBy(items, keyOf)` where `keyOf` returns a string key for each item. The result maps each key to the array of items with that key — and when the keys are a literal union, the result's keys are exactly that union.",
      starter: `function groupBy(items: any[], keyOf: (item: any) => string): any {\n  \n}\n`,
      solution: `function groupBy<T, K extends string>(items: T[], keyOf: (item: T) => K): Record<K, T[]> {\n  const out = {} as Record<K, T[]>;\n  for (const item of items) {\n    (out[keyOf(item)] ??= []).push(item);\n  }\n  return out;\n}\n`,
      typeTests: `const _gb = groupBy([1, 2, 3], (n): 'odd' | 'even' => (n % 2 ? 'odd' : 'even'));
type _GB1 = Expect<Equal<typeof _gb, Record<'odd' | 'even', number[]>>>;
// @ts-expect-error
groupBy([1, 2], (n) => n);`,
      tests: `test('groups', () => eq(groupBy([1, 2, 3, 4], (n) => (n % 2 ? 'odd' : 'even')), { odd: [1, 3], even: [2, 4] }));
test('empty', () => eq(groupBy([], () => 'x'), {}));`,
      hints: ['Two type parameters: `T` for the items and `K extends string` for the key.', 'The result is `Record<K, T[]>`.', '`(out[k] ??= []).push(item)` creates the array the first time a key is seen.'],
    },
    {
      id: 'never', title: 'Exhaustiveness with never', tier: 2,
      prompt: "Write `assertNever(value: never): never`, which throws `new Error('unexpected: ' + value)`. Then use it as the `default` branch of `describe(status)`, so that adding a new member to `Status` later becomes a **compile error** until the switch handles it.\n\n`describe` returns `'Waiting'`, `'In progress'` or `'Finished'`.",
      starter: `type Status = 'todo' | 'doing' | 'done';\n\nfunction assertNever(value: any): any {\n  \n}\n\nfunction describe(status: Status): string {\n  switch (status) {\n    case 'todo': return 'Waiting';\n    default: return '';\n  }\n}\n`,
      solution: `type Status = 'todo' | 'doing' | 'done';\n\nfunction assertNever(value: never): never {\n  throw new Error('unexpected: ' + value);\n}\n\nfunction describe(status: Status): string {\n  switch (status) {\n    case 'todo': return 'Waiting';\n    case 'doing': return 'In progress';\n    case 'done': return 'Finished';\n    default: return assertNever(status);\n  }\n}\n`,
      typeTests: `type _NV1 = Expect<Equal<Parameters<typeof assertNever>[0], never>>;
const _nv = (x: never): string => assertNever(x);
// @ts-expect-error
assertNever('todo');`,
      tests: `test('describes each status', () => eq(['todo', 'doing', 'done'].map(describe), ['Waiting', 'In progress', 'Finished']));
test('assertNever throws at runtime', () => eq(throws(() => assertNever('weird')).message, 'unexpected: weird'));
test('unknown input reaches assertNever', () => { throws(() => describe('archived')); });`,
      hints: ['After every case is handled, the variable has type `never` in the `default` branch — so passing it to a function that accepts only `never` compiles.', 'Miss a case, and the leftover type is no longer `never`: the call stops compiling.'],
    },
    {
      id: 'my-omit', title: 'Rebuild Exclude and Omit', tier: 2,
      prompt: "**Type-only challenge.** Without the built-ins, write:\n\n- `MyExclude<T, U>` — removes from the union `T` every member assignable to `U`\n- `MyOmit<T, K>` — an object type with the properties of `T` except those named in `K`",
      starter: `type MyExclude<T, U> = T;\ntype MyOmit<T, K> = T;\n`,
      solution: `type MyExclude<T, U> = T extends U ? never : T;\ntype MyOmit<T, K extends keyof T> = { [P in keyof T as P extends K ? never : P]: T[P] };\n`,
      typeTests: `type _EX1 = Expect<Equal<MyExclude<'a' | 'b' | 'c', 'a'>, 'b' | 'c'>>;
type _EX2 = Expect<Equal<MyExclude<string | number | boolean, string | boolean>, number>>;
interface _Acct { id: number; email: string; password: string }
type _OM1 = Expect<Equal<MyOmit<_Acct, 'password'>, { id: number; email: string }>>;
type _OM2 = Expect<Equal<MyOmit<_Acct, 'id' | 'password'>, { email: string }>>;
// @ts-expect-error
type _OM3 = MyOmit<_Acct, 'nope'>;`,
      tests: ``,
      hints: ['A conditional type applied to a union runs once per member — so `T extends U ? never : T` filters the union.', 'A mapped type can drop a key by remapping it to `never`: `[P in keyof T as P extends K ? never : P]`.'],
    },
    {
      id: 'tuple-types', title: 'Tuple surgery', tier: 3,
      prompt: "**Type-only challenge.** Write three types that take a tuple apart:\n\n- `First<T>` — the type of the first element (`never` for an empty tuple)\n- `Last<T>` — the type of the last element (`never` for an empty tuple)\n- `Tail<T>` — the tuple without its first element",
      starter: `type First<T extends unknown[]> = any;\ntype Last<T extends unknown[]> = any;\ntype Tail<T extends unknown[]> = any;\n`,
      solution: `type First<T extends unknown[]> = T extends [infer F, ...unknown[]] ? F : never;\ntype Last<T extends unknown[]> = T extends [...unknown[], infer L] ? L : never;\ntype Tail<T extends unknown[]> = T extends [unknown, ...infer R] ? R : [];\n`,
      typeTests: `type _F1 = Expect<Equal<First<[1, 2, 3]>, 1>>;
type _F2 = Expect<Equal<First<[string, number]>, string>>;
type _F3 = Expect<Equal<First<[]>, never>>;
type _L1 = Expect<Equal<Last<[1, 2, 3]>, 3>>;
type _L2 = Expect<Equal<Last<[boolean]>, boolean>>;
type _L3 = Expect<Equal<Last<[]>, never>>;
type _T1 = Expect<Equal<Tail<[1, 2, 3]>, [2, 3]>>;
type _T2 = Expect<Equal<Tail<[1]>, []>>;
type _T3 = Expect<Equal<Tail<[]>, []>>;`,
      tests: ``,
      hints: ['Tuples can be pattern-matched: `T extends [infer F, ...unknown[]] ? F : never`.', 'The rest element may come first: `[...unknown[], infer L]`.', '`infer` can capture a whole rest: `[unknown, ...infer R]`.'],
    },
    {
      id: 'deep-partial', title: 'DeepPartial', tier: 3,
      prompt: "**Type-only challenge.** `Partial<T>` only makes the top level optional. Write `DeepPartial<T>`, which makes every property optional at every depth — the type you want for a nested settings override. Functions are left as they are.",
      starter: `type DeepPartial<T> = Partial<T>;\n`,
      solution: `type DeepPartial<T> = T extends (...args: any[]) => any\n  ? T\n  : T extends object\n    ? { [K in keyof T]?: DeepPartial<T[K]> }\n    : T;\n`,
      typeTests: `interface _Settings { theme: { dark: boolean; accent: string }; editor: { tabs: { size: number } }; onSave: () => void }
type _DP = DeepPartial<_Settings>;
type _DP1 = Expect<Equal<_DP['theme'], { dark?: boolean; accent?: string } | undefined>>;
type _DP2 = Expect<Equal<NonNullable<NonNullable<_DP['editor']>['tabs']>, { size?: number }>>;
type _DP3 = Expect<Equal<_DP['onSave'], (() => void) | undefined>>;
const _dp1: _DP = {};
const _dp2: _DP = { editor: { tabs: {} } };
// @ts-expect-error
const _dp3: _DP = { theme: { dark: 'yes' } };`,
      tests: ``,
      hints: ['Same shape as DeepReadonly: a mapped type that applies itself to each property.', 'The `?` modifier goes after the key: `[K in keyof T]?: ...`.'],
    },
    {
      id: 'store-class', title: 'Boss: a typed store', tier: 3,
      prompt: "Write `class Store<T>` for records that all have a numeric `id` (constrain `T` so anything without one is rejected).\n\n- `add(item: T): void`\n- `get(id: number): T | undefined`\n- `update(id, changes)` — `changes` may contain any properties of `T` **except `id`**; returns the updated record, or throws `new Error('not found')`\n- `all(): readonly T[]` — callers must not be able to push into it",
      starter: `class Store {\n  private items = [];\n}\n`,
      solution: `class Store<T extends { id: number }> {\n  private items: T[] = [];\n\n  add(item: T): void {\n    this.items.push(item);\n  }\n\n  get(id: number): T | undefined {\n    return this.items.find((i) => i.id === id);\n  }\n\n  update(id: number, changes: Partial<Omit<T, 'id'>>): T {\n    const index = this.items.findIndex((i) => i.id === id);\n    if (index === -1) throw new Error('not found');\n    this.items[index] = { ...this.items[index], ...changes };\n    return this.items[index];\n  }\n\n  all(): readonly T[] {\n    return this.items;\n  }\n}\n`,
      typeTests: `interface _User { id: number; name: string; admin: boolean }
const _st = new Store<_User>();
_st.add({ id: 1, name: 'Ada', admin: true });
const _st1 = _st.get(1);
type _ST1 = Expect<Equal<typeof _st1, _User | undefined>>;
const _st2 = _st.update(1, { name: 'Ada L.' });
type _ST2 = Expect<Equal<typeof _st2, _User>>;
type _ST3 = Expect<Equal<ReturnType<typeof _st.all>, readonly _User[]>>;
// @ts-expect-error
_st.update(1, { id: 2 });
// @ts-expect-error
_st.update(1, { name: 5 });
// @ts-expect-error
_st.all().push({ id: 9, name: 'x', admin: false });
// @ts-expect-error
new Store<{ name: string }>();`,
      tests: `test('add and get', () => { const s = new Store(); s.add({ id: 1, name: 'Ada' }); eq(s.get(1), { id: 1, name: 'Ada' }); eq(s.get(2), undefined); });
test('update merges and returns', () => { const s = new Store(); s.add({ id: 1, name: 'Ada', admin: false }); eq(s.update(1, { admin: true }), { id: 1, name: 'Ada', admin: true }); eq(s.get(1).admin, true); });
test('update throws when missing', () => eq(throws(() => new Store().update(5, {})).message, 'not found'));
test('all lists everything', () => { const s = new Store(); s.add({ id: 1 }); s.add({ id: 2 }); eq(s.all().length, 2); });`,
      hints: ['Constrain the class parameter: `class Store<T extends { id: number }>`.', '`Omit<T, "id">` removes the id; wrap it in `Partial<...>` to make the rest optional.', 'Returning `readonly T[]` costs nothing at runtime and stops callers mutating your internal array.'],
    },
  ],
  drills: [
    { q: 'What is the difference between `any` and `unknown`?', choices: ['They are aliases', '`unknown` must be narrowed before use; `any` turns checking off', '`any` must be narrowed before use', '`unknown` only accepts objects'], answer: 1, why: 'Both accept every value. `any` then lets you do anything with it, unchecked. `unknown` forces a typeof/instanceof check first — prefer it for untrusted input.' },
    { q: 'What is the type of `x`?', code: `const x = 'hello';`, choices: ['string', '"hello"', 'any', 'String'], answer: 1, why: 'A `const` can never change, so TypeScript infers the narrowest type: the literal "hello". With `let` it would widen to string.' },
    { q: 'What does `keyof { a: number; b: string }` produce?', choices: ['"a" | "b"', 'number | string', 'string[]', '{ a: "a"; b: "b" }'], answer: 0, why: '`keyof` gives the union of property names. Index back in with `T[keyof T]` to get the union of value types.' },
    { q: 'Does this compile under strict?', code: `function greet(name?: string) {\n  return name.toUpperCase();\n}`, choices: ['Yes', 'No — `name` is possibly undefined', 'No — optional parameters are not allowed', 'Yes, but it warns'], answer: 1, why: 'An optional parameter has type `string | undefined`. Narrow it, default it (`name = "you"`), or use `name?.toUpperCase()`.' },
    { q: 'What does `Partial<T>` do?', choices: ['Removes all properties', 'Makes every property optional', 'Makes every property readonly', 'Picks half the properties'], answer: 1, why: 'It is the mapped type `{ [K in keyof T]?: T[K] }` — ideal for "update" payloads.' },
    { q: 'Types exist at…', choices: ['runtime only', 'compile time only — they are erased from the JavaScript output', 'both compile time and runtime', 'runtime, as hidden properties'], answer: 1, why: 'TypeScript types are erased. That is why you cannot write `if (x instanceof MyInterface)` and why data from outside still needs runtime validation.' },
    { q: 'What is `never`?', choices: ['The same as void', 'The type with no values — unreachable code, impossible unions', 'The same as null', 'An alias for undefined'], answer: 1, why: '`never` is what is left when every possibility is ruled out. Assigning to a `never` variable in a switch default is how you get exhaustiveness checking.' },
    { q: '`interface` or `type` — which can be a union?', choices: ['interface', 'type', 'Both', 'Neither'], answer: 1, why: 'Only a type alias can name a union, tuple or primitive. Interfaces describe object shapes and can be extended and merged.' },
    { q: 'What does the `!` do here?', code: `const el = document.getElementById('app')!;`, choices: ['Negates the value', 'Asserts the value is not null or undefined — unchecked', 'Throws if null at runtime', 'Makes it readonly'], answer: 1, why: 'The non-null assertion only silences the compiler. Nothing is checked at runtime, so a wrong `!` is a crash waiting to happen.' },
    { q: 'What is the type of `r`?', code: `function f<T>(x: T) { return [x]; }\nconst r = f(3);`, choices: ['any[]', 'number[]', '[3]', 'T[]'], answer: 1, why: 'T is inferred from the argument. A literal passed to a plain `T` parameter widens to `number`, so the result is number[].' },
    { q: 'What does `satisfies` do that a type annotation does not?', choices: ['Nothing, it is an alias', 'Checks the value against a type but keeps the narrower inferred type', 'Converts the value at runtime', 'Makes the value readonly'], answer: 1, why: '`const c = {...} satisfies Config` validates the shape, yet `c` keeps its exact literal types instead of being widened to Config.' },
    { q: 'What does `Record<string, number>` describe?', choices: ['An array of numbers', 'An object with string keys and number values', 'A tuple', 'A Map'], answer: 1, why: '`Record<K, V>` is an object type keyed by K. With a union for K, every member becomes a required property.' },
    { q: 'What is the type of `xs`?', code: `const xs = [1, 'a'];`, choices: ['[number, string]', '(string | number)[]', 'any[]', 'unknown[]'], answer: 1, why: 'An array literal infers an array of the union of its element types. Add `as const` to get the tuple `readonly [1, "a"]`.' },
    { q: 'Does this compile?', code: `interface Point { x: number; y: number }\nconst p: Point = { x: 1, y: 2, z: 3 };`, choices: ['Yes', 'No — excess property `z` in an object literal', 'Yes, but z is ignored at runtime', 'No — interfaces cannot be used as types'], answer: 1, why: 'Fresh object literals get an excess-property check, which catches typos. Assigning an existing variable with extra properties is allowed.' },
    { q: 'What does `as` do at runtime?', code: `const n = input as number;`, choices: ['Converts the value to a number', 'Nothing — it only tells the compiler what to believe', 'Throws if the value is not a number', 'Rounds the value'], answer: 1, why: 'A type assertion is erased from the output. If `input` is really a string, it is still a string. Convert with `Number(input)`.' },
    { q: 'What is `T` here?', code: `function wrap<T>(value: T) { return { value }; }\nwrap('hi');`, choices: ['any', 'string', 'unknown', 'never'], answer: 1, why: 'Type arguments are inferred from the call. You only write `wrap<string>("hi")` when inference cannot work it out.' },
    { q: 'Which utility type makes every property required?', choices: ['Partial<T>', 'Required<T>', 'Readonly<T>', 'NonNullable<T>'], answer: 1, why: '`Required` removes the `?` from each property. `NonNullable` instead strips null and undefined from a union.' },
    { q: 'What does `string[]` mean compared with `[string]`?', choices: ['They are the same', 'An array of any length vs a tuple of exactly one string', 'A tuple vs an array', 'A readonly array vs a mutable one'], answer: 1, why: 'Square brackets *after* a type make an array; a type *inside* square brackets describes a fixed-length tuple.' },
    { q: 'Why is this an error under strict?', code: `function len(s: string | null) {\n  return s.length;\n}`, choices: ['string has no length', '`s` is possibly null', 'Unions cannot be parameters', 'It is not an error'], answer: 1, why: '`strictNullChecks` keeps null out of every other type. Narrow first: `if (s === null) return 0;` or use `s?.length`.' },
    { q: 'What is structural typing?', choices: ['Types match only if they share a name', 'Types match if their shapes are compatible, whatever they are called', 'Types are checked at runtime', 'Only classes can be types'], answer: 1, why: 'Any object with the right properties satisfies an interface — no `implements` needed. This is "duck typing", checked at compile time.' },
    { q: 'What does `enum Color { Red, Green }` produce at runtime?', choices: ['Nothing — enums are erased', 'A real object mapping names to numbers and back', 'A string union', 'A class'], answer: 1, why: 'Enums are one of the few TypeScript features that emit code. A union of string literals gives the same safety with no runtime cost.' },
    { q: 'What does the `?` do in this type?', code: `type User = { name: string; nickname?: string };`, choices: ['Makes nickname nullable only', 'Makes nickname optional: it may be missing or undefined', 'Makes nickname readonly', 'Marks nickname as private'], answer: 1, why: 'An optional property has type `string | undefined` and can be left out entirely. It does not allow `null`.' },
    { q: 'What does `typeof` mean in a *type* position?', code: `const config = { port: 80 };\ntype Config = typeof config;`, choices: ['The string "object"', 'The static type of that variable: { port: number }', 'A runtime check', 'An error'], answer: 1, why: 'In a type position, `typeof x` asks the compiler for the type of `x`. In an expression, the same keyword is the JavaScript runtime operator.' },
    { q: 'What is a generic constraint?', code: `function f<T extends { id: number }>(x: T) {}`, choices: ['T must be exactly { id: number }', 'T can be any type that has at least a numeric id', 'T is optional', 'T must be a class'], answer: 1, why: '`extends` in a type parameter sets a minimum shape. Inside the function you may then safely use `x.id`.' },
  ],
};
