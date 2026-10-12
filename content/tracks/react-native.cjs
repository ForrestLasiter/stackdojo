'use strict';
// React Native components, rendered through react-native-web so they can be
// mounted and pressed without a phone or emulator. The component API (View,
// Text, Pressable, FlatList, StyleSheet…) is the real one; `testID` becomes
// findable with screen.getByTestId, and `css(el)` reads the resolved style.

const NO_HTML = `test('uses React Native components, not HTML', () => ok(!/<(div|span|p|button|input|ul|li|h[1-6])[\\s>]/.test(SOURCE), 'React Native has no <div> or <button> — use View, Text, Pressable…'));`;

module.exports = {
  id: 'react-native',
  name: 'React Native',
  short: 'RN',
  blurb: 'Mobile UI with React: View, Text, Pressable, lists, StyleSheet and flexbox.',
  lang: 'tsx',
  runner: { kind: 'node', loader: 'tsx', env: 'rn' },
  challenges: [
    {
      id: 'welcome', title: 'View and Text', tier: 1,
      prompt: "There is no HTML in React Native. Containers are `View`, and **all text must be inside `Text`**.\n\nWrite `Welcome({ name })` rendering a `View` with `testID=\"welcome\"` containing a `Text` that reads `Welcome, <name>!`.",
      starter: `import { View, Text } from 'react-native';\n\nfunction Welcome({ name }) {\n  return null;\n}\n`,
      solution: `import { View, Text } from 'react-native';\n\nfunction Welcome({ name }) {\n  return (\n    <View testID="welcome">\n      <Text>Welcome, {name}!</Text>\n    </View>\n  );\n}\n`,
      tests: `test('renders the greeting', () => { render(<Welcome name="Ada" />); eq(screen.getByTestId('welcome').textContent, 'Welcome, Ada!'); });
${NO_HTML}`,
      hints: ['`<View>` is the `<div>` of React Native; `<Text>` is the only thing that can hold a string.', '`testID` is how tests (and automation tools) find a native element.'],
    },
    {
      id: 'badge', title: 'StyleSheet', tier: 1,
      prompt: "Styles are JavaScript objects with camelCase names and unitless numbers. Write `Badge({ label })` using `StyleSheet.create`:\n\n- a `View` (`testID=\"badge\"`) with background `#1e40af`, `borderRadius: 12`, `paddingHorizontal: 10`, `paddingVertical: 4`\n- a `Text` (`testID=\"badge-text\"`) showing the label in white (`#ffffff`), bold",
      starter: `import { View, Text, StyleSheet } from 'react-native';\n\nfunction Badge({ label }) {\n  return null;\n}\n\nconst styles = StyleSheet.create({\n  \n});\n`,
      solution: `import { View, Text, StyleSheet } from 'react-native';\n\nfunction Badge({ label }) {\n  return (\n    <View testID="badge" style={styles.badge}>\n      <Text testID="badge-text" style={styles.text}>{label}</Text>\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  badge: { backgroundColor: '#1e40af', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },\n  text: { color: '#ffffff', fontWeight: 'bold' },\n});\n`,
      tests: `test('shows the label', () => { render(<Badge label="NEW" />); eq(screen.getByTestId('badge-text').textContent, 'NEW'); });
test('container style', () => { render(<Badge label="NEW" />); const s = css(screen.getByTestId('badge')); eq([s.backgroundColor, s.borderTopLeftRadius, s.paddingLeft, s.paddingRight, s.paddingTop, s.paddingBottom], ['rgb(30, 64, 175)', '12px', '10px', '10px', '4px', '4px']); });
test('text style', () => { render(<Badge label="NEW" />); const s = css(screen.getByTestId('badge-text')); eq(s.color, 'rgb(255, 255, 255)'); ok(['bold', '700'].includes(s.fontWeight), 'text should be bold'); });
test('uses StyleSheet.create', () => ok(/StyleSheet\\.create/.test(SOURCE)));`,
      hints: ['`paddingHorizontal` sets left and right together; `paddingVertical` sets top and bottom.', 'Numbers are density-independent pixels: write `12`, not `"12px"`.'],
    },
    {
      id: 'row', title: 'Flexbox: a header row', tier: 1,
      prompt: "In React Native every `View` is a flex container, and the default direction is **column**. Write `HeaderRow({ title, action })` — a `View` (`testID=\"row\"`) that places a title `Text` on the left and an action `Text` on the right, on one line, vertically centred.\n\nUse `flexDirection`, `justifyContent: 'space-between'` and `alignItems`.",
      starter: `import { View, Text, StyleSheet } from 'react-native';\n\nfunction HeaderRow({ title, action }) {\n  return null;\n}\n`,
      solution: `import { View, Text, StyleSheet } from 'react-native';\n\nfunction HeaderRow({ title, action }) {\n  return (\n    <View testID="row" style={styles.row}>\n      <Text>{title}</Text>\n      <Text>{action}</Text>\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },\n});\n`,
      tests: `test('lays out as a spaced row', () => { render(<HeaderRow title="Inbox" action="Edit" />); const s = css(screen.getByTestId('row')); eq([s.flexDirection, s.justifyContent, s.alignItems], ['row', 'space-between', 'center']); });
test('title first, action second', () => { render(<HeaderRow title="Inbox" action="Edit" />); eq([...screen.getByTestId('row').children].map((c) => c.textContent), ['Inbox', 'Edit']); });`,
      hints: ['`flexDirection: "row"` puts children side by side.', '`justifyContent` spreads along the main axis (here, horizontal); `alignItems` positions on the cross axis.'],
    },
    {
      id: 'counter', title: 'Pressable', tier: 1,
      prompt: "Write `Counter`. A `Text` shows `Count: 0`. A `Pressable` with `accessibilityRole=\"button\"` and `accessibilityLabel=\"Increment\"` adds one on press. A second, labelled `Reset`, returns to zero.",
      starter: `import { useState } from 'react';\nimport { View, Text, Pressable } from 'react-native';\n\nfunction Counter() {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\nimport { View, Text, Pressable } from 'react-native';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  return (\n    <View>\n      <Text>Count: {count}</Text>\n      <Pressable accessibilityRole="button" accessibilityLabel="Increment" onPress={() => setCount((c) => c + 1)}>\n        <Text>+1</Text>\n      </Pressable>\n      <Pressable accessibilityRole="button" accessibilityLabel="Reset" onPress={() => setCount(0)}>\n        <Text>Reset</Text>\n      </Pressable>\n    </View>\n  );\n}\n`,
      tests: `test('starts at zero', () => { render(<Counter />); ok(screen.getByText('Count: 0')); });
test('press increments', () => { render(<Counter />); const b = screen.getByRole('button', { name: 'Increment' }); fireEvent.click(b); fireEvent.click(b); ok(screen.getByText('Count: 2')); });
test('reset', () => { render(<Counter />); fireEvent.click(screen.getByRole('button', { name: 'Increment' })); fireEvent.click(screen.getByRole('button', { name: 'Reset' })); ok(screen.getByText('Count: 0')); });
${NO_HTML}`,
      hints: ['The handler is `onPress`, not `onClick`.', 'A `Pressable` is invisible to screen readers as a button unless you give it `accessibilityRole="button"` and a label.'],
    },
    {
      id: 'name-input', title: 'TextInput', tier: 1,
      prompt: "Write `NameInput`. A `TextInput` with `accessibilityLabel=\"Your name\"` and placeholder `Type your name`, and below it a `Text` reading `Hello, <name>` — or `Hello, stranger` while the input is empty.",
      starter: `import { useState } from 'react';\nimport { View, Text, TextInput } from 'react-native';\n\nfunction NameInput() {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\nimport { View, Text, TextInput } from 'react-native';\n\nfunction NameInput() {\n  const [name, setName] = useState('');\n  return (\n    <View>\n      <TextInput accessibilityLabel="Your name" placeholder="Type your name" value={name} onChangeText={setName} />\n      <Text>Hello, {name || 'stranger'}</Text>\n    </View>\n  );\n}\n`,
      tests: `test('starts as stranger', () => { render(<NameInput />); ok(screen.getByText('Hello, stranger')); ok(screen.getByPlaceholderText('Type your name')); });
test('follows typing', () => { render(<NameInput />); fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Grace' } }); ok(screen.getByText('Hello, Grace')); });`,
      hints: ['`onChangeText` hands you the new string directly — no `event.target.value`.', 'It is still a controlled input: `value={name}`.'],
    },
    {
      id: 'avatar', title: 'Image, with a fallback', tier: 1,
      prompt: "Write `Avatar({ uri, name })`.\n\n- with a `uri`: render an `Image` whose `source` is `{ uri }`, `testID=\"avatar\"`, 48×48, `borderRadius: 24`, with `accessibilityLabel` set to the name\n- without one: render a `View` (`testID=\"initials\"`) containing a `Text` with the person's initials in capitals — `'ada lovelace'` → `AL`",
      starter: `import { View, Text, Image } from 'react-native';\n\nfunction Avatar({ uri, name }) {\n  return null;\n}\n`,
      solution: `import { View, Text, Image } from 'react-native';\n\nfunction Avatar({ uri, name }) {\n  if (uri) {\n    return <Image testID="avatar" source={{ uri }} accessibilityLabel={name} style={{ width: 48, height: 48, borderRadius: 24 }} />;\n  }\n  const initials = name.split(' ').filter(Boolean).map((w) => w[0].toUpperCase()).join('');\n  return (\n    <View testID="initials" style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>\n      <Text>{initials}</Text>\n    </View>\n  );\n}\n`,
      tests: `test('image with an accessible name', () => { render(<Avatar uri="https://x.test/a.png" name="Ada Lovelace" />); ok(screen.getByRole('img', { name: 'Ada Lovelace' })); const s = css(screen.getByTestId('avatar')); eq([s.width, s.height], ['48px', '48px']); eq(screen.queryByTestId('initials'), null); });
test('falls back to initials', () => { render(<Avatar name="ada lovelace" />); eq(screen.getByTestId('initials').textContent, 'AL'); eq(screen.queryByRole('img'), null); });
test('single name', () => { render(<Avatar name="Linus" />); eq(screen.getByTestId('initials').textContent, 'L'); });`,
      hints: ['Remote images need `source={{ uri: "..." }}` *and* explicit `width`/`height` — React Native cannot size them automatically.', '`accessibilityLabel` is the alt text.'],
    },
    {
      id: 'chip', title: 'Conditional styles', tier: 2,
      prompt: "Write `Chip({ label, selected, onPress })` — a `Pressable` with `testID=\"chip\"` and `accessibilityRole=\"button\"`.\n\n- background `#e5e7eb` normally, `#2563eb` when selected\n- the label `Text` (`testID=\"chip-label\"`) is `#111827` normally, `#ffffff` when selected\n- expose the state to assistive tech with `aria-selected={selected}`\n\nCombine styles with the **array syntax**: `style={[styles.base, selected && styles.on]}`.",
      starter: `import { Text, Pressable, StyleSheet } from 'react-native';\n\nfunction Chip({ label, selected, onPress }) {\n  return null;\n}\n`,
      solution: `import { Text, Pressable, StyleSheet } from 'react-native';\n\nfunction Chip({ label, selected, onPress }) {\n  return (\n    <Pressable testID="chip" accessibilityRole="button" aria-selected={!!selected} onPress={onPress} style={[styles.chip, selected && styles.chipOn]}>\n      <Text testID="chip-label" style={[styles.label, selected && styles.labelOn]}>{label}</Text>\n    </Pressable>\n  );\n}\n\nconst styles = StyleSheet.create({\n  chip: { backgroundColor: '#e5e7eb', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },\n  chipOn: { backgroundColor: '#2563eb' },\n  label: { color: '#111827' },\n  labelOn: { color: '#ffffff' },\n});\n`,
      tests: `test('unselected look', () => { render(<Chip label="Rust" selected={false} />); eq(css(screen.getByTestId('chip')).backgroundColor, 'rgb(229, 231, 235)'); eq(css(screen.getByTestId('chip-label')).color, 'rgb(17, 24, 39)'); });
test('selected look', () => { render(<Chip label="Rust" selected />); eq(css(screen.getByTestId('chip')).backgroundColor, 'rgb(37, 99, 235)'); eq(css(screen.getByTestId('chip-label')).color, 'rgb(255, 255, 255)'); });
test('announces selection', () => { render(<Chip label="Rust" selected />); eq(screen.getByTestId('chip').getAttribute('aria-selected'), 'true'); });
test('press calls onPress', () => { const onPress = spy(); render(<Chip label="Rust" onPress={onPress} />); fireEvent.click(screen.getByTestId('chip')); eq(onPress.calls.length, 1); });`,
      hints: ['In a style array, later entries win and falsy entries are skipped — so `cond && styles.x` switches a style on.', 'Colour alone is not accessible: `aria-selected` tells a screen reader the chip is selected.'],
    },
    {
      id: 'contacts', title: 'FlatList', tier: 2,
      prompt: "Long lists use `FlatList`, which only renders the rows on screen. Write `ContactList({ contacts })` (each `{ id, name, phone }`):\n\n- a `FlatList` with a `keyExtractor` using the `id`\n- each row is a `View` with `testID=\"contact\"` holding two `Text`s: the name and the phone\n- when the list is empty, show `No contacts yet` via `ListEmptyComponent`",
      starter: `import { View, Text, FlatList } from 'react-native';\n\nfunction ContactList({ contacts }) {\n  return null;\n}\n`,
      solution: `import { View, Text, FlatList } from 'react-native';\n\nfunction ContactList({ contacts }) {\n  return (\n    <FlatList\n      data={contacts}\n      keyExtractor={(c) => c.id}\n      renderItem={({ item }) => (\n        <View testID="contact">\n          <Text>{item.name}</Text>\n          <Text>{item.phone}</Text>\n        </View>\n      )}\n      ListEmptyComponent={<Text>No contacts yet</Text>}\n    />\n  );\n}\n`,
      tests: `const _c = [{ id: 'a', name: 'Ada', phone: '555-0101' }, { id: 'b', name: 'Linus', phone: '555-0102' }];
test('one row per contact', () => { render(<ContactList contacts={_c} />); eq(screen.getAllByTestId('contact').map((r) => [...r.children].map((t) => t.textContent)), [['Ada', '555-0101'], ['Linus', '555-0102']]); });
test('empty state', () => { render(<ContactList contacts={[]} />); ok(screen.getByText('No contacts yet')); eq(screen.queryAllByTestId('contact').length, 0); });
test('uses FlatList with a keyExtractor', () => ok(/FlatList/.test(SOURCE) && /keyExtractor/.test(SOURCE) && !/\\.map\\(/.test(SOURCE), 'render rows with FlatList + keyExtractor, not .map()'));`,
      hints: ['`renderItem` receives an object — destructure it: `({ item }) => ...`.', '`keyExtractor={(item) => item.id}` plays the role of the `key` prop.'],
    },
    {
      id: 'settings', title: 'Switch', tier: 2,
      prompt: "Write `Settings`. A `Switch` with `accessibilityLabel=\"Notifications\"`, off initially, and a `Text` that reads `Notifications are off` / `Notifications are on`.",
      starter: `import { useState } from 'react';\nimport { View, Text, Switch } from 'react-native';\n\nfunction Settings() {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\nimport { View, Text, Switch } from 'react-native';\n\nfunction Settings() {\n  const [on, setOn] = useState(false);\n  return (\n    <View>\n      <Switch accessibilityLabel="Notifications" value={on} onValueChange={setOn} />\n      <Text>Notifications are {on ? 'on' : 'off'}</Text>\n    </View>\n  );\n}\n`,
      tests: `test('off at first', () => { render(<Settings />); ok(screen.getByText('Notifications are off')); eq(screen.getByLabelText('Notifications').checked, false); });
test('flipping it updates the text', () => { render(<Settings />); fireEvent.click(screen.getByLabelText('Notifications')); ok(screen.getByText('Notifications are on')); fireEvent.click(screen.getByLabelText('Notifications')); ok(screen.getByText('Notifications are off')); });`,
      hints: ['A `Switch` is controlled with `value` and `onValueChange` (which receives the new boolean).'],
    },
    {
      id: 'checklist', title: 'Toggle rows', tier: 2,
      prompt: "Write `Checklist({ items })` (an array of strings). Each item is a `Pressable` (`accessibilityRole=\"checkbox\"`, labelled with the item text) containing a `Text` with `testID=\"item\"`. Pressing a row toggles it done:\n\n- done rows show the text with `textDecorationLine: 'line-through'`\n- `aria-checked={checked}` reflects it\n\nA `Text` at the bottom reads `N of M done`.",
      starter: `import { useState } from 'react';\nimport { View, Text, Pressable } from 'react-native';\n\nfunction Checklist({ items }) {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\nimport { View, Text, Pressable } from 'react-native';\n\nfunction Checklist({ items }) {\n  const [done, setDone] = useState([]);\n  const toggle = (item) => setDone((d) => (d.includes(item) ? d.filter((x) => x !== item) : [...d, item]));\n  return (\n    <View>\n      {items.map((item) => {\n        const checked = done.includes(item);\n        return (\n          <Pressable key={item} accessibilityRole="checkbox" accessibilityLabel={item} aria-checked={checked} onPress={() => toggle(item)}>\n            <Text testID="item" style={checked && { textDecorationLine: 'line-through' }}>{item}</Text>\n          </Pressable>\n        );\n      })}\n      <Text>{done.length} of {items.length} done</Text>\n    </View>\n  );\n}\n`,
      tests: `const _deco = () => screen.getAllByTestId('item').map((t) => css(t).getPropertyValue('text-decoration-line') === 'line-through');
test('nothing done at first', () => { render(<Checklist items={['Milk', 'Eggs']} />); eq(_deco(), [false, false]); ok(screen.getByText('0 of 2 done')); });
test('press strikes a row through', () => { render(<Checklist items={['Milk', 'Eggs']} />); fireEvent.click(screen.getByRole('checkbox', { name: 'Eggs' })); eq(_deco(), [false, true]); ok(screen.getByText('1 of 2 done')); eq(screen.getByRole('checkbox', { name: 'Eggs' }).getAttribute('aria-checked'), 'true'); });
test('press again undoes it', () => { render(<Checklist items={['Milk', 'Eggs']} />); const r = screen.getByRole('checkbox', { name: 'Milk' }); fireEvent.click(r); fireEvent.click(r); eq(_deco(), [false, false]); eq(r.getAttribute('aria-checked'), 'false'); });`,
      hints: ['Keep the set of done items in state; each row asks "am I in it?".', 'React Native splits the CSS shorthand: use `textDecorationLine`, not `textDecoration`.'],
    },
    {
      id: 'search-list', title: 'Filter a list', tier: 2,
      prompt: "Write `SearchableList({ items })` (strings). A `TextInput` with `accessibilityLabel=\"Search\"` filters a `FlatList` of the items, case-insensitively, as you type. Each row is a `Text` with `testID=\"row\"`. When nothing matches, show `No results`.",
      starter: `import { useState } from 'react';\nimport { View, Text, TextInput, FlatList } from 'react-native';\n\nfunction SearchableList({ items }) {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\nimport { View, Text, TextInput, FlatList } from 'react-native';\n\nfunction SearchableList({ items }) {\n  const [query, setQuery] = useState('');\n  const shown = items.filter((i) => i.toLowerCase().includes(query.toLowerCase()));\n  return (\n    <View>\n      <TextInput accessibilityLabel="Search" value={query} onChangeText={setQuery} />\n      <FlatList\n        data={shown}\n        keyExtractor={(i) => i}\n        renderItem={({ item }) => <Text testID="row">{item}</Text>}\n        ListEmptyComponent={<Text>No results</Text>}\n      />\n    </View>\n  );\n}\n`,
      tests: `const _it = ['Tulsa', 'Dallas', 'Austin', 'Denver'];
const _rows = () => screen.queryAllByTestId('row').map((r) => r.textContent);
test('shows all at first', () => { render(<SearchableList items={_it} />); eq(_rows(), _it); });
test('filters ignoring case', () => { render(<SearchableList items={_it} />); fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'D' } }); eq(_rows(), ['Dallas', 'Denver']); });
test('no results', () => { render(<SearchableList items={_it} />); fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'xyz' } }); eq(_rows(), []); ok(screen.getByText('No results')); });`,
      hints: ['Only the query is state; the filtered array is computed each render and handed to `data`.'],
    },
    {
      id: 'weather', title: 'Loading states', tier: 2,
      prompt: "Write `Weather({ city })`. On mount (and when `city` changes) fetch `https://api.dojo.test/weather/<city>`, which returns `{ tempF }`.\n\n- while loading: an `ActivityIndicator`\n- on success: a `Text` reading `72°F in Tulsa`\n- on a failed response or network error: a `Text` reading `Could not load weather`",
      starter: `import { useEffect, useState } from 'react';\nimport { View, Text, ActivityIndicator } from 'react-native';\n\nfunction Weather({ city }) {\n  return null;\n}\n`,
      solution: `import { useEffect, useState } from 'react';\nimport { View, Text, ActivityIndicator } from 'react-native';\n\nfunction Weather({ city }) {\n  const [state, setState] = useState({ status: 'loading' });\n\n  useEffect(() => {\n    let cancelled = false;\n    setState({ status: 'loading' });\n    fetch('https://api.dojo.test/weather/' + city)\n      .then((r) => { if (!r.ok) throw new Error('bad'); return r.json(); })\n      .then((data) => { if (!cancelled) setState({ status: 'ok', tempF: data.tempF }); })\n      .catch(() => { if (!cancelled) setState({ status: 'error' }); });\n    return () => { cancelled = true; };\n  }, [city]);\n\n  if (state.status === 'loading') return <ActivityIndicator />;\n  if (state.status === 'error') return <Text>Could not load weather</Text>;\n  return <View><Text>{state.tempF}°F in {city}</Text></View>;\n}\n`,
      tests: `test('spinner, then the temperature', async () => { mockFetch({ '/weather/Tulsa': { tempF: 72 } }); render(<Weather city="Tulsa" />); ok(screen.getByRole('progressbar'), 'show an ActivityIndicator while loading'); ok(await screen.findByText('72°F in Tulsa')); eq(screen.queryByRole('progressbar'), null); });
test('refetches for a new city', async () => { const calls = mockFetch({ '/weather/Tulsa': { tempF: 72 }, '/weather/Denver': { tempF: 41 } }); const { rerender } = render(<Weather city="Tulsa" />); await screen.findByText('72°F in Tulsa'); rerender(<Weather city="Denver" />); ok(await screen.findByText('41°F in Denver')); eq(calls.length, 2); });
test('error message', async () => { mockFetch({}); render(<Weather city="Nowhere" />); ok(await screen.findByText('Could not load weather')); });`,
      hints: ['`fetch` is built into React Native, same as the browser.', 'Model it as one state with a `status` of loading / ok / error, rather than three booleans that can disagree.'],
    },
    {
      id: 'login', title: 'A login form', tier: 2,
      prompt: "Write `LoginScreen({ onLogin })`:\n\n- a `TextInput` labelled `Email` (`keyboardType=\"email-address\"`, `autoCapitalize=\"none\"`)\n- a `TextInput` labelled `Password` with `secureTextEntry`\n- a `Pressable` (`accessibilityRole=\"button\"`, label `Sign in`) that is **`disabled`** until both fields have text\n- pressing it calls `onLogin({ email, password })`",
      starter: `import { useState } from 'react';\nimport { View, Text, TextInput, Pressable } from 'react-native';\n\nfunction LoginScreen({ onLogin }) {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\nimport { View, Text, TextInput, Pressable } from 'react-native';\n\nfunction LoginScreen({ onLogin }) {\n  const [email, setEmail] = useState('');\n  const [password, setPassword] = useState('');\n  const ready = email.length > 0 && password.length > 0;\n  return (\n    <View>\n      <TextInput accessibilityLabel="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />\n      <TextInput accessibilityLabel="Password" secureTextEntry value={password} onChangeText={setPassword} />\n      <Pressable accessibilityRole="button" accessibilityLabel="Sign in" disabled={!ready} onPress={() => onLogin({ email, password })}>\n        <Text>Sign in</Text>\n      </Pressable>\n    </View>\n  );\n}\n`,
      tests: `const _type = (label, v) => fireEvent.change(screen.getByLabelText(label), { target: { value: v } });
test('password is masked', () => { render(<LoginScreen onLogin={() => {}} />); eq(screen.getByLabelText('Password').type, 'password'); });
test('button starts disabled', () => { const onLogin = spy(); render(<LoginScreen onLogin={onLogin} />); const b = screen.getByRole('button', { name: 'Sign in' }); eq(b.getAttribute('aria-disabled'), 'true'); fireEvent.click(b); eq(onLogin.calls.length, 0); });
test('still disabled with one field', () => { render(<LoginScreen onLogin={() => {}} />); _type('Email', 'a@b.test'); eq(screen.getByRole('button', { name: 'Sign in' }).getAttribute('aria-disabled'), 'true'); });
test('submits both values', () => { const onLogin = spy(); render(<LoginScreen onLogin={onLogin} />); _type('Email', 'a@b.test'); _type('Password', 'pw'); const b = screen.getByRole('button', { name: 'Sign in' }); ok(b.getAttribute('aria-disabled') !== 'true', 'button should be enabled now'); fireEvent.click(b); eq(onLogin.calls, [[{ email: 'a@b.test', password: 'pw' }]]); });`,
      hints: ['`secureTextEntry` hides the characters.', 'A `Pressable` with `disabled` ignores presses and reports itself disabled to assistive tech.'],
    },
    {
      id: 'menu', title: 'SectionList', tier: 2,
      prompt: "Write `Menu({ sections })`, where `sections` looks like `[{ title: 'Drinks', data: ['Tea', 'Coffee'] }, ...]`. Render a `SectionList`:\n\n- each section header is a `Text` with `accessibilityRole=\"header\"` showing the title\n- each item is a `Text` with `testID=\"dish\"`",
      starter: `import { Text, SectionList } from 'react-native';\n\nfunction Menu({ sections }) {\n  return null;\n}\n`,
      solution: `import { Text, SectionList } from 'react-native';\n\nfunction Menu({ sections }) {\n  return (\n    <SectionList\n      sections={sections}\n      keyExtractor={(item) => item}\n      renderSectionHeader={({ section }) => <Text accessibilityRole="header">{section.title}</Text>}\n      renderItem={({ item }) => <Text testID="dish">{item}</Text>}\n    />\n  );\n}\n`,
      tests: `const _m = [{ title: 'Drinks', data: ['Tea', 'Coffee'] }, { title: 'Food', data: ['Soup'] }];
test('headers', () => { render(<Menu sections={_m} />); eq(screen.getAllByRole('heading').map((h) => h.textContent), ['Drinks', 'Food']); });
test('items in order', () => { render(<Menu sections={_m} />); eq(screen.getAllByTestId('dish').map((d) => d.textContent), ['Tea', 'Coffee', 'Soup']); });
test('uses SectionList', () => ok(/SectionList/.test(SOURCE) && /renderSectionHeader/.test(SOURCE)));`,
      hints: ['`SectionList` takes `sections` (each with a `data` array) instead of `data`.', '`renderSectionHeader` receives `{ section }`.'],
    },
    {
      id: 'confirm-modal', title: 'Modal', tier: 3,
      prompt: "Write `DeleteButton({ onConfirm })`:\n\n- a `Pressable` button labelled `Delete`\n- pressing it opens a `Modal` showing the `Text` `Are you sure?` and two buttons: `Cancel` and `Confirm`\n- `Cancel` closes the modal\n- `Confirm` calls `onConfirm()` and closes the modal\n- the modal's `onRequestClose` (the Android back button) also closes it\n\nNothing from the modal is rendered while it is closed.",
      starter: `import { useState } from 'react';\nimport { View, Text, Pressable, Modal } from 'react-native';\n\nfunction DeleteButton({ onConfirm }) {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\nimport { View, Text, Pressable, Modal } from 'react-native';\n\nfunction DeleteButton({ onConfirm }) {\n  const [open, setOpen] = useState(false);\n  const close = () => setOpen(false);\n  return (\n    <View>\n      <Pressable accessibilityRole="button" accessibilityLabel="Delete" onPress={() => setOpen(true)}>\n        <Text>Delete</Text>\n      </Pressable>\n      <Modal visible={open} transparent onRequestClose={close}>\n        <View>\n          <Text>Are you sure?</Text>\n          <Pressable accessibilityRole="button" accessibilityLabel="Cancel" onPress={close}>\n            <Text>Cancel</Text>\n          </Pressable>\n          <Pressable accessibilityRole="button" accessibilityLabel="Confirm" onPress={() => { onConfirm(); close(); }}>\n            <Text>Confirm</Text>\n          </Pressable>\n        </View>\n      </Modal>\n    </View>\n  );\n}\n`,
      tests: `const _open = () => fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
test('closed at first', () => { render(<DeleteButton onConfirm={() => {}} />); eq(screen.queryByText('Are you sure?'), null); });
test('Delete opens the modal', () => { render(<DeleteButton onConfirm={() => {}} />); _open(); ok(screen.getByText('Are you sure?')); ok(screen.getByRole('dialog')); });
test('Cancel closes without confirming', async () => { const onConfirm = spy(); render(<DeleteButton onConfirm={onConfirm} />); _open(); fireEvent.click(screen.getByRole('button', { name: 'Cancel' })); await waitFor(() => eq(screen.queryByText('Are you sure?'), null)); eq(onConfirm.calls.length, 0); });
test('Confirm calls back and closes', async () => { const onConfirm = spy(); render(<DeleteButton onConfirm={onConfirm} />); _open(); fireEvent.click(screen.getByRole('button', { name: 'Confirm' })); eq(onConfirm.calls.length, 1); await waitFor(() => eq(screen.queryByText('Are you sure?'), null)); });
test('handles the back button', () => ok(/onRequestClose/.test(SOURCE), 'pass onRequestClose so the Android back button can dismiss it'));`,
      hints: ['`<Modal visible={open}>` — visibility is just a boolean in state.', '`onRequestClose` is required on Android: it fires when the hardware back button is pressed.'],
    },
    {
      id: 'tab-bar', title: 'A tab bar', tier: 3,
      prompt: "Write `TabBar({ tabs })`, each tab `{ key, label, content }`.\n\n- a `View` with `accessibilityRole=\"tablist\"` and `flexDirection: 'row'`\n- inside, one `Pressable` per tab with `accessibilityRole=\"tab\"`, `flex: 1`, and `aria-selected` set to `true` or `false`\n- the selected tab has a 2-pixel bottom border (`borderBottomWidth: 2`); the others have `0`\n- below, a `Text` with `testID=\"panel\"` shows the selected tab's content\n\nThe first tab starts selected.",
      starter: `import { useState } from 'react';\nimport { View, Text, Pressable, StyleSheet } from 'react-native';\n\nfunction TabBar({ tabs }) {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\nimport { View, Text, Pressable, StyleSheet } from 'react-native';\n\nfunction TabBar({ tabs }) {\n  const [active, setActive] = useState(tabs[0].key);\n  const current = tabs.find((t) => t.key === active);\n  return (\n    <View>\n      <View accessibilityRole="tablist" style={styles.bar}>\n        {tabs.map((t) => (\n          <Pressable key={t.key} accessibilityRole="tab" aria-selected={t.key === active} onPress={() => setActive(t.key)} style={[styles.tab, t.key === active && styles.tabOn]}>\n            <Text>{t.label}</Text>\n          </Pressable>\n        ))}\n      </View>\n      <Text testID="panel">{current.content}</Text>\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  bar: { flexDirection: 'row' },\n  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0 },\n  tabOn: { borderBottomWidth: 2 },\n});\n`,
      tests: `const _t = [{ key: 'home', label: 'Home', content: 'Home screen' }, { key: 'stats', label: 'Stats', content: 'Stats screen' }, { key: 'me', label: 'Me', content: 'Profile screen' }];
const _sel = () => screen.getAllByRole('tab').map((t) => t.getAttribute('aria-selected'));
const _bw = () => screen.getAllByRole('tab').map((t) => css(t).borderBottomWidth);
test('row of equal tabs', () => { render(<TabBar tabs={_t} />); eq(css(screen.getByRole('tablist')).flexDirection, 'row'); eq(screen.getAllByRole('tab').map((t) => css(t).flexGrow), ['1', '1', '1']); });
test('first tab selected', () => { render(<TabBar tabs={_t} />); eq(_sel(), ['true', 'false', 'false']); eq(_bw(), ['2px', '0px', '0px']); eq(screen.getByTestId('panel').textContent, 'Home screen'); });
test('pressing switches tab', () => { render(<TabBar tabs={_t} />); fireEvent.click(screen.getByRole('tab', { name: 'Me' })); eq(_sel(), ['false', 'false', 'true']); eq(_bw(), ['0px', '0px', '2px']); eq(screen.getByTestId('panel').textContent, 'Profile screen'); });`,
      hints: ['`flex: 1` on each tab shares the row equally.', 'Selected styling is the style-array trick again: `[styles.tab, isActive && styles.tabOn]`.'],
    },
    {
      id: 'cart', title: 'Boss: shopping cart', tier: 3,
      prompt: "Write `Cart({ products })` (each `{ id, name, price }`).\n\n- a `FlatList` with one row per product (`testID=\"product\"`) showing the name, and a quantity `Text` with `testID=\"qty-<id>\"` (starts at `0`)\n- each row has buttons labelled `Add <name>` and `Remove <name>`; quantity never goes below 0, and the Remove button is `disabled` at 0\n- a `Text` with `testID=\"total\"` shows `Total: $12.50` — always two decimals\n- a `Clear cart` button resets everything; it is `disabled` while the cart is empty",
      starter: `import { useState } from 'react';\nimport { View, Text, Pressable, FlatList } from 'react-native';\n\nfunction Cart({ products }) {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\nimport { View, Text, Pressable, FlatList } from 'react-native';\n\nfunction Cart({ products }) {\n  const [qty, setQty] = useState({});\n  const change = (id, by) => setQty((q) => ({ ...q, [id]: Math.max(0, (q[id] || 0) + by) }));\n  const total = products.reduce((sum, p) => sum + p.price * (qty[p.id] || 0), 0);\n  const empty = products.every((p) => !qty[p.id]);\n\n  return (\n    <View>\n      <FlatList\n        data={products}\n        extraData={qty}\n        keyExtractor={(p) => p.id}\n        renderItem={({ item }) => (\n          <View testID="product" style={{ flexDirection: 'row', alignItems: 'center' }}>\n            <Text>{item.name}</Text>\n            <Pressable accessibilityRole="button" accessibilityLabel={'Remove ' + item.name} disabled={!qty[item.id]} onPress={() => change(item.id, -1)}>\n              <Text>−</Text>\n            </Pressable>\n            <Text testID={'qty-' + item.id}>{qty[item.id] || 0}</Text>\n            <Pressable accessibilityRole="button" accessibilityLabel={'Add ' + item.name} onPress={() => change(item.id, 1)}>\n              <Text>+</Text>\n            </Pressable>\n          </View>\n        )}\n      />\n      <Text testID="total">Total: \${total.toFixed(2)}</Text>\n      <Pressable accessibilityRole="button" accessibilityLabel="Clear cart" disabled={empty} onPress={() => setQty({})}>\n        <Text>Clear cart</Text>\n      </Pressable>\n    </View>\n  );\n}\n`,
      tests: `const _p = [{ id: 'tea', name: 'Tea', price: 2.5 }, { id: 'cake', name: 'Cake', price: 4.25 }];
const _btn = (name) => screen.getByRole('button', { name });
const _q = (id) => screen.getByTestId('qty-' + id).textContent;
test('starts empty', () => { render(<Cart products={_p} />); eq(screen.getAllByTestId('product').length, 2); eq([_q('tea'), _q('cake')], ['0', '0']); eq(screen.getByTestId('total').textContent, 'Total: $0.00'); });
test('adding updates quantity and total', () => { render(<Cart products={_p} />); fireEvent.click(_btn('Add Tea')); fireEvent.click(_btn('Add Tea')); fireEvent.click(_btn('Add Cake')); eq([_q('tea'), _q('cake')], ['2', '1']); eq(screen.getByTestId('total').textContent, 'Total: $9.25'); });
test('removing', () => { render(<Cart products={_p} />); fireEvent.click(_btn('Add Tea')); fireEvent.click(_btn('Add Tea')); fireEvent.click(_btn('Remove Tea')); eq(_q('tea'), '1'); eq(screen.getByTestId('total').textContent, 'Total: $2.50'); });
test('never below zero; Remove disabled at zero', () => { render(<Cart products={_p} />); eq(_btn('Remove Tea').getAttribute('aria-disabled'), 'true'); fireEvent.click(_btn('Remove Tea')); eq(_q('tea'), '0'); fireEvent.click(_btn('Add Tea')); ok(_btn('Remove Tea').getAttribute('aria-disabled') !== 'true'); });
test('Clear cart', () => { render(<Cart products={_p} />); eq(_btn('Clear cart').getAttribute('aria-disabled'), 'true'); fireEvent.click(_btn('Add Cake')); ok(_btn('Clear cart').getAttribute('aria-disabled') !== 'true'); fireEvent.click(_btn('Clear cart')); eq(_q('cake'), '0'); eq(screen.getByTestId('total').textContent, 'Total: $0.00'); });`,
      hints: ['One piece of state covers it: an object mapping product id → quantity. Total and "is empty" are derived.', '`FlatList` skips re-rendering rows when `data` is unchanged. Pass `extraData={qty}` to tell it rows depend on something else.', '`number.toFixed(2)` formats money.'],
    },
    {
      id: 'stepper', title: 'A quantity stepper', tier: 1,
      prompt: "Write `Stepper`. A `Text` with `testID=\"qty\"` shows the quantity, starting at `1`. Two `Pressable` buttons labelled `Decrease` and `Increase` change it. The quantity never goes below `1`, and `Decrease` is `disabled` while it is at 1.",
      starter: `import { useState } from 'react';\nimport { View, Text, Pressable } from 'react-native';\n\nfunction Stepper() {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\nimport { View, Text, Pressable } from 'react-native';\n\nfunction Stepper() {\n  const [qty, setQty] = useState(1);\n  return (\n    <View style={{ flexDirection: 'row', alignItems: 'center' }}>\n      <Pressable accessibilityRole="button" accessibilityLabel="Decrease" disabled={qty <= 1} onPress={() => setQty((q) => Math.max(1, q - 1))}>\n        <Text>−</Text>\n      </Pressable>\n      <Text testID="qty">{qty}</Text>\n      <Pressable accessibilityRole="button" accessibilityLabel="Increase" onPress={() => setQty((q) => q + 1)}>\n        <Text>+</Text>\n      </Pressable>\n    </View>\n  );\n}\n`,
      tests: `const _q = () => screen.getByTestId('qty').textContent;
const _b = (n) => screen.getByRole('button', { name: n });
test('starts at 1, cannot decrease', () => { render(<Stepper />); eq(_q(), '1'); eq(_b('Decrease').getAttribute('aria-disabled'), 'true'); });
test('increase then decrease', () => { render(<Stepper />); fireEvent.click(_b('Increase')); fireEvent.click(_b('Increase')); eq(_q(), '3'); ok(_b('Decrease').getAttribute('aria-disabled') !== 'true'); fireEvent.click(_b('Decrease')); eq(_q(), '2'); });
test('never below 1', () => { render(<Stepper />); fireEvent.click(_b('Decrease')); eq(_q(), '1'); });`,
      hints: ['`disabled={qty <= 1}` — derive it from state.', 'Icon-like buttons (`+`, `−`) need an `accessibilityLabel` to be meaningful to a screen reader.'],
    },
    {
      id: 'notification-icon', title: 'Absolute positioning', tier: 1,
      prompt: "Write `NotificationIcon({ count })`. A `View` with `testID=\"icon\"` holds a bell `Text` (`🔔`). When `count` is greater than 0, a badge `View` (`testID=\"badge\"`) sits over its top-right corner: `position: 'absolute'`, `top: -4`, `right: -4`, background `#dc2626`. The badge text is the count, or `9+` above nine. With a count of 0 there is no badge at all.",
      starter: `import { View, Text, StyleSheet } from 'react-native';\n\nfunction NotificationIcon({ count }) {\n  return null;\n}\n`,
      solution: `import { View, Text, StyleSheet } from 'react-native';\n\nfunction NotificationIcon({ count }) {\n  return (\n    <View testID="icon" style={styles.icon}>\n      <Text>🔔</Text>\n      {count > 0 && (\n        <View testID="badge" style={styles.badge}>\n          <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>\n        </View>\n      )}\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  icon: { width: 32, height: 32 },\n  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#dc2626', borderRadius: 9, minWidth: 18, alignItems: 'center' },\n  badgeText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },\n});\n`,
      tests: `test('no badge at zero', () => { render(<NotificationIcon count={0} />); ok(screen.getByTestId('icon')); eq(screen.queryByTestId('badge'), null); });
test('shows the count', () => { render(<NotificationIcon count={3} />); eq(screen.getByTestId('badge').textContent, '3'); });
test('caps at 9+', () => { render(<NotificationIcon count={42} />); eq(screen.getByTestId('badge').textContent, '9+'); });
test('badge is pinned to the corner', () => { render(<NotificationIcon count={1} />); const s = css(screen.getByTestId('badge')); eq([s.position, s.top, s.right, s.backgroundColor], ['absolute', '-4px', '-4px', 'rgb(220, 38, 38)']); });
test('does not render a stray 0', () => { render(<NotificationIcon count={0} />); eq(screen.getByTestId('icon').textContent, '🔔'); });`,
      hints: ['An absolutely positioned child is placed relative to its parent `View`.', 'Careful with `{count && <Badge />}` — when `count` is `0`, React renders the `0`, and in React Native a bare number outside `Text` is a crash. Use `count > 0 &&`.'],
    },
    {
      id: 'accordion', title: 'Expand and collapse', tier: 2,
      prompt: "Write `FaqItem({ question, answer })`. The question is a `Pressable` (`accessibilityRole=\"button\"`) showing the question text; pressing it toggles the answer `Text` (`testID=\"answer\"`) below. The answer is not rendered while collapsed. Reflect the state with `aria-expanded` on the button.",
      starter: `import { useState } from 'react';\nimport { View, Text, Pressable } from 'react-native';\n\nfunction FaqItem({ question, answer }) {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\nimport { View, Text, Pressable } from 'react-native';\n\nfunction FaqItem({ question, answer }) {\n  const [open, setOpen] = useState(false);\n  return (\n    <View>\n      <Pressable accessibilityRole="button" aria-expanded={open} onPress={() => setOpen((o) => !o)}>\n        <Text>{question}</Text>\n      </Pressable>\n      {open && <Text testID="answer">{answer}</Text>}\n    </View>\n  );\n}\n`,
      tests: `const _btn = () => screen.getByRole('button', { name: 'Do you ship?' });
test('collapsed at first', () => { render(<FaqItem question="Do you ship?" answer="Yes, worldwide." />); eq(screen.queryByTestId('answer'), null); eq(_btn().getAttribute('aria-expanded'), 'false'); });
test('press expands', () => { render(<FaqItem question="Do you ship?" answer="Yes, worldwide." />); fireEvent.click(_btn()); eq(screen.getByTestId('answer').textContent, 'Yes, worldwide.'); eq(_btn().getAttribute('aria-expanded'), 'true'); });
test('press again collapses', () => { render(<FaqItem question="Do you ship?" answer="Yes, worldwide." />); fireEvent.click(_btn()); fireEvent.click(_btn()); eq(screen.queryByTestId('answer'), null); });`,
      hints: ['`{open && <Text>…</Text>}` mounts the answer only when open.', '`aria-expanded={open}` tells assistive tech whether the section is showing.'],
    },
    {
      id: 'progress-bar', title: 'A progress bar', tier: 2,
      prompt: "Write `ProgressBar({ progress })`, where `progress` is a number from 0 to 1.\n\n- an outer `View` (`testID=\"track\"`) with `accessibilityRole=\"progressbar\"`, height 8, background `#e5e7eb`\n- an inner `View` (`testID=\"fill\"`) whose `width` is the percentage as a string, e.g. `'40%'`, background `#2563eb`\n- expose the value with `aria-valuenow` as a whole percentage (0–100), plus `aria-valuemin={0}` and `aria-valuemax={100}`\n\nValues outside 0–1 are clamped.",
      starter: `import { View, StyleSheet } from 'react-native';\n\nfunction ProgressBar({ progress }) {\n  return null;\n}\n`,
      solution: `import { View, StyleSheet } from 'react-native';\n\nfunction ProgressBar({ progress }) {\n  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);\n  return (\n    <View testID="track" accessibilityRole="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} style={styles.track}>\n      <View testID="fill" style={[styles.fill, { width: pct + '%' }]} />\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  track: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },\n  fill: { height: 8, backgroundColor: '#2563eb' },\n});\n`,
      tests: `const _w = () => css(screen.getByTestId('fill')).width;
const _now = () => screen.getByRole('progressbar').getAttribute('aria-valuenow');
test('40 percent', () => { render(<ProgressBar progress={0.4} />); eq(_w(), '40%'); eq(_now(), '40'); });
test('track style', () => { render(<ProgressBar progress={0.4} />); const s = css(screen.getByTestId('track')); eq([s.height, s.backgroundColor], ['8px', 'rgb(229, 231, 235)']); eq(css(screen.getByTestId('fill')).backgroundColor, 'rgb(37, 99, 235)'); });
test('clamps high and low', () => { const { rerender } = render(<ProgressBar progress={1.7} />); eq([_w(), _now()], ['100%', '100']); rerender(<ProgressBar progress={-2} />); eq([_w(), _now()], ['0%', '0']); });
test('min and max are announced', () => { render(<ProgressBar progress={0.5} />); const b = screen.getByRole('progressbar'); eq([b.getAttribute('aria-valuemin'), b.getAttribute('aria-valuemax')], ['0', '100']); });`,
      hints: ['Percentages are the one place React Native takes a string size: `width: "40%"`.', 'Dynamic values go in an inline object appended to the style array: `[styles.fill, { width }]`.', 'A bar with no ARIA values is just a coloured rectangle to a screen reader.'],
    },
    {
      id: 'composer', title: 'Character limit', tier: 2,
      prompt: "Write `Composer({ max = 20, onPost })`.\n\n- a multiline `TextInput` labelled `Message`\n- a counter `Text` (`testID=\"counter\"`) reading `N/20`, coloured `#6b7280` normally and `#dc2626` once the text is over the limit\n- a `Post` button, `disabled` while the message is empty (ignoring whitespace) or over the limit\n- pressing `Post` calls `onPost(text)` with the trimmed text and clears the input",
      starter: `import { useState } from 'react';\nimport { View, Text, TextInput, Pressable } from 'react-native';\n\nfunction Composer({ max = 20, onPost }) {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\nimport { View, Text, TextInput, Pressable } from 'react-native';\n\nfunction Composer({ max = 20, onPost }) {\n  const [text, setText] = useState('');\n  const over = text.length > max;\n  const blocked = over || text.trim().length === 0;\n  return (\n    <View>\n      <TextInput accessibilityLabel="Message" multiline value={text} onChangeText={setText} />\n      <Text testID="counter" style={{ color: over ? '#dc2626' : '#6b7280' }}>{text.length}/{max}</Text>\n      <Pressable accessibilityRole="button" accessibilityLabel="Post" disabled={blocked} onPress={() => { onPost(text.trim()); setText(''); }}>\n        <Text>Post</Text>\n      </Pressable>\n    </View>\n  );\n}\n`,
      tests: `const _type = (v) => fireEvent.change(screen.getByLabelText('Message'), { target: { value: v } });
const _post = () => screen.getByRole('button', { name: 'Post' });
const _off = () => _post().getAttribute('aria-disabled') === 'true';
test('empty: counter 0, Post disabled', () => { render(<Composer onPost={() => {}} />); eq(screen.getByTestId('counter').textContent, '0/20'); eq(_off(), true); eq(screen.getByLabelText('Message').tagName, 'TEXTAREA'); });
test('counts as you type', () => { render(<Composer max={10} onPost={() => {}} />); _type('hello'); eq(screen.getByTestId('counter').textContent, '5/10'); eq(css(screen.getByTestId('counter')).color, 'rgb(107, 114, 128)'); eq(_off(), false); });
test('over the limit turns red and blocks', () => { render(<Composer max={5} onPost={() => {}} />); _type('too long'); eq(screen.getByTestId('counter').textContent, '8/5'); eq(css(screen.getByTestId('counter')).color, 'rgb(220, 38, 38)'); eq(_off(), true); });
test('whitespace only is blocked', () => { render(<Composer onPost={() => {}} />); _type('    '); eq(_off(), true); });
test('posting sends trimmed text and clears', () => { const onPost = spy(); render(<Composer onPost={onPost} />); _type('  hi there '); fireEvent.click(_post()); eq(onPost.calls, [['hi there']]); eq(screen.getByLabelText('Message').value, ''); eq(screen.getByTestId('counter').textContent, '0/20'); });`,
      hints: ['`multiline` turns a `TextInput` into a text area.', 'Two derived booleans do the work: "over the limit" and "blocked".'],
    },
    {
      id: 'loading-button', title: 'A button with a busy state', tier: 2,
      prompt: "Write `SubmitButton({ title, loading, onPress })` — a `Pressable` with `accessibilityRole=\"button\"`.\n\n- normally it shows the title in a `Text`\n- while `loading` it shows an `ActivityIndicator` **instead of** the title, is `disabled`, and sets `aria-busy`\n- its accessible name is always the title (`accessibilityLabel`), so a screen reader still knows what the spinner belongs to",
      starter: `import { Text, Pressable, ActivityIndicator } from 'react-native';\n\nfunction SubmitButton({ title, loading, onPress }) {\n  return null;\n}\n`,
      solution: `import { Text, Pressable, ActivityIndicator } from 'react-native';\n\nfunction SubmitButton({ title, loading, onPress }) {\n  return (\n    <Pressable accessibilityRole="button" accessibilityLabel={title} aria-busy={!!loading} disabled={!!loading} onPress={onPress}>\n      {loading ? <ActivityIndicator /> : <Text>{title}</Text>}\n    </Pressable>\n  );\n}\n`,
      tests: `const _b = () => screen.getByRole('button', { name: 'Save' });
test('idle: shows the title and responds', () => { const onPress = spy(); render(<SubmitButton title="Save" onPress={onPress} />); eq(_b().textContent, 'Save'); eq(screen.queryByRole('progressbar'), null); fireEvent.click(_b()); eq(onPress.calls.length, 1); });
test('loading: spinner replaces the title', () => { render(<SubmitButton title="Save" loading onPress={() => {}} />); ok(screen.getByRole('progressbar')); eq(_b().textContent, ''); });
test('loading: disabled and busy', () => { const onPress = spy(); render(<SubmitButton title="Save" loading onPress={onPress} />); eq(_b().getAttribute('aria-disabled'), 'true'); eq(_b().getAttribute('aria-busy'), 'true'); fireEvent.click(_b()); eq(onPress.calls.length, 0); });`,
      hints: ['A ternary picks between the spinner and the text.', 'Disabling while loading is what stops a double-tap from submitting twice.'],
    },
    {
      id: 'todo-screen', title: 'Boss: todo screen', tier: 3,
      prompt: "Write `TodoScreen`:\n\n- a `TextInput` labelled `New task` and an `Add` button. Adding trims the text, ignores blanks, and clears the input. Pressing **Enter** in the input (`onSubmitEditing`) adds too.\n- a `FlatList` of tasks. Each row has a `Pressable` with `accessibilityRole=\"checkbox\"`, labelled with the task text, with `aria-checked`; pressing it toggles done. Done tasks show their text with `textDecorationLine: 'line-through'` (give that `Text` the `testID` `task-text`).\n- each row has a button labelled `Remove <task>`\n- a `Text` with `testID=\"summary\"` reads `N of M done`\n- when there are no tasks, the list shows `Nothing to do`",
      starter: `import { useState } from 'react';\nimport { View, Text, TextInput, Pressable, FlatList } from 'react-native';\n\nfunction TodoScreen() {\n  return null;\n}\n`,
      solution: `import { useState } from 'react';\nimport { View, Text, TextInput, Pressable, FlatList } from 'react-native';\n\nlet nextId = 1;\n\nfunction TodoScreen() {\n  const [tasks, setTasks] = useState([]);\n  const [text, setText] = useState('');\n\n  const add = () => {\n    const clean = text.trim();\n    if (!clean) return;\n    setTasks((t) => [...t, { id: String(nextId++), text: clean, done: false }]);\n    setText('');\n  };\n  const toggle = (id) => setTasks((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));\n  const remove = (id) => setTasks((t) => t.filter((x) => x.id !== id));\n\n  return (\n    <View>\n      <TextInput accessibilityLabel="New task" value={text} onChangeText={setText} onSubmitEditing={add} />\n      <Pressable accessibilityRole="button" accessibilityLabel="Add" onPress={add}><Text>Add</Text></Pressable>\n      <FlatList\n        data={tasks}\n        keyExtractor={(t) => t.id}\n        ListEmptyComponent={<Text>Nothing to do</Text>}\n        renderItem={({ item }) => (\n          <View style={{ flexDirection: 'row' }}>\n            <Pressable accessibilityRole="checkbox" accessibilityLabel={item.text} aria-checked={item.done} onPress={() => toggle(item.id)}>\n              <Text testID="task-text" style={item.done && { textDecorationLine: 'line-through' }}>{item.text}</Text>\n            </Pressable>\n            <Pressable accessibilityRole="button" accessibilityLabel={'Remove ' + item.text} onPress={() => remove(item.id)}><Text>×</Text></Pressable>\n          </View>\n        )}\n      />\n      <Text testID="summary">{tasks.filter((t) => t.done).length} of {tasks.length} done</Text>\n    </View>\n  );\n}\n`,
      tests: `const _in = () => screen.getByLabelText('New task');
const _add = (t) => { fireEvent.change(_in(), { target: { value: t } }); fireEvent.click(screen.getByRole('button', { name: 'Add' })); };
const _sum = () => screen.getByTestId('summary').textContent;
const _struck = () => screen.queryAllByTestId('task-text').map((t) => css(t).getPropertyValue('text-decoration-line') === 'line-through');
test('empty state', () => { render(<TodoScreen />); ok(screen.getByText('Nothing to do')); eq(_sum(), '0 of 0 done'); });
test('adds tasks and clears the input', () => { render(<TodoScreen />); _add('  Buy milk '); _add('Call Sam'); eq(screen.getAllByRole('checkbox').map((c) => c.getAttribute('aria-label')), ['Buy milk', 'Call Sam']); eq(_in().value, ''); eq(_sum(), '0 of 2 done'); eq(screen.queryByText('Nothing to do'), null); });
test('ignores blanks', () => { render(<TodoScreen />); _add('   '); eq(screen.queryAllByRole('checkbox').length, 0); });
test('Enter adds too', () => { render(<TodoScreen />); fireEvent.change(_in(), { target: { value: 'Typed' } }); fireEvent.keyDown(_in(), { key: 'Enter' }); ok(screen.getByRole('checkbox', { name: 'Typed' })); });
test('toggle marks done', () => { render(<TodoScreen />); _add('A'); _add('B'); fireEvent.click(screen.getByRole('checkbox', { name: 'B' })); eq(screen.getAllByRole('checkbox').map((c) => c.getAttribute('aria-checked')), ['false', 'true']); eq(_struck(), [false, true]); eq(_sum(), '1 of 2 done'); });
test('remove', () => { render(<TodoScreen />); _add('A'); _add('B'); fireEvent.click(screen.getByRole('button', { name: 'Remove A' })); eq(screen.getAllByRole('checkbox').map((c) => c.getAttribute('aria-label')), ['B']); eq(_sum(), '0 of 1 done'); });
test('duplicate text is allowed', () => { render(<TodoScreen />); _add('Same'); _add('Same'); eq(screen.getAllByRole('checkbox').length, 2); });`,
      hints: ['State: the task list and the input text. The summary is derived.', '`onSubmitEditing` fires when the keyboard\'s return key is pressed.', 'Give every task its own id for `keyExtractor` — two tasks can share the same text.', 'Update immutably with `map` and `filter`; `FlatList` re-renders rows when `data` is a new array.'],
    },
  ],
  drills: [
    { q: 'What happens if you put a bare string directly inside a `<View>`?', choices: ['It renders normally', 'It is an error — text must be wrapped in `<Text>`', 'It renders invisible', 'It becomes a label'], answer: 1, why: 'Native platforms have no anonymous text nodes. Every string needs a `<Text>` parent.' },
    { q: 'What is the default `flexDirection` in React Native?', choices: ['row', 'column', 'row-reverse', 'There is none'], answer: 1, why: 'Phones are tall, so children stack vertically by default — the opposite of CSS on the web.' },
    { q: 'What unit is `width: 100` in?', choices: ['Physical pixels', 'Density-independent pixels', 'Percent', 'Points only on iOS'], answer: 1, why: 'Sizes are unitless dp: the same number looks the same physical size across screen densities.' },
    { q: 'Which component should render a list of 5,000 rows?', choices: ['ScrollView with .map()', 'FlatList', 'View', 'SectionView'], answer: 1, why: 'ScrollView mounts every child at once. FlatList virtualises — it only mounts what is near the viewport.' },
    { q: 'What is the press handler on a `Pressable` called?', choices: ['onClick', 'onPress', 'onTap', 'onTouch'], answer: 1, why: 'There is no click on a touch screen. `onPress`, plus `onLongPress`, `onPressIn` and `onPressOut`.' },
    { q: 'How do you apply two styles, with the second overriding the first?', choices: ['style={styles.a + styles.b}', 'style={[styles.a, styles.b]}', 'className="a b"', 'style={styles.a, styles.b}'], answer: 1, why: 'Style arrays merge left to right. There are no class names and no cascade in React Native.' },
    { q: 'Do styles cascade from a parent `View` to child `Text`?', choices: ['Yes, like CSS', 'No — only `Text` nested inside `Text` inherits text styles', 'Only colours do', 'Only on Android'], answer: 1, why: 'There is no inheritance across Views. Set text styles on the Text itself, or build a shared `AppText` component.' },
    { q: 'How do you run different code on iOS and Android?', choices: ['navigator.userAgent', 'Platform.OS or Platform.select', 'process.platform', 'window.device'], answer: 1, why: '`Platform.OS` is "ios", "android" or "web". `Platform.select({ ios: a, android: b })` picks a value.' },
    { q: 'What does `flex: 1` mean on a child?', choices: ['Width of 1 pixel', 'Grow to fill the available space along the main axis', 'Opacity of 1', 'Z-index 1'], answer: 1, why: 'Siblings share free space in proportion to their flex values; `flex: 1` alone takes all of it.' },
    { q: 'What does `SafeAreaView` protect against?', choices: ['Network errors', 'Content hidden under notches, rounded corners and system bars', 'Memory leaks', 'Slow renders'], answer: 1, why: 'It pads content into the part of the screen that is actually visible on notched devices.' },
    { q: 'Why does a remote `<Image>` often render as nothing?', choices: ['Missing key', 'No width and height were set', 'Images need Text', 'It needs onLoad'], answer: 1, why: 'Local images know their size at build time. For a URL, React Native cannot guess — give it dimensions.' },
    { q: 'What replaces the `alt` attribute for images and icon buttons?', choices: ['title', 'accessibilityLabel', 'aria-alt', 'name'], answer: 1, why: '`accessibilityLabel` is read by VoiceOver and TalkBack. Pair it with `accessibilityRole` on custom controls.' },
    { q: 'Which prop tells a `FlatList` how to identify each row?', choices: ['key', 'keyExtractor', 'rowId', 'index'], answer: 1, why: '`keyExtractor={(item) => item.id}`. Without it, FlatList looks for an `item.key` and then falls back to the index.' },
    { q: 'How do you make a `TextInput` hide what is typed?', choices: ['type="password"', 'secureTextEntry', 'hidden', 'mask'], answer: 1, why: 'There is no `type` attribute. Related props: `keyboardType`, `autoCapitalize`, `autoCorrect`.' },
    { q: 'What does `justifyContent` control in a default (column) container?', choices: ['Horizontal alignment', 'Vertical distribution along the main axis', 'Text alignment', 'Padding'], answer: 1, why: 'It always works along the main axis — vertical in a column. `alignItems` handles the cross axis.' },
    { q: 'Which component keeps inputs visible when the on-screen keyboard opens?', choices: ['ScrollView', 'KeyboardAvoidingView', 'SafeAreaView', 'Modal'], answer: 1, why: 'It shifts or pads its content by the keyboard height. The right `behavior` differs between iOS and Android.' },
    { q: 'How are styles different from CSS on the web?', choices: ['They are identical', 'camelCase properties in JavaScript objects, no selectors, no cascade', 'They use SCSS', 'They are written in XML'], answer: 1, why: '`backgroundColor`, not `background-color`. Each component is styled directly; nothing is inherited from a stylesheet.' },
    { q: 'What does Expo provide?', choices: ['A different language', 'Tooling and prebuilt native modules so you can build without Xcode or Android Studio at first', 'A UI kit only', 'A replacement for React'], answer: 1, why: 'It is the recommended way to start. You can still add custom native code later.' },
    { q: 'Where do you store a small piece of data that must survive app restarts?', choices: ['useState', 'AsyncStorage (or a secure store for secrets)', 'A global variable', 'localStorage'], answer: 1, why: 'There is no `localStorage` on native. AsyncStorage is unencrypted — tokens and passwords belong in the keychain/keystore.' },
    { q: 'What does `onPress` receive that a web `onClick` does not make you think about?', choices: ['Nothing different', 'It fires for touches, and `Pressable` adds `onLongPress`, `onPressIn` and `onPressOut`', 'A keyboard event', 'A DOM node'], answer: 1, why: 'Touch has more states than a click. `Pressable` also exposes a `pressed` flag for styling.' },
    { q: 'What is the usual library for moving between screens?', choices: ['react-router-dom', 'React Navigation (or Expo Router)', 'next/navigation', 'window.history'], answer: 1, why: 'Native apps use stacks, tabs and drawers rather than URLs. Expo Router adds file-based routes on top.' },
    { q: 'Why can a list of 1,000 rows inside a `ScrollView` be slow?', choices: ['ScrollView cannot scroll that far', 'It renders every row at once', 'It needs keys', 'It disables the GPU'], answer: 1, why: 'Use `FlatList` or `SectionList`: they mount only the rows near the screen and recycle as you scroll.' },
    { q: 'What does `hitSlop` do on a `Pressable`?', choices: ['Adds a visible border', 'Extends the touchable area beyond the element without changing its look', 'Delays the press', 'Disables the press'], answer: 1, why: 'Small icons are hard to hit. Platform guidelines ask for touch targets of roughly 44–48 points.' },
    { q: 'What does Fast Refresh do during development?', choices: ['Rebuilds the whole app', 'Applies your edit to the running app while keeping component state', 'Clears the cache', 'Runs the tests'], answer: 1, why: 'Save a file and the screen updates in about a second, usually without losing where you were.' },
  ],
};
