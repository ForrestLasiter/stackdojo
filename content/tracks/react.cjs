'use strict';
// Components are compiled, mounted into a real DOM (jsdom) and driven the way a
// user would: find things by role/label/text, click, type, then look again.
// Tests have: render, screen, fireEvent, waitFor, act, renderHook, mockFetch, spy.

module.exports = {
  id: 'react',
  name: 'React',
  short: 'Re',
  blurb: 'Components, state, effects, hooks, context — graded against a live DOM.',
  lang: 'tsx',
  runner: { kind: 'node', loader: 'tsx', env: 'react' },
  challenges: [
    {
      id: 'greeting', title: 'Props in, markup out', tier: 1,
      prompt: "Write a component `Greeting` that takes a `name` prop and renders an `<h1>` reading `Hello, Ada!` (for `name=\"Ada\"`). With no name, greet `stranger`.",
      starter: `function Greeting({ name }) {\n  return null;\n}\n`,
      solution: `function Greeting({ name = 'stranger' }) {\n  return <h1>Hello, {name}!</h1>;\n}\n`,
      tests: `test('greets by name', () => { render(<Greeting name="Ada" />); eq(screen.getByRole('heading', { level: 1 }).textContent, 'Hello, Ada!'); });
test('falls back to stranger', () => { render(<Greeting />); eq(screen.getByRole('heading').textContent, 'Hello, stranger!'); });`,
      hints: ['Curly braces drop a JavaScript value into JSX: `{name}`.', 'Destructuring can supply a default: `{ name = "stranger" }`.'],
    },
    {
      id: 'card', title: 'Children', tier: 1,
      prompt: "Write `Card({ title, children })` that renders a `<section>` containing an `<h2>` with the title, followed by whatever was placed between the `<Card>` tags.",
      starter: `function Card({ title, children }) {\n  return null;\n}\n`,
      solution: `function Card({ title, children }) {\n  return (\n    <section>\n      <h2>{title}</h2>\n      {children}\n    </section>\n  );\n}\n`,
      tests: `test('renders title and children', () => { const { container } = render(<Card title="Stats"><p>42 solved</p></Card>); eq(screen.getByRole('heading', { level: 2 }).textContent, 'Stats'); eq(screen.getByText('42 solved').tagName, 'P'); ok(container.querySelector('section > p'), 'children go inside the section'); });`,
      hints: ['Whatever sits between a component\'s opening and closing tags arrives as the `children` prop.'],
    },
    {
      id: 'status', title: 'Conditional rendering', tier: 1,
      prompt: "Write `Status({ online })`. It renders a `<span>` with the text `Online` and class `ok` when `online` is true, otherwise the text `Offline` and class `off`.",
      starter: `function Status({ online }) {\n  return null;\n}\n`,
      solution: `function Status({ online }) {\n  return <span className={online ? 'ok' : 'off'}>{online ? 'Online' : 'Offline'}</span>;\n}\n`,
      tests: `test('online', () => { render(<Status online />); const el = screen.getByText('Online'); eq([el.tagName, el.className], ['SPAN', 'ok']); });
test('offline', () => { render(<Status online={false} />); eq(screen.getByText('Offline').className, 'off'); });`,
      hints: ['JSX has no `if`; use the ternary `cond ? a : b` inside braces.', 'The HTML `class` attribute is spelled `className` in JSX.'],
    },
    {
      id: 'list', title: 'Lists and keys', tier: 1,
      prompt: "Write `TodoList({ items })` where each item is `{ id, text }`. Render a `<ul>` with one `<li>` per item. When the list is empty, render `<p>Nothing to do</p>` instead of the list. React must not warn about missing keys.",
      starter: `function TodoList({ items }) {\n  return null;\n}\n`,
      solution: `function TodoList({ items }) {\n  if (items.length === 0) return <p>Nothing to do</p>;\n  return (\n    <ul>\n      {items.map((item) => <li key={item.id}>{item.text}</li>)}\n    </ul>\n  );\n}\n`,
      tests: `const _items = [{ id: 'a', text: 'Write tests' }, { id: 'b', text: 'Ship it' }];
test('one li per item', () => { render(<TodoList items={_items} />); eq(screen.getAllByRole('listitem').map((li) => li.textContent), ['Write tests', 'Ship it']); });
test('empty state', () => { render(<TodoList items={[]} />); ok(screen.getByText('Nothing to do')); eq(screen.queryByRole('list'), null); });
test('no key warning', () => { clearOutput(); render(<TodoList items={_items} />); ok(!/unique "key"/.test(output()), 'React warned: each child in a list needs a unique key'); });`,
      hints: ['`items.map(...)` inside braces turns an array of data into an array of elements.', 'Give each element a stable `key` — the item\'s `id`, not its array index.'],
    },
    {
      id: 'counter', title: 'useState', tier: 1,
      prompt: "Write `Counter`. It shows `Count: 0` in a `<p>` and has two buttons, `+1` and `Reset`. `+1` adds one; `Reset` goes back to zero.",
      starter: `import { useState } from 'react';\n\nfunction Counter() {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(count + 1)}>+1</button>\n      <button onClick={() => setCount(0)}>Reset</button>\n    </div>\n  );\n}\n`,
      tests: `test('starts at zero', () => { render(<Counter />); ok(screen.getByText('Count: 0')); });
test('+1 increments', () => { render(<Counter />); const b = screen.getByRole('button', { name: '+1' }); fireEvent.click(b); fireEvent.click(b); ok(screen.getByText('Count: 2')); });
test('Reset returns to zero', () => { render(<Counter />); fireEvent.click(screen.getByRole('button', { name: '+1' })); fireEvent.click(screen.getByRole('button', { name: 'Reset' })); ok(screen.getByText('Count: 0')); });`,
      hints: ['`const [value, setValue] = useState(initial)`.', 'Pass a *function* to `onClick`: `onClick={() => setCount(...)}`. Writing `onClick={setCount(1)}` calls it during render.'],
    },
    {
      id: 'controlled', title: 'Controlled input', tier: 1,
      prompt: "Write `NameForm`. It has a text input labelled `Name` and a `<p>` that reads `Hello, <name>` and updates as you type. While the input is empty the paragraph reads `Hello, …`.",
      starter: `import { useState } from 'react';\n\nfunction NameForm() {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\n\nfunction NameForm() {\n  const [name, setName] = useState('');\n  return (\n    <div>\n      <label htmlFor="name">Name</label>\n      <input id="name" value={name} onChange={(e) => setName(e.target.value)} />\n      <p>Hello, {name || '…'}</p>\n    </div>\n  );\n}\n`,
      tests: `test('input is labelled', () => { render(<NameForm />); eq(screen.getByLabelText('Name').tagName, 'INPUT'); });
test('starts with a placeholder greeting', () => { render(<NameForm />); ok(screen.getByText('Hello, …')); });
test('updates as you type', () => { render(<NameForm />); fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Grace' } }); ok(screen.getByText('Hello, Grace')); eq(screen.getByLabelText('Name').value, 'Grace'); });`,
      hints: ['A controlled input gets its `value` from state and reports edits through `onChange`.', 'Connect a label with `htmlFor` matching the input\'s `id` (in JSX, `for` is spelled `htmlFor`).'],
    },
    {
      id: 'toggle', title: 'Show and hide', tier: 1,
      prompt: "Write `Details({ children })`. It renders a button. Initially the button says `Show` and the children are **not in the DOM**. Clicking it reveals the children and changes the label to `Hide`; clicking again hides them. The button must carry `aria-expanded` reflecting the state.",
      starter: `import { useState } from 'react';\n\nfunction Details({ children }) {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\n\nfunction Details({ children }) {\n  const [open, setOpen] = useState(false);\n  return (\n    <div>\n      <button aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Hide' : 'Show'}</button>\n      {open && <div>{children}</div>}\n    </div>\n  );\n}\n`,
      tests: `test('hidden at first', () => { render(<Details>secret</Details>); eq(screen.queryByText('secret'), null); eq(screen.getByRole('button').textContent, 'Show'); eq(screen.getByRole('button').getAttribute('aria-expanded'), 'false'); });
test('click reveals', () => { render(<Details>secret</Details>); fireEvent.click(screen.getByRole('button')); ok(screen.getByText('secret')); eq(screen.getByRole('button').textContent, 'Hide'); eq(screen.getByRole('button').getAttribute('aria-expanded'), 'true'); });
test('click again hides', () => { render(<Details>secret</Details>); const b = screen.getByRole('button'); fireEvent.click(b); fireEvent.click(b); eq(screen.queryByText('secret'), null); });`,
      hints: ['`{open && <div>…</div>}` renders the element only when `open` is true.', '`aria-expanded={open}` tells assistive tech what the button controls.'],
    },
    {
      id: 'batch-bug', title: 'Fix: three clicks in one', tier: 2,
      prompt: "**Bug hunt.** The `+3` button is supposed to add three, but it only adds one. Fix it without changing the three separate `setCount` calls into one.",
      starter: `import { useState } from 'react';\n\nfunction TripleCounter() {\n  const [count, setCount] = useState(0);\n\n  function addThree() {\n    setCount(count + 1);\n    setCount(count + 1);\n    setCount(count + 1);\n  }\n\n  return <button onClick={addThree}>+3 (now {count})</button>;\n}\n`,
      solution: `import { useState } from 'react';\n\nfunction TripleCounter() {\n  const [count, setCount] = useState(0);\n\n  function addThree() {\n    setCount((c) => c + 1);\n    setCount((c) => c + 1);\n    setCount((c) => c + 1);\n  }\n\n  return <button onClick={addThree}>+3 (now {count})</button>;\n}\n`,
      tests: `test('adds three per click', () => { render(<TripleCounter />); fireEvent.click(screen.getByRole('button')); eq(screen.getByRole('button').textContent, '+3 (now 3)'); });
test('keeps adding three', () => { render(<TripleCounter />); const b = screen.getByRole('button'); fireEvent.click(b); fireEvent.click(b); eq(b.textContent, '+3 (now 6)'); });
test('still uses three updates', () => ok((TripleCounter.toString().match(/setCount\\(/g) || []).length >= 3, 'keep the three setCount calls'));`,
      hints: ['`count` is a snapshot from this render. All three lines compute `0 + 1`.', 'A state setter also accepts a function: `setCount((c) => c + 1)`. React feeds each one the result of the previous.'],
    },
    {
      id: 'mutation-bug', title: 'Fix: the list that will not grow', tier: 2,
      prompt: "**Bug hunt.** Clicking `Add` should append `Item N` to the list, but nothing appears. Fix it.",
      starter: `import { useState } from 'react';\n\nfunction Growing() {\n  const [items, setItems] = useState(['Item 1']);\n\n  function add() {\n    items.push('Item ' + (items.length + 1));\n    setItems(items);\n  }\n\n  return (\n    <div>\n      <button onClick={add}>Add</button>\n      <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>\n    </div>\n  );\n}\n`,
      solution: `import { useState } from 'react';\n\nfunction Growing() {\n  const [items, setItems] = useState(['Item 1']);\n\n  function add() {\n    setItems([...items, 'Item ' + (items.length + 1)]);\n  }\n\n  return (\n    <div>\n      <button onClick={add}>Add</button>\n      <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>\n    </div>\n  );\n}\n`,
      tests: `test('adds an item', () => { render(<Growing />); fireEvent.click(screen.getByRole('button', { name: 'Add' })); eq(screen.getAllByRole('listitem').map((l) => l.textContent), ['Item 1', 'Item 2']); });
test('keeps adding', () => { render(<Growing />); const b = screen.getByRole('button', { name: 'Add' }); fireEvent.click(b); fireEvent.click(b); eq(screen.getAllByRole('listitem').length, 3); });`,
      hints: ['React decides whether to re-render by comparing the old and new state with `Object.is`. A mutated array is still the *same* array.', 'Create a new array: `[...items, newItem]`.'],
    },
    {
      id: 'search', title: 'Derived data', tier: 2,
      prompt: "Write `SearchList({ items })` (an array of strings). Render a text input labelled `Search` and a `<ul>` of the items that contain the search text, ignoring case. Below the list, a `<p>` reads `N of M shown`.\n\nThe filtered list should be *computed during render* — not stored in a second piece of state.",
      starter: `import { useState } from 'react';\n\nfunction SearchList({ items }) {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\n\nfunction SearchList({ items }) {\n  const [query, setQuery] = useState('');\n  const shown = items.filter((i) => i.toLowerCase().includes(query.toLowerCase()));\n  return (\n    <div>\n      <label>\n        Search\n        <input value={query} onChange={(e) => setQuery(e.target.value)} />\n      </label>\n      <ul>{shown.map((i) => <li key={i}>{i}</li>)}</ul>\n      <p>{shown.length} of {items.length} shown</p>\n    </div>\n  );\n}\n`,
      tests: `const _langs = ['Rust', 'TypeScript', 'JavaScript', 'Bash'];
test('shows everything at first', () => { render(<SearchList items={_langs} />); eq(screen.getAllByRole('listitem').length, 4); ok(screen.getByText('4 of 4 shown')); });
test('filters, ignoring case', () => { render(<SearchList items={_langs} />); fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'SCRIPT' } }); eq(screen.getAllByRole('listitem').map((l) => l.textContent), ['TypeScript', 'JavaScript']); ok(screen.getByText('2 of 4 shown')); });
test('no matches', () => { render(<SearchList items={_langs} />); fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'zzz' } }); eq(screen.queryAllByRole('listitem').length, 0); ok(screen.getByText('0 of 4 shown')); });
test('one piece of state', () => ok((SearchList.toString().match(/useState\\)?\\(/g) || []).length === 1, 'the filtered list should be computed, not stored in state'));`,
      hints: ['Only the search text is state. The visible list is a calculation from `items` and that text.', 'Wrapping an input inside its `<label>` also associates them.'],
    },
    {
      id: 'focus', title: 'useRef', tier: 2,
      prompt: "Write `FocusBox`. It renders a text input labelled `Email` and a button `Focus the field`. Clicking the button moves keyboard focus into the input.",
      starter: `import { useRef } from 'react';\n\nfunction FocusBox() {\n  return null;\n}\n`,
      solution: `import { useRef } from 'react';\n\nfunction FocusBox() {\n  const input = useRef(null);\n  return (\n    <div>\n      <label htmlFor="email">Email</label>\n      <input id="email" ref={input} />\n      <button onClick={() => input.current.focus()}>Focus the field</button>\n    </div>\n  );\n}\n`,
      tests: `test('button focuses the input', () => { render(<FocusBox />); const input = screen.getByLabelText('Email'); ok(document.activeElement !== input, 'should not start focused'); fireEvent.click(screen.getByRole('button', { name: 'Focus the field' })); ok(document.activeElement === input, 'the input should have focus'); });`,
      hints: ['`const ref = useRef(null)` then `<input ref={ref} />` — after mount, `ref.current` is the DOM node.', 'DOM nodes have a `.focus()` method.'],
    },
    {
      id: 'fetch-user', title: 'useEffect: fetch on mount', tier: 2,
      prompt: "Write `UserCard({ id })`. When it mounts — and whenever `id` changes — it fetches `/api/users/<id>` and shows the JSON's `name` in an `<h2>`.\n\n- while waiting: `<p>Loading…</p>`\n- if the response is not `ok`, or the fetch throws: `<p role=\"alert\">Could not load user</p>`",
      starter: `import { useEffect, useState } from 'react';\n\nfunction UserCard({ id }) {\n  return null;\n}\n`,
      solution: `import { useEffect, useState } from 'react';\n\nfunction UserCard({ id }) {\n  const [state, setState] = useState({ status: 'loading' });\n\n  useEffect(() => {\n    let cancelled = false;\n    setState({ status: 'loading' });\n    fetch('/api/users/' + id)\n      .then((r) => { if (!r.ok) throw new Error('bad status'); return r.json(); })\n      .then((user) => { if (!cancelled) setState({ status: 'done', user }); })\n      .catch(() => { if (!cancelled) setState({ status: 'error' }); });\n    return () => { cancelled = true; };\n  }, [id]);\n\n  if (state.status === 'loading') return <p>Loading…</p>;\n  if (state.status === 'error') return <p role="alert">Could not load user</p>;\n  return <h2>{state.user.name}</h2>;\n}\n`,
      tests: `test('shows loading, then the name', async () => { mockFetch({ '/api/users/1': { name: 'Ada' } }); render(<UserCard id={1} />); ok(screen.getByText('Loading…')); eq((await screen.findByRole('heading', { level: 2 })).textContent, 'Ada'); });
test('refetches when id changes', async () => { const calls = mockFetch({ '/api/users/1': { name: 'Ada' }, '/api/users/2': { name: 'Linus' } }); const { rerender } = render(<UserCard id={1} />); await screen.findByText('Ada'); rerender(<UserCard id={2} />); await screen.findByText('Linus'); eq(calls.map((c) => c.url), ['/api/users/1', '/api/users/2']); });
test('does not refetch on unrelated re-renders', async () => { const calls = mockFetch({ '/api/users/1': { name: 'Ada' } }); const { rerender } = render(<UserCard id={1} />); await screen.findByText('Ada'); rerender(<UserCard id={1} />); await sleep(20); eq(calls.length, 1); });
test('404 shows an error', async () => { mockFetch({}); render(<UserCard id={9} />); eq((await screen.findByRole('alert')).textContent, 'Could not load user'); });
test('network failure shows an error', async () => { mockFetch({ '/api/users/1': new Error('offline') }); render(<UserCard id={1} />); ok(await screen.findByRole('alert')); });`,
      hints: ['`useEffect(() => { ... }, [id])` runs after the first render and again whenever `id` changes.', '`fetch` only rejects on network failure. A 404 resolves normally — check `response.ok`.', 'Without a dependency array the effect runs after *every* render, and setting state inside it loops forever.'],
    },
    {
      id: 'ticker', title: 'useEffect: clean up', tier: 2,
      prompt: "Write `Ticker({ ms })`. It shows `Ticks: N` in a `<p>`, starting at 0 and going up by one every `ms` milliseconds. When the component unmounts, its interval must be cleared — no timers left running.",
      starter: `import { useEffect, useState } from 'react';\n\nfunction Ticker({ ms }) {\n  return null;\n}\n`,
      solution: `import { useEffect, useState } from 'react';\n\nfunction Ticker({ ms }) {\n  const [ticks, setTicks] = useState(0);\n\n  useEffect(() => {\n    const id = setInterval(() => setTicks((t) => t + 1), ms);\n    return () => clearInterval(id);\n  }, [ms]);\n\n  return <p>Ticks: {ticks}</p>;\n}\n`,
      tests: `test('starts at zero', () => { render(<Ticker ms={1000} />); ok(screen.getByText('Ticks: 0')); });
test('counts up', async () => { render(<Ticker ms={10} />); await waitFor(() => ok(screen.getByText('Ticks: 3'))); });
test('clears the interval on unmount', () => { const rs = globalThis.setInterval, rc = globalThis.clearInterval; let live = 0; globalThis.setInterval = (...a) => { live++; return rs(...a); }; globalThis.clearInterval = (id) => { live--; return rc(id); }; try { const { unmount } = render(<Ticker ms={50} />); eq(live, 1, 'expected exactly one interval while mounted'); unmount(); eq(live, 0, 'the interval is still running after unmount'); } finally { globalThis.setInterval = rs; globalThis.clearInterval = rc; } });`,
      hints: ['The function you *return* from an effect is its cleanup. React calls it on unmount and before re-running the effect.', 'Inside the interval, use the updater form `setTicks((t) => t + 1)` so the callback never reads a stale `ticks`.'],
    },
    {
      id: 'accordion', title: 'Lifting state up', tier: 2,
      prompt: "Write `Accordion({ sections })`, where each section is `{ title, body }`. Render a button per section showing its title. Clicking a button opens that section, showing its body in a `<p>`. **Only one section is open at a time**; clicking the open section's button closes it. Nothing is open initially.",
      starter: `import { useState } from 'react';\n\nfunction Accordion({ sections }) {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\n\nfunction Accordion({ sections }) {\n  const [open, setOpen] = useState(null);\n  return (\n    <div>\n      {sections.map((s, i) => (\n        <div key={s.title}>\n          <button aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>{s.title}</button>\n          {open === i && <p>{s.body}</p>}\n        </div>\n      ))}\n    </div>\n  );\n}\n`,
      tests: `const _secs = [{ title: 'One', body: 'First body' }, { title: 'Two', body: 'Second body' }];
test('closed at first', () => { render(<Accordion sections={_secs} />); eq(screen.queryByText('First body'), null); eq(screen.getAllByRole('button').length, 2); });
test('opens a section', () => { render(<Accordion sections={_secs} />); fireEvent.click(screen.getByRole('button', { name: 'One' })); ok(screen.getByText('First body')); });
test('only one open at a time', () => { render(<Accordion sections={_secs} />); fireEvent.click(screen.getByRole('button', { name: 'One' })); fireEvent.click(screen.getByRole('button', { name: 'Two' })); eq(screen.queryByText('First body'), null); ok(screen.getByText('Second body')); });
test('clicking the open one closes it', () => { render(<Accordion sections={_secs} />); const b = screen.getByRole('button', { name: 'One' }); fireEvent.click(b); fireEvent.click(b); eq(screen.queryByText('First body'), null); });`,
      hints: ['If each section kept its own `open` state, they could not know about each other. Keep one piece of state in the parent: *which* section is open.', 'Store the open index (or `null`).'],
    },
    {
      id: 'reducer', title: 'useReducer', tier: 2,
      prompt: "Write a pure function `cartReducer(state, action)` where state is `{ items: { [name]: quantity } }`.\n\n- `{ type: 'add', name }` — quantity + 1 (starting from 0)\n- `{ type: 'remove', name }` — quantity − 1; at 0 the name is deleted from `items`\n- `{ type: 'clear' }` — empties the cart\n- anything else returns the state unchanged\n\nNever mutate the incoming state.\n\nThen write `Cart`, using `useReducer`, with buttons `Add apple`, `Remove apple`, `Clear`, and a `<p>` reading `Apples: N`.",
      starter: `import { useReducer } from 'react';\n\nfunction cartReducer(state, action) {\n  return state;\n}\n\nfunction Cart() {\n  return null;\n}\n`,
      solution: `import { useReducer } from 'react';\n\nfunction cartReducer(state, action) {\n  switch (action.type) {\n    case 'add':\n      return { items: { ...state.items, [action.name]: (state.items[action.name] || 0) + 1 } };\n    case 'remove': {\n      const qty = (state.items[action.name] || 0) - 1;\n      const items = { ...state.items };\n      if (qty <= 0) delete items[action.name];\n      else items[action.name] = qty;\n      return { items };\n    }\n    case 'clear':\n      return { items: {} };\n    default:\n      return state;\n  }\n}\n\nfunction Cart() {\n  const [state, dispatch] = useReducer(cartReducer, { items: {} });\n  return (\n    <div>\n      <p>Apples: {state.items.apple || 0}</p>\n      <button onClick={() => dispatch({ type: 'add', name: 'apple' })}>Add apple</button>\n      <button onClick={() => dispatch({ type: 'remove', name: 'apple' })}>Remove apple</button>\n      <button onClick={() => dispatch({ type: 'clear' })}>Clear</button>\n    </div>\n  );\n}\n`,
      tests: `test('add', () => eq(cartReducer({ items: { pear: 1 } }, { type: 'add', name: 'pear' }), { items: { pear: 2 } }));
test('add a new name', () => eq(cartReducer({ items: {} }, { type: 'add', name: 'fig' }), { items: { fig: 1 } }));
test('remove deletes at zero', () => eq(cartReducer({ items: { fig: 1, pear: 2 } }, { type: 'remove', name: 'fig' }), { items: { pear: 2 } }));
test('clear', () => eq(cartReducer({ items: { a: 1 } }, { type: 'clear' }), { items: {} }));
test('unknown action returns the same state', () => { const s = { items: {} }; ok(cartReducer(s, { type: '???' }) === s); });
test('does not mutate', () => { const s = { items: { a: 1 } }; cartReducer(s, { type: 'add', name: 'a' }); cartReducer(s, { type: 'remove', name: 'a' }); eq(s, { items: { a: 1 } }); });
test('Cart wires it up', () => { render(<Cart />); const add = screen.getByRole('button', { name: 'Add apple' }); fireEvent.click(add); fireEvent.click(add); ok(screen.getByText('Apples: 2')); fireEvent.click(screen.getByRole('button', { name: 'Remove apple' })); ok(screen.getByText('Apples: 1')); fireEvent.click(screen.getByRole('button', { name: 'Clear' })); ok(screen.getByText('Apples: 0')); });`,
      hints: ['A reducer is `(state, action) => newState` — a plain function you can test without React.', '`const [state, dispatch] = useReducer(reducer, initialState)`.', 'Copy before changing: `{ ...state.items, [name]: qty }`.'],
    },
    {
      id: 'use-toggle', title: 'A custom hook', tier: 2,
      prompt: "Write a custom hook `useToggle(initial = false)` that returns `[value, toggle]`. Calling `toggle()` flips the boolean. `toggle` must keep the **same function identity** across renders, so it is safe to pass to memoised children.",
      starter: `import { useCallback, useState } from 'react';\n\nfunction useToggle(initial = false) {\n  \n}\n`,
      solution: `import { useCallback, useState } from 'react';\n\nfunction useToggle(initial = false) {\n  const [value, setValue] = useState(initial);\n  const toggle = useCallback(() => setValue((v) => !v), []);\n  return [value, toggle];\n}\n`,
      tests: `test('starts at the initial value', () => { eq(renderHook(() => useToggle()).result.current[0], false); eq(renderHook(() => useToggle(true)).result.current[0], true); });
test('toggle flips it', () => { const { result } = renderHook(() => useToggle()); act(() => result.current[1]()); eq(result.current[0], true); act(() => result.current[1]()); eq(result.current[0], false); });
test('two toggles in one batch cancel out', () => { const { result } = renderHook(() => useToggle()); act(() => { result.current[1](); result.current[1](); }); eq(result.current[0], false); });
test('toggle identity is stable', () => { const { result } = renderHook(() => useToggle()); const first = result.current[1]; act(() => first()); ok(result.current[1] === first, 'toggle is a new function every render'); });`,
      hints: ['A custom hook is a function whose name starts with `use` and which calls other hooks.', '`useCallback(fn, [])` returns the same function on every render.', 'With the updater form `setValue((v) => !v)` the callback needs no dependencies.'],
    },
    {
      id: 'theme-context', title: 'Context', tier: 2,
      prompt: "Create a `ThemeContext` and two components:\n\n- `ThemeProvider({ children })` holds a theme, `'light'` initially, and provides `{ theme, toggle }` through the context\n- `ThemeButton` reads the context and renders a button labelled `Theme: light` (or `dark`); clicking it toggles\n\nEvery `ThemeButton` under one provider shares the same theme.",
      starter: `import { createContext, useContext, useState } from 'react';\n\nconst ThemeContext = createContext(null);\n\nfunction ThemeProvider({ children }) {\n  return children;\n}\n\nfunction ThemeButton() {\n  return null;\n}\n`,
      solution: `import { createContext, useContext, useState } from 'react';\n\nconst ThemeContext = createContext(null);\n\nfunction ThemeProvider({ children }) {\n  const [theme, setTheme] = useState('light');\n  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));\n  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;\n}\n\nfunction ThemeButton() {\n  const { theme, toggle } = useContext(ThemeContext);\n  return <button onClick={toggle}>Theme: {theme}</button>;\n}\n`,
      tests: `test('starts light', () => { render(<ThemeProvider><ThemeButton /></ThemeProvider>); eq(screen.getByRole('button').textContent, 'Theme: light'); });
test('click toggles', () => { render(<ThemeProvider><ThemeButton /></ThemeProvider>); const b = screen.getByRole('button'); fireEvent.click(b); eq(b.textContent, 'Theme: dark'); fireEvent.click(b); eq(b.textContent, 'Theme: light'); });
test('buttons share one theme', () => { render(<ThemeProvider><ThemeButton /><div><ThemeButton /></div></ThemeProvider>); const [a, b] = screen.getAllByRole('button'); fireEvent.click(a); eq([a.textContent, b.textContent], ['Theme: dark', 'Theme: dark']); });
test('separate providers are independent', () => { render(<div><ThemeProvider><ThemeButton /></ThemeProvider><ThemeProvider><ThemeButton /></ThemeProvider></div>); const [a, b] = screen.getAllByRole('button'); fireEvent.click(a); eq([a.textContent, b.textContent], ['Theme: dark', 'Theme: light']); });`,
      hints: ['The provider owns the state and passes it down: `<ThemeContext.Provider value={...}>`.', 'Any descendant reads it with `useContext(ThemeContext)` — no props threaded through the middle.'],
    },
    {
      id: 'login-form', title: 'Forms and validation', tier: 2,
      prompt: "Write `LoginForm({ onSubmit })` with inputs labelled `Email` and `Password` and a `Sign in` submit button.\n\nOn submit:\n\n- prevent the browser's page reload\n- if the email is empty, show `<p role=\"alert\">Email is required</p>` and do **not** call `onSubmit`\n- otherwise call `onSubmit({ email, password })` and remove any error",
      starter: `import { useState } from 'react';\n\nfunction LoginForm({ onSubmit }) {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\n\nfunction LoginForm({ onSubmit }) {\n  const [email, setEmail] = useState('');\n  const [password, setPassword] = useState('');\n  const [error, setError] = useState('');\n\n  function handleSubmit(e) {\n    e.preventDefault();\n    if (!email.trim()) { setError('Email is required'); return; }\n    setError('');\n    onSubmit({ email, password });\n  }\n\n  return (\n    <form onSubmit={handleSubmit}>\n      <label htmlFor="email">Email</label>\n      <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />\n      <label htmlFor="password">Password</label>\n      <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />\n      {error && <p role="alert">{error}</p>}\n      <button type="submit">Sign in</button>\n    </form>\n  );\n}\n`,
      tests: `const _fill = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
test('submits the values', () => { const onSubmit = spy(); render(<LoginForm onSubmit={onSubmit} />); _fill('Email', 'a@b.test'); _fill('Password', 'hunter2'); fireEvent.click(screen.getByRole('button', { name: 'Sign in' })); eq(onSubmit.calls, [[{ email: 'a@b.test', password: 'hunter2' }]]); });
test('prevents the default reload', () => { render(<LoginForm onSubmit={() => {}} />); const form = screen.getByLabelText('Email').closest('form'); ok(form, 'inputs should be inside a <form>'); eq(fireEvent.submit(form), false, 'call e.preventDefault()'); });
test('requires an email', () => { const onSubmit = spy(); render(<LoginForm onSubmit={onSubmit} />); fireEvent.submit(screen.getByLabelText('Email').closest('form')); eq(screen.getByRole('alert').textContent, 'Email is required'); eq(onSubmit.calls.length, 0); });
test('error clears after a good submit', () => { render(<LoginForm onSubmit={() => {}} />); const form = screen.getByLabelText('Email').closest('form'); fireEvent.submit(form); _fill('Email', 'a@b.test'); fireEvent.submit(form); eq(screen.queryByRole('alert'), null); });`,
      hints: ['Handle `onSubmit` on the `<form>`, not `onClick` on the button — then pressing Enter works too.', '`e.preventDefault()` stops the browser from navigating.', 'Validation errors are just more state.'],
    },
    {
      id: 'tabs', title: 'Accessible tabs', tier: 3,
      prompt: "Write `Tabs({ tabs })`, each tab being `{ label, content }`. Build it with the proper ARIA roles:\n\n- a container with `role=\"tablist\"`\n- one `<button role=\"tab\">` per tab, with `aria-selected` `true`/`false`\n- a `role=\"tabpanel\"` element showing the selected tab's content\n\nThe first tab is selected initially. Clicking a tab selects it. Pressing **ArrowRight** / **ArrowLeft** on a tab selects the next / previous one, wrapping around.",
      starter: `import { useState } from 'react';\n\nfunction Tabs({ tabs }) {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\n\nfunction Tabs({ tabs }) {\n  const [active, setActive] = useState(0);\n\n  function onKeyDown(e) {\n    if (e.key === 'ArrowRight') setActive((active + 1) % tabs.length);\n    if (e.key === 'ArrowLeft') setActive((active - 1 + tabs.length) % tabs.length);\n  }\n\n  return (\n    <div>\n      <div role="tablist">\n        {tabs.map((t, i) => (\n          <button key={t.label} role="tab" aria-selected={i === active} tabIndex={i === active ? 0 : -1} onClick={() => setActive(i)} onKeyDown={onKeyDown}>\n            {t.label}\n          </button>\n        ))}\n      </div>\n      <div role="tabpanel">{tabs[active].content}</div>\n    </div>\n  );\n}\n`,
      tests: `const _tabs = [{ label: 'One', content: 'First panel' }, { label: 'Two', content: 'Second panel' }, { label: 'Three', content: 'Third panel' }];
const _sel = () => screen.getAllByRole('tab').map((t) => t.getAttribute('aria-selected'));
test('has the ARIA structure', () => { render(<Tabs tabs={_tabs} />); ok(screen.getByRole('tablist')); eq(screen.getAllByRole('tab').length, 3); eq(screen.getByRole('tabpanel').textContent, 'First panel'); });
test('first tab selected', () => { render(<Tabs tabs={_tabs} />); eq(_sel(), ['true', 'false', 'false']); });
test('click selects', () => { render(<Tabs tabs={_tabs} />); fireEvent.click(screen.getByRole('tab', { name: 'Two' })); eq(_sel(), ['false', 'true', 'false']); eq(screen.getByRole('tabpanel').textContent, 'Second panel'); });
test('ArrowRight moves and wraps', () => { render(<Tabs tabs={_tabs} />); fireEvent.click(screen.getByRole('tab', { name: 'Three' })); fireEvent.keyDown(screen.getByRole('tab', { name: 'Three' }), { key: 'ArrowRight' }); eq(_sel(), ['true', 'false', 'false']); });
test('ArrowLeft moves and wraps', () => { render(<Tabs tabs={_tabs} />); fireEvent.keyDown(screen.getByRole('tab', { name: 'One' }), { key: 'ArrowLeft' }); eq(screen.getByRole('tabpanel').textContent, 'Third panel'); });`,
      hints: ['Roles are plain attributes: `<div role="tablist">`, `<button role="tab" aria-selected={...}>`.', 'Wrap-around arithmetic: `(i + 1) % n` forwards, `(i - 1 + n) % n` backwards.', '`onKeyDown` receives an event whose `key` is `"ArrowRight"` or `"ArrowLeft"`.'],
    },
    {
      id: 'use-debounce', title: 'useDebounce', tier: 3,
      prompt: "Write a hook `useDebounce(value, ms)`. It returns `value`, but only updates to a new value once `ms` milliseconds have passed without `value` changing again. On the first render it returns the initial value immediately.",
      starter: `import { useEffect, useState } from 'react';\n\nfunction useDebounce(value, ms) {\n  return value;\n}\n`,
      solution: `import { useEffect, useState } from 'react';\n\nfunction useDebounce(value, ms) {\n  const [debounced, setDebounced] = useState(value);\n\n  useEffect(() => {\n    const id = setTimeout(() => setDebounced(value), ms);\n    return () => clearTimeout(id);\n  }, [value, ms]);\n\n  return debounced;\n}\n`,
      tests: `const _hook = (v) => renderHook(({ v }) => useDebounce(v, 40), { initialProps: { v } });
test('initial value is immediate', () => eq(_hook('a').result.current, 'a'));
test('lags behind a change', async () => { const { result, rerender } = _hook('a'); rerender({ v: 'b' }); eq(result.current, 'a'); await waitFor(() => eq(result.current, 'b')); });
test('rapid changes collapse to the last', async () => { const { result, rerender } = _hook('a'); const seen = new Set(); for (const v of ['b', 'c', 'd']) { rerender({ v }); await act(() => sleep(10)); seen.add(result.current); } await waitFor(() => eq(result.current, 'd')); eq([...seen], ['a'], 'intermediate values leaked through'); });`,
      hints: ['Keep a second copy of the value in state, and update it from a `setTimeout` inside an effect.', 'The effect cleanup cancels the pending timer whenever `value` changes — that is the whole trick.'],
    },
    {
      id: 'use-local-storage', title: 'useLocalStorage', tier: 3,
      prompt: "Write a hook `useLocalStorage(key, initial)` that behaves like `useState` but persists.\n\n- on first render, use the JSON value stored under `key` in `localStorage` if there is one, otherwise `initial`\n- whenever the value changes, save it to `localStorage` as JSON\n- if the stored text is not valid JSON, fall back to `initial` instead of crashing",
      starter: `import { useEffect, useState } from 'react';\n\nfunction useLocalStorage(key, initial) {\n  return useState(initial);\n}\n`,
      solution: `import { useEffect, useState } from 'react';\n\nfunction useLocalStorage(key, initial) {\n  const [value, setValue] = useState(() => {\n    try {\n      const raw = localStorage.getItem(key);\n      return raw === null ? initial : JSON.parse(raw);\n    } catch {\n      return initial;\n    }\n  });\n\n  useEffect(() => {\n    localStorage.setItem(key, JSON.stringify(value));\n  }, [key, value]);\n\n  return [value, setValue];\n}\n`,
      tests: `test('uses the initial value when nothing is stored', () => eq(renderHook(() => useLocalStorage('k1', 5)).result.current[0], 5));
test('reads a stored value', () => { localStorage.setItem('k2', JSON.stringify({ a: 1 })); eq(renderHook(() => useLocalStorage('k2', null)).result.current[0], { a: 1 }); });
test('saves changes', () => { const { result } = renderHook(() => useLocalStorage('k3', 'x')); act(() => result.current[1]('y')); eq(result.current[0], 'y'); eq(localStorage.getItem('k3'), '"y"'); });
test('stored falsy values are respected', () => { localStorage.setItem('k4', 'false'); eq(renderHook(() => useLocalStorage('k4', true)).result.current[0], false); });
test('survives corrupt data', () => { localStorage.setItem('k5', '{not json'); eq(renderHook(() => useLocalStorage('k5', 'safe')).result.current[0], 'safe'); });`,
      hints: ['`useState` accepts a function that computes the initial value once: `useState(() => ...)`.', '`localStorage.getItem` returns `null` for a missing key — test for exactly that, since a stored `false` or `0` is valid.', 'Write back in an effect that depends on the value.'],
    },
    {
      id: 'memo', title: 'useMemo', tier: 3,
      prompt: "`Leaderboard({ scores, rank })` renders an ordered list of the scores after passing them through `rank(scores)` — an expensive function you are given. It also has a `Like` button with a like counter: `Likes: N`.\n\nClicking `Like` must **not** call `rank` again. `rank` should only re-run when `scores` (or `rank`) changes.",
      starter: `import { useMemo, useState } from 'react';\n\nfunction Leaderboard({ scores, rank }) {\n  const [likes, setLikes] = useState(0);\n  const ranked = rank(scores);\n\n  return (\n    <div>\n      <ol>{ranked.map((s) => <li key={s}>{s}</li>)}</ol>\n      <p>Likes: {likes}</p>\n      <button onClick={() => setLikes(likes + 1)}>Like</button>\n    </div>\n  );\n}\n`,
      solution: `import { useMemo, useState } from 'react';\n\nfunction Leaderboard({ scores, rank }) {\n  const [likes, setLikes] = useState(0);\n  const ranked = useMemo(() => rank(scores), [scores, rank]);\n\n  return (\n    <div>\n      <ol>{ranked.map((s) => <li key={s}>{s}</li>)}</ol>\n      <p>Likes: {likes}</p>\n      <button onClick={() => setLikes(likes + 1)}>Like</button>\n    </div>\n  );\n}\n`,
      tests: `const _rank = () => spy((xs) => [...xs].sort((a, b) => b - a));
test('renders ranked scores', () => { render(<Leaderboard scores={[10, 30, 20]} rank={_rank()} />); eq(screen.getAllByRole('listitem').map((l) => l.textContent), ['30', '20', '10']); });
test('liking does not re-rank', () => { const rank = _rank(); render(<Leaderboard scores={[1, 2]} rank={rank} />); const b = screen.getByRole('button', { name: 'Like' }); fireEvent.click(b); fireEvent.click(b); ok(screen.getByText('Likes: 2')); eq(rank.calls.length, 1, 'rank ran again on an unrelated re-render'); });
test('new scores do re-rank', () => { const rank = _rank(); const { rerender } = render(<Leaderboard scores={[1, 2]} rank={rank} />); rerender(<Leaderboard scores={[5, 9]} rank={rank} />); eq(rank.calls.length, 2); eq(screen.getAllByRole('listitem').map((l) => l.textContent), ['9', '5']); });`,
      hints: ['`useMemo(() => compute(), [deps])` re-runs `compute` only when a dependency changes.', 'List everything the calculation reads: here, `scores` and `rank`.'],
    },
    {
      id: 'error-boundary', title: 'Error boundary', tier: 3,
      prompt: "Hooks cannot catch render errors — this is the one place React still needs a class. Write `class ErrorBoundary extends React.Component` taking a `fallback` prop.\n\n- normally it renders its `children`\n- if a child throws while rendering, it renders `fallback` instead\n- it calls the optional `onError(error)` prop when that happens",
      starter: `import React from 'react';\n\nclass ErrorBoundary extends React.Component {\n  render() {\n    return this.props.children;\n  }\n}\n`,
      solution: `import React from 'react';\n\nclass ErrorBoundary extends React.Component {\n  state = { failed: false };\n\n  static getDerivedStateFromError() {\n    return { failed: true };\n  }\n\n  componentDidCatch(error) {\n    if (this.props.onError) this.props.onError(error);\n  }\n\n  render() {\n    return this.state.failed ? this.props.fallback : this.props.children;\n  }\n}\n`,
      tests: `const _Bomb = () => { throw new Error('kaboom'); };
test('renders children when all is well', () => { render(<ErrorBoundary fallback={<p>Broken</p>}><p>Fine</p></ErrorBoundary>); ok(screen.getByText('Fine')); });
test('renders the fallback when a child throws', () => { render(<ErrorBoundary fallback={<p>Broken</p>}><_Bomb /></ErrorBoundary>); ok(screen.getByText('Broken')); });
test('reports the error', () => { const onError = spy(); render(<ErrorBoundary fallback={<p>Broken</p>} onError={onError}><_Bomb /></ErrorBoundary>); eq(onError.calls.length, 1); eq(onError.calls[0][0].message, 'kaboom'); });
test('siblings outside the boundary survive', () => { render(<div><p>Outside</p><ErrorBoundary fallback={<p>Broken</p>}><_Bomb /></ErrorBoundary></div>); ok(screen.getByText('Outside')); });`,
      hints: ['`static getDerivedStateFromError(error)` returns the state to switch to when a child throws.', '`componentDidCatch(error, info)` is the place for side effects like logging.', 'In `render`, choose between `this.props.fallback` and `this.props.children`.'],
    },
    {
      id: 'todo-app', title: 'Boss: todo app', tier: 3,
      prompt: "Build `TodoApp`:\n\n- a text input labelled `New todo` and an `Add` button inside a form. Submitting adds a todo and clears the input. Blank (whitespace-only) text is ignored; text is trimmed.\n- each todo is an `<li>` containing a checkbox **labelled with the todo's text**, and a button with the accessible name `Delete <text>`\n- ticking the checkbox marks the todo done\n- a `<p>` shows `N left` — the number not yet done",
      starter: `import { useState } from 'react';\n\nfunction TodoApp() {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\n\nlet nextId = 1;\n\nfunction TodoApp() {\n  const [todos, setTodos] = useState([]);\n  const [text, setText] = useState('');\n\n  function add(e) {\n    e.preventDefault();\n    const t = text.trim();\n    if (!t) return;\n    setTodos([...todos, { id: nextId++, text: t, done: false }]);\n    setText('');\n  }\n\n  const toggle = (id) => setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));\n  const remove = (id) => setTodos(todos.filter((t) => t.id !== id));\n\n  return (\n    <div>\n      <form onSubmit={add}>\n        <label htmlFor="new">New todo</label>\n        <input id="new" value={text} onChange={(e) => setText(e.target.value)} />\n        <button type="submit">Add</button>\n      </form>\n      <ul>\n        {todos.map((t) => (\n          <li key={t.id}>\n            <label>\n              <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />\n              {t.text}\n            </label>\n            <button aria-label={'Delete ' + t.text} onClick={() => remove(t.id)}>×</button>\n          </li>\n        ))}\n      </ul>\n      <p>{todos.filter((t) => !t.done).length} left</p>\n    </div>\n  );\n}\n`,
      tests: `const _add = (text) => { fireEvent.change(screen.getByLabelText('New todo'), { target: { value: text } }); fireEvent.click(screen.getByRole('button', { name: 'Add' })); };
test('starts empty', () => { render(<TodoApp />); eq(screen.queryAllByRole('listitem').length, 0); ok(screen.getByText('0 left')); });
test('adds todos and clears the input', () => { render(<TodoApp />); _add('Write tests'); _add('Ship it'); eq(screen.getAllByRole('listitem').length, 2); eq(screen.getByLabelText('New todo').value, ''); ok(screen.getByText('2 left')); });
test('trims and ignores blanks', () => { render(<TodoApp />); _add('   '); eq(screen.queryAllByRole('listitem').length, 0); _add('  padded  '); ok(screen.getByRole('checkbox', { name: 'padded' })); });
test('ticking marks it done', () => { render(<TodoApp />); _add('A'); _add('B'); fireEvent.click(screen.getByRole('checkbox', { name: 'A' })); eq(screen.getByRole('checkbox', { name: 'A' }).checked, true); eq(screen.getByRole('checkbox', { name: 'B' }).checked, false); ok(screen.getByText('1 left')); });
test('delete removes just that one', () => { render(<TodoApp />); _add('A'); _add('B'); fireEvent.click(screen.getByRole('button', { name: 'Delete A' })); eq(screen.queryByRole('checkbox', { name: 'A' }), null); ok(screen.getByRole('checkbox', { name: 'B' })); ok(screen.getByText('1 left')); });
test('duplicate text is allowed', () => { clearOutput(); render(<TodoApp />); _add('Same'); _add('Same'); eq(screen.getAllByRole('listitem').length, 2); ok(!/same key/.test(output()), 'two todos share a key — use a unique id, not the text'); });`,
      hints: ['State: the list of `{ id, text, done }`, and the text in the input. `N left` is derived.', 'Update immutably: `map` to change one item, `filter` to remove one.', 'A checkbox wrapped in a `<label>` is named by the label text. `aria-label` names an icon-only button.', 'Keys must be unique even when two todos have the same text — generate an id.'],
    },
    {
      id: 'button-variants', title: 'Props with defaults', tier: 1,
      prompt: "Write `Button({ variant, disabled, onClick, children })`. It renders a `<button>` with the classes `btn` and `btn-<variant>`; `variant` defaults to `primary`. `disabled` and `onClick` are passed through to the button.",
      starter: `function Button({ variant, disabled, onClick, children }) {\n  return null;\n}\n`,
      solution: `function Button({ variant = 'primary', disabled = false, onClick, children }) {\n  return (\n    <button className={'btn btn-' + variant} disabled={disabled} onClick={onClick}>\n      {children}\n    </button>\n  );\n}\n`,
      tests: `test('default variant', () => { render(<Button>Save</Button>); eq(screen.getByRole('button', { name: 'Save' }).className, 'btn btn-primary'); });
test('custom variant', () => { render(<Button variant="danger">Delete</Button>); eq(screen.getByRole('button').className, 'btn btn-danger'); });
test('click calls the handler', () => { const onClick = spy(); render(<Button onClick={onClick}>Go</Button>); fireEvent.click(screen.getByRole('button')); eq(onClick.calls.length, 1); });
test('disabled blocks clicks', () => { const onClick = spy(); render(<Button disabled onClick={onClick}>Go</Button>); eq(screen.getByRole('button').disabled, true); fireEvent.click(screen.getByRole('button')); eq(onClick.calls.length, 0); });`,
      hints: ['Default values go in the destructuring: `{ variant = "primary" }`.', 'Build the class string with a template or `+`.'],
    },
    {
      id: 'select', title: 'A controlled select', tier: 1,
      prompt: "Write `FruitPicker`. It renders a `<select>` labelled `Fruit` with the options `Apple`, `Banana` and `Cherry`, and a `<p>` reading `You picked: <fruit>`. `Apple` is selected initially.",
      starter: `import { useState } from 'react';\n\nfunction FruitPicker() {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\n\nfunction FruitPicker() {\n  const [fruit, setFruit] = useState('Apple');\n  return (\n    <div>\n      <label htmlFor="fruit">Fruit</label>\n      <select id="fruit" value={fruit} onChange={(e) => setFruit(e.target.value)}>\n        <option>Apple</option>\n        <option>Banana</option>\n        <option>Cherry</option>\n      </select>\n      <p>You picked: {fruit}</p>\n    </div>\n  );\n}\n`,
      tests: `test('three options, Apple first', () => { render(<FruitPicker />); eq(screen.getAllByRole('option').map((o) => o.textContent), ['Apple', 'Banana', 'Cherry']); eq(screen.getByLabelText('Fruit').value, 'Apple'); ok(screen.getByText('You picked: Apple')); });
test('changing updates the text', () => { render(<FruitPicker />); fireEvent.change(screen.getByLabelText('Fruit'), { target: { value: 'Cherry' } }); ok(screen.getByText('You picked: Cherry')); eq(screen.getByLabelText('Fruit').value, 'Cherry'); });`,
      hints: ['In React the selected option is set with `value` on the `<select>`, not `selected` on an `<option>`.', 'It is controlled exactly like a text input: `value` + `onChange`.'],
    },
    {
      id: 'stepper', title: 'A bounded stepper', tier: 2,
      prompt: "Write `Stepper({ min = 0, max = 5 })`. It shows the current value in an `<output>` element, starting at `min`, with buttons labelled `Decrease` and `Increase`. The value never leaves the range, and each button is `disabled` when it can go no further.",
      starter: `import { useState } from 'react';\n\nfunction Stepper({ min = 0, max = 5 }) {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\n\nfunction Stepper({ min = 0, max = 5 }) {\n  const [value, setValue] = useState(min);\n  return (\n    <div>\n      <button aria-label="Decrease" disabled={value <= min} onClick={() => setValue((v) => Math.max(min, v - 1))}>−</button>\n      <output>{value}</output>\n      <button aria-label="Increase" disabled={value >= max} onClick={() => setValue((v) => Math.min(max, v + 1))}>+</button>\n    </div>\n  );\n}\n`,
      tests: `const _v = () => screen.getByRole('status').textContent;
const _b = (n) => screen.getByRole('button', { name: n });
test('starts at min with Decrease disabled', () => { render(<Stepper min={2} max={4} />); eq(_v(), '2'); eq(_b('Decrease').disabled, true); eq(_b('Increase').disabled, false); });
test('increases up to max', () => { render(<Stepper min={0} max={2} />); fireEvent.click(_b('Increase')); fireEvent.click(_b('Increase')); eq(_v(), '2'); eq(_b('Increase').disabled, true); fireEvent.click(_b('Increase')); eq(_v(), '2'); });
test('decreases again', () => { render(<Stepper />); fireEvent.click(_b('Increase')); fireEvent.click(_b('Decrease')); eq(_v(), '0'); });
test('defaults are 0 to 5', () => { render(<Stepper />); for (let i = 0; i < 9; i++) fireEvent.click(_b('Increase')); eq(_v(), '5'); });`,
      hints: ['`<output>` is the semantic element for a computed value; it has the ARIA role `status`.', 'Icon-only buttons need a name: `aria-label="Increase"`.', '`disabled={value >= max}` — the disabled state is derived, not stored.'],
    },
    {
      id: 'select-all', title: 'Select all', tier: 2,
      prompt: "Write `Checklist({ items })` (an array of strings). Render a checkbox labelled `Select all`, then one checkbox per item labelled with its text, and a `<p>` reading `N selected`.\n\n- ticking an item toggles just that item\n- `Select all` is checked only when **every** item is checked\n- clicking `Select all` checks everything — or, if everything is already checked, clears everything",
      starter: `import { useState } from 'react';\n\nfunction Checklist({ items }) {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\n\nfunction Checklist({ items }) {\n  const [picked, setPicked] = useState([]);\n  const all = items.length > 0 && picked.length === items.length;\n  const toggle = (item) => setPicked((p) => (p.includes(item) ? p.filter((x) => x !== item) : [...p, item]));\n  return (\n    <div>\n      <label><input type="checkbox" checked={all} onChange={() => setPicked(all ? [] : [...items])} />Select all</label>\n      {items.map((item) => (\n        <label key={item}><input type="checkbox" checked={picked.includes(item)} onChange={() => toggle(item)} />{item}</label>\n      ))}\n      <p>{picked.length} selected</p>\n    </div>\n  );\n}\n`,
      tests: `const _it = ['Docs', 'Tests', 'Deploy'];
const _c = (n) => screen.getByRole('checkbox', { name: n });
test('nothing selected at first', () => { render(<Checklist items={_it} />); eq(screen.getAllByRole('checkbox').length, 4); ok(screen.getByText('0 selected')); eq(_c('Select all').checked, false); });
test('tick one', () => { render(<Checklist items={_it} />); fireEvent.click(_c('Tests')); eq([_c('Docs').checked, _c('Tests').checked], [false, true]); ok(screen.getByText('1 selected')); eq(_c('Select all').checked, false); });
test('select all checks everything', () => { render(<Checklist items={_it} />); fireEvent.click(_c('Select all')); eq(_it.map((i) => _c(i).checked), [true, true, true]); ok(screen.getByText('3 selected')); eq(_c('Select all').checked, true); });
test('select all again clears', () => { render(<Checklist items={_it} />); fireEvent.click(_c('Select all')); fireEvent.click(_c('Select all')); ok(screen.getByText('0 selected')); });
test('ticking the last one lights up select all', () => { render(<Checklist items={_it} />); for (const i of _it) fireEvent.click(_c(i)); eq(_c('Select all').checked, true); fireEvent.click(_c('Docs')); eq(_c('Select all').checked, false); });`,
      hints: ['One piece of state: the list of picked items.', 'Whether "Select all" is checked is *derived*: `picked.length === items.length`.', 'Checkboxes use `checked`, not `value`.'],
    },
    {
      id: 'pagination', title: 'Pagination', tier: 2,
      prompt: "Write `Paged({ items, pageSize })`. Show the current page's items in a `<ul>`, a `<p>` reading `Page X of Y`, and `Previous` / `Next` buttons that are disabled on the first / last page.",
      starter: `import { useState } from 'react';\n\nfunction Paged({ items, pageSize }) {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\n\nfunction Paged({ items, pageSize }) {\n  const [page, setPage] = useState(0);\n  const pages = Math.max(1, Math.ceil(items.length / pageSize));\n  const shown = items.slice(page * pageSize, (page + 1) * pageSize);\n  return (\n    <div>\n      <ul>{shown.map((i) => <li key={i}>{i}</li>)}</ul>\n      <p>Page {page + 1} of {pages}</p>\n      <button disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>\n      <button disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</button>\n    </div>\n  );\n}\n`,
      tests: `const _l = ['a', 'b', 'c', 'd', 'e'];
const _rows = () => screen.queryAllByRole('listitem').map((x) => x.textContent);
const _b = (n) => screen.getByRole('button', { name: n });
test('first page', () => { render(<Paged items={_l} pageSize={2} />); eq(_rows(), ['a', 'b']); ok(screen.getByText('Page 1 of 3')); eq([_b('Previous').disabled, _b('Next').disabled], [true, false]); });
test('next and previous', () => { render(<Paged items={_l} pageSize={2} />); fireEvent.click(_b('Next')); eq(_rows(), ['c', 'd']); ok(screen.getByText('Page 2 of 3')); fireEvent.click(_b('Previous')); eq(_rows(), ['a', 'b']); });
test('last page may be short', () => { render(<Paged items={_l} pageSize={2} />); fireEvent.click(_b('Next')); fireEvent.click(_b('Next')); eq(_rows(), ['e']); eq(_b('Next').disabled, true); });
test('no items is one empty page', () => { render(<Paged items={[]} pageSize={2} />); ok(screen.getByText('Page 1 of 1')); eq([_b('Previous').disabled, _b('Next').disabled], [true, true]); });`,
      hints: ['State is just the page number. Page count and the visible slice are computed.', '`Math.ceil(items.length / pageSize)` — and at least 1, so an empty list still has a page.', '`items.slice(page * pageSize, (page + 1) * pageSize)`.'],
    },
    {
      id: 'star-rating', title: 'Star rating', tier: 2,
      prompt: "Write `StarRating({ max = 5, onChange })`. Render `max` buttons with the accessible names `1 star`, `2 stars`, … Clicking the *n*-th sets the rating to *n*; buttons up to and including the rating have `aria-pressed=\"true\"`. Clicking the **current** rating again clears it to 0. Call `onChange(rating)` on every change.",
      starter: `import { useState } from 'react';\n\nfunction StarRating({ max = 5, onChange }) {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\n\nfunction StarRating({ max = 5, onChange }) {\n  const [rating, setRating] = useState(0);\n  const pick = (n) => {\n    const next = n === rating ? 0 : n;\n    setRating(next);\n    if (onChange) onChange(next);\n  };\n  return (\n    <div role="group" aria-label="Rating">\n      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (\n        <button key={n} aria-label={n === 1 ? '1 star' : n + ' stars'} aria-pressed={n <= rating} onClick={() => pick(n)}>\n          {n <= rating ? '★' : '☆'}\n        </button>\n      ))}\n    </div>\n  );\n}\n`,
      tests: `const _p = () => screen.getAllByRole('button').map((b) => b.getAttribute('aria-pressed'));
test('renders max buttons, none pressed', () => { render(<StarRating />); eq(screen.getAllByRole('button').length, 5); eq(_p(), ['false', 'false', 'false', 'false', 'false']); ok(screen.getByRole('button', { name: '1 star' })); });
test('clicking fills up to that star', () => { const onChange = spy(); render(<StarRating onChange={onChange} />); fireEvent.click(screen.getByRole('button', { name: '3 stars' })); eq(_p(), ['true', 'true', 'true', 'false', 'false']); eq(onChange.calls, [[3]]); });
test('clicking the current rating clears it', () => { const onChange = spy(); render(<StarRating max={3} onChange={onChange} />); const b = screen.getByRole('button', { name: '2 stars' }); fireEvent.click(b); fireEvent.click(b); eq(_p(), ['false', 'false', 'false']); eq(onChange.calls, [[2], [0]]); });
test('works without onChange', () => { render(<StarRating max={2} />); fireEvent.click(screen.getByRole('button', { name: '2 stars' })); eq(_p(), ['true', 'true']); });`,
      hints: ['`Array.from({ length: max }, (_, i) => i + 1)` gives `[1, 2, …, max]` to map over.', '`aria-pressed` turns a button into a toggle for assistive tech — the filled star alone is only visual.'],
    },
    {
      id: 'use-previous', title: 'usePrevious', tier: 2,
      prompt: "Write a hook `usePrevious(value)` that returns the value from the **previous render** (`undefined` on the first render). It is how you answer \"did this prop just change, and from what?\"",
      starter: `import { useEffect, useRef } from 'react';\n\nfunction usePrevious(value) {\n  \n}\n`,
      solution: `import { useEffect, useRef } from 'react';\n\nfunction usePrevious(value) {\n  const ref = useRef(undefined);\n  useEffect(() => {\n    ref.current = value;\n  });\n  return ref.current;\n}\n`,
      tests: `const _h = (v) => renderHook(({ v }) => usePrevious(v), { initialProps: { v } });
test('undefined at first', () => eq(_h(1).result.current, undefined));
test('lags one render behind', () => { const { result, rerender } = _h('a'); rerender({ v: 'b' }); eq(result.current, 'a'); rerender({ v: 'c' }); eq(result.current, 'b'); });
test('re-rendering with the same value catches up', () => { const { result, rerender } = _h(1); rerender({ v: 2 }); rerender({ v: 2 }); eq(result.current, 2); });`,
      hints: ['A ref survives between renders and changing it does not cause one.', 'Effects run *after* the render has been returned — so write the new value into the ref in an effect, and return what the ref held *before* that.'],
    },
    {
      id: 'dialog', title: 'An accessible dialog', tier: 3,
      prompt: "Write `Dialog({ title, children })`.\n\n- a button `Open` shows the dialog\n- the dialog is an element with `role=\"dialog\"`, `aria-modal=\"true\"`, and is **named by its title** via `aria-labelledby` pointing at an `<h2>`\n- it contains the children and a `Close` button\n- `Close` — or pressing **Escape** inside the dialog — hides it\n- when it opens, focus moves into the dialog (give the dialog `tabIndex={-1}` and focus it)",
      starter: `import { useEffect, useId, useRef, useState } from 'react';\n\nfunction Dialog({ title, children }) {\n  return null;\n}\n`,
      solution: `import { useEffect, useId, useRef, useState } from 'react';\n\nfunction Dialog({ title, children }) {\n  const [open, setOpen] = useState(false);\n  const titleId = useId();\n  const box = useRef(null);\n\n  useEffect(() => {\n    if (open) box.current.focus();\n  }, [open]);\n\n  return (\n    <div>\n      <button onClick={() => setOpen(true)}>Open</button>\n      {open && (\n        <div ref={box} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}>\n          <h2 id={titleId}>{title}</h2>\n          {children}\n          <button onClick={() => setOpen(false)}>Close</button>\n        </div>\n      )}\n    </div>\n  );\n}\n`,
      tests: `const _open = () => fireEvent.click(screen.getByRole('button', { name: 'Open' }));
test('closed at first', () => { render(<Dialog title="Settings">Body</Dialog>); eq(screen.queryByRole('dialog'), null); });
test('opens, named by its title', () => { render(<Dialog title="Settings">Body text</Dialog>); _open(); const d = screen.getByRole('dialog', { name: 'Settings' }); eq(d.getAttribute('aria-modal'), 'true'); ok(screen.getByRole('heading', { level: 2, name: 'Settings' })); ok(screen.getByText('Body text')); });
test('moves focus into the dialog', () => { render(<Dialog title="Settings">Body</Dialog>); _open(); ok(screen.getByRole('dialog').contains(document.activeElement), 'focus should be inside the dialog'); });
test('Close hides it', () => { render(<Dialog title="Settings">Body</Dialog>); _open(); fireEvent.click(screen.getByRole('button', { name: 'Close' })); eq(screen.queryByRole('dialog'), null); });
test('Escape hides it', () => { render(<Dialog title="Settings">Body</Dialog>); _open(); fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' }); eq(screen.queryByRole('dialog'), null); });
test('two dialogs get different title ids', () => { render(<div><Dialog title="One">a</Dialog><Dialog title="Two">b</Dialog></div>); for (const b of screen.getAllByRole('button', { name: 'Open' })) fireEvent.click(b); ok(screen.getByRole('dialog', { name: 'One' })); ok(screen.getByRole('dialog', { name: 'Two' })); });`,
      hints: ['`useId()` generates an id that is unique per component instance — use it to connect `aria-labelledby` to the heading.', 'Focus can only be moved after the dialog exists in the DOM: do it in an effect that depends on `open`.', 'Keyboard events bubble, so one `onKeyDown` on the dialog element catches Escape from anything inside it.'],
    },
    {
      id: 'use-fetch', title: 'Boss: useFetch', tier: 3,
      prompt: "Write a hook `useFetch(url)` returning `{ data, loading, error }`.\n\n- starts as `{ data: null, loading: true, error: null }`\n- on success: `data` is the parsed JSON, `loading` false\n- on a non-ok response or a network failure: `error` is a string message, `loading` false, `data` null\n- when `url` changes it starts again — and a slow response for an **old** URL must never overwrite the result for the new one",
      starter: `import { useEffect, useState } from 'react';\n\nfunction useFetch(url) {\n  return { data: null, loading: true, error: null };\n}\n`,
      solution: `import { useEffect, useState } from 'react';\n\nfunction useFetch(url) {\n  const [state, setState] = useState({ data: null, loading: true, error: null });\n\n  useEffect(() => {\n    let stale = false;\n    setState({ data: null, loading: true, error: null });\n    fetch(url)\n      .then((res) => {\n        if (!res.ok) throw new Error('Request failed: ' + res.status);\n        return res.json();\n      })\n      .then((data) => { if (!stale) setState({ data, loading: false, error: null }); })\n      .catch((e) => { if (!stale) setState({ data: null, loading: false, error: e.message }); });\n    return () => { stale = true; };\n  }, [url]);\n\n  return state;\n}\n`,
      tests: `const _h = (url) => renderHook(({ url }) => useFetch(url), { initialProps: { url } });
test('starts loading', () => { mockFetch({ '/a': { n: 1 } }); eq(_h('/a').result.current, { data: null, loading: true, error: null }); });
test('resolves with data', async () => { mockFetch({ '/a': { n: 1 } }); const { result } = _h('/a'); await waitFor(() => eq(result.current, { data: { n: 1 }, loading: false, error: null })); });
test('a bad status becomes an error', async () => { mockFetch({}); const { result } = _h('/missing'); await waitFor(() => eq(result.current.loading, false)); eq(result.current.data, null); eq(typeof result.current.error, 'string'); ok(result.current.error.length > 0); });
test('a network failure becomes an error', async () => { mockFetch({ '/a': new Error('offline') }); const { result } = _h('/a'); await waitFor(() => eq(result.current.error, 'offline')); });
test('refetches when the url changes', async () => { mockFetch({ '/a': 'A', '/b': 'B' }); const { result, rerender } = _h('/a'); await waitFor(() => eq(result.current.data, 'A')); rerender({ url: '/b' }); eq(result.current.loading, true); await waitFor(() => eq(result.current.data, 'B')); });
test('a slow old response cannot win', async () => { mockFetch({ '/slow': async () => { await sleep(60); return 'OLD'; }, '/fast': 'NEW' }); const { result, rerender } = _h('/slow'); rerender({ url: '/fast' }); await waitFor(() => eq(result.current.data, 'NEW')); await act(() => sleep(90)); eq(result.current.data, 'NEW', 'the stale response overwrote the fresh one'); });`,
      hints: ['Keep the three values in one state object so they always change together.', 'Declare a `stale` flag inside the effect and set it in the cleanup. Each run of the effect gets its own flag.', 'Before every `setState` in a `.then`, check the flag: a response that arrives after its effect was cleaned up is ignored.'],
    },
  ],
  drills: [
    { q: 'Why does React need a `key` on list items?', choices: ['For CSS styling', 'To match items between renders so state and DOM stay attached to the right one', 'To sort the list', 'It is required by HTML'], answer: 1, why: 'Keys are identity. With index keys, deleting the first row makes every remaining row inherit the wrong state.' },
    { q: 'What happens when you call a state setter?', choices: ['The variable changes immediately', 'React schedules a re-render; the new value appears on the next render', 'The DOM is updated synchronously', 'The component unmounts'], answer: 1, why: 'State in the current render is a fixed snapshot. Reading it right after `setX` still gives the old value.' },
    { q: 'When does this effect run?', code: `useEffect(() => {\n  console.log('hi');\n});`, choices: ['Once, on mount', 'After every render', 'Never', 'Only on unmount'], answer: 1, why: 'No dependency array means "after every render". `[]` means once on mount; `[a, b]` means when a or b changes.' },
    { q: 'What is wrong here?', code: `if (loggedIn) {\n  const [name, setName] = useState('');\n}`, choices: ['Nothing', 'Hooks cannot be called conditionally', 'useState needs two arguments', 'name must be a number'], answer: 1, why: 'React tracks hooks by call order. A hook that runs on some renders and not others shifts every hook after it.' },
    { q: 'What does this button do?', code: `<button onClick={save()}>Save</button>`, choices: ['Calls save when clicked', 'Calls save during every render', 'Nothing', 'Throws a syntax error'], answer: 1, why: '`save()` is evaluated immediately and its return value becomes the handler. Pass the function itself: `onClick={save}`.' },
    { q: 'Props are…', choices: ['Mutable by the child', 'Read-only inputs from the parent', 'Global variables', 'Stored in the DOM'], answer: 1, why: 'Data flows down. A child asks for a change by calling a callback prop; the parent owns the state.' },
    { q: 'What does `useRef` give you that `useState` does not?', choices: ['A value that persists but does not trigger a re-render when changed', 'A faster state', 'A value shared between components', 'An async state'], answer: 0, why: 'Refs hold mutable values (DOM nodes, timer ids) across renders without causing one.' },
    { q: 'What does `{count && <Badge />}` render when `count` is 0?', choices: ['Nothing', 'The number 0', 'The Badge', 'false'], answer: 1, why: '`0 && x` evaluates to 0, and React renders numbers. Write `count > 0 && <Badge />`.' },
    { q: 'Where should shared state live?', choices: ['In every component that needs it', 'In the closest common ancestor of the components that need it', 'Always in a global store', 'In localStorage'], answer: 1, why: 'Lift state up to the nearest shared parent and pass it down. Reach for context when the prop chain gets long.' },
    { q: 'What is the purpose of an effect cleanup function?', choices: ['To reset state', 'To undo the effect — clear timers, remove listeners, cancel requests', 'To log errors', 'To force a re-render'], answer: 1, why: 'Without cleanup, each re-run of the effect stacks another interval or listener, and unmounted components keep running code.' },
    { q: 'Why can JSX not return two sibling elements directly?', choices: ['It can', 'A component returns one value — wrap siblings in a fragment `<>...</>`', 'Browsers forbid it', 'It breaks keys'], answer: 1, why: 'JSX compiles to a function call, and a function returns one thing. Fragments group without adding a DOM node.' },
    { q: 'Which is the correct way to update an object in state?', choices: ['user.name = "Ada"; setUser(user)', 'setUser({ ...user, name: "Ada" })', 'setUser.name("Ada")', 'user.setName("Ada")'], answer: 1, why: 'React compares by reference. Mutating then passing the same object looks like "nothing changed" and the render is skipped.' },
    { q: 'In development with StrictMode, why do effects run twice on mount?', choices: ['A bug', 'React mounts, unmounts and remounts to surface missing cleanup', 'To speed up rendering', 'Because of hot reload'], answer: 1, why: 'It is a deliberate stress test. An effect with proper cleanup behaves the same after one run or two.' },
    { q: 'What does this log after one click?', code: `const [n, setN] = useState(0);\nfunction onClick() {\n  setN(n + 1);\n  console.log(n);\n}`, choices: ['1', '0', 'undefined', 'It throws'], answer: 1, why: '`n` is a constant for this render. The new value only exists in the *next* render.' },
    { q: 'Why is an array index a poor `key` for a list that can be reordered?', choices: ['Indexes are slow', 'The key no longer follows the item, so state sticks to the wrong row', 'Keys must be strings', 'React forbids numbers'], answer: 1, why: 'After a reorder or delete, index 0 is a different item. Use a stable id that belongs to the data.' },
    { q: 'What makes an input "controlled"?', choices: ['It has a ref', 'Its `value` comes from state and changes go through `onChange`', 'It is disabled', 'It has a `defaultValue`'], answer: 1, why: 'React state is the single source of truth. `defaultValue` is the uncontrolled alternative: the DOM keeps the value.' },
    { q: 'What happens when a parent component re-renders?', choices: ['Only the parent re-renders', 'Its children re-render too, by default', 'Nothing until state changes again', 'The page reloads'], answer: 1, why: 'Rendering cascades downward. It is usually cheap; `React.memo` can skip a child whose props did not change.' },
    { q: 'What is wrong with this effect?', code: `useEffect(() => {\n  setCount(count + 1);\n});`, choices: ['Nothing', 'It runs after every render and causes another render: an infinite loop', 'setCount cannot be used in effects', 'It needs a return value'], answer: 1, why: 'No dependency array means "run after every render". Setting state inside triggers the next render, forever.' },
    { q: 'What does `React.memo(Component)` do?', choices: ['Caches API responses', 'Skips re-rendering when the props are shallowly equal', 'Stores state between sessions', 'Makes the component async'], answer: 1, why: 'It only helps if props keep the same identity — an inline `{}` or arrow function is new on every render.' },
    { q: 'When does `useLayoutEffect` run, compared with `useEffect`?', choices: ['After the browser has painted', 'Before the browser paints, synchronously after DOM updates', 'Only on unmount', 'On the server'], answer: 1, why: 'Use it to measure layout or avoid a visible flicker. Otherwise prefer `useEffect`, which does not block painting.' },
    { q: 'Where may hooks be called?', choices: ['Anywhere in a module', 'At the top level of a component or of another hook', 'Inside loops, if careful', 'Inside event handlers'], answer: 1, why: 'Top level only — never in conditions, loops or nested functions — so the call order is identical on every render.' },
    { q: 'What does `useState(() => expensive())` do differently from `useState(expensive())`?', choices: ['Nothing', 'Runs `expensive` only on the first render', 'Runs it on every render', 'Runs it asynchronously'], answer: 1, why: 'The function form is a lazy initialiser. The direct call runs every render and throws the result away after the first.' },
    { q: 'What is "prop drilling"?', choices: ['Validating props', 'Passing a prop through layers of components that do not use it', 'Mutating props', 'Spreading props'], answer: 1, why: 'Fine for one or two levels. Beyond that, context or composition (passing components as children) is cleaner.' },
    { q: 'What does this render?', code: `<p>{isAdmin ? 'Admin' : null}</p>`, choices: ['The text "null"', 'An empty paragraph when isAdmin is false', 'Nothing at all — no <p>', 'An error'], answer: 1, why: '`null`, `undefined`, `true` and `false` render nothing. The surrounding element is still there.' },
    { q: 'Why does updating context re-render a component?', choices: ['Only if it is wrapped in memo', 'Every component that reads that context re-renders when its value changes', 'It does not', 'Only class components do'], answer: 1, why: 'Passing a new object as the provider value on every render re-renders all consumers — memoise the value or split the context.' },
  ],
};
