'use strict';
// App Router exercises. Each one is a single file you would find in `app/`:
// a route handler, a page, a layout piece, middleware or a server action.
// `next/*` imports resolve to stand-ins that keep Next's real contracts.
// Tests have: NextRequest, NextResponse, nextNav, nextStore, setCookies,
// redirectOf(fn), isNotFound(fn), mockFetch, render/screen/fireEvent, SOURCE.

const P = (o) => `{ params: Promise.resolve(${JSON.stringify(o)}) }`;

module.exports = {
  id: 'nextjs',
  name: 'Next.js',
  short: 'Nx',
  blurb: 'The App Router: route handlers, server components, navigation, middleware, server actions.',
  lang: 'tsx',
  runner: { kind: 'node', loader: 'tsx', env: 'next' },
  challenges: [
    {
      id: 'route-get', title: 'A route handler', tier: 1,
      prompt: "File: `app/api/hello/route.ts`\n\nExport an async `GET` function that responds with the JSON `{ \"message\": \"Hello from the dojo\" }`.",
      starter: `export async function GET() {\n  \n}\n`,
      solution: `export async function GET() {\n  return Response.json({ message: 'Hello from the dojo' });\n}\n`,
      tests: `test('returns JSON', async () => { const r = await GET(); ok(r instanceof Response, 'return a Response'); eq(r.status, 200); eq(await r.json(), { message: 'Hello from the dojo' }); });
test('sets a JSON content type', async () => ok((await GET()).headers.get('content-type').includes('application/json')));`,
      hints: ['A route handler exports functions named after HTTP methods: `GET`, `POST`, …', '`Response.json(data)` builds a JSON response with the right header.'],
    },
    {
      id: 'route-params', title: 'Dynamic segments', tier: 1,
      prompt: "File: `app/api/users/[id]/route.ts`\n\nThe folder name `[id]` captures part of the URL. Export `GET(request, { params })` responding with `{ \"id\": <number>, \"path\": \"/api/users/<id>\" }`.\n\nIn current Next.js, `params` is a **Promise** — await it.",
      starter: `export async function GET(request, { params }) {\n  \n}\n`,
      solution: `export async function GET(request, { params }) {\n  const { id } = await params;\n  return Response.json({ id: Number(id), path: '/api/users/' + id });\n}\n`,
      tests: `test('reads the id', async () => eq(await (await GET(new NextRequest('http://localhost/api/users/42'), ${P({ id: '42' })})).json(), { id: 42, path: '/api/users/42' }));
test('id is a number', async () => eq(typeof (await (await GET(new NextRequest('http://localhost/api/users/7'), ${P({ id: '7' })})).json()).id, 'number'));`,
      hints: ['The second argument is a context object: `{ params }`.', '`const { id } = await params;` — URL segments always arrive as strings.'],
    },
    {
      id: 'route-query', title: 'Query strings', tier: 1,
      prompt: "File: `app/api/search/route.ts`\n\nExport `GET(request)`. Read the `q` and `page` query parameters and respond with `{ q, page }` where `page` is a number defaulting to `1`. If `q` is missing, respond with status `400` and `{ \"error\": \"q is required\" }`.",
      starter: `export async function GET(request) {\n  \n}\n`,
      solution: `export async function GET(request) {\n  const { searchParams } = new URL(request.url);\n  const q = searchParams.get('q');\n  if (!q) return Response.json({ error: 'q is required' }, { status: 400 });\n  return Response.json({ q, page: Number(searchParams.get('page') ?? 1) });\n}\n`,
      tests: `const _get = (qs) => GET(new NextRequest('http://localhost/api/search' + qs));
test('reads q and page', async () => eq(await (await _get('?q=rust&page=3')).json(), { q: 'rust', page: 3 }));
test('page defaults to 1', async () => eq(await (await _get('?q=rust')).json(), { q: 'rust', page: 1 }));
test('missing q is a 400', async () => { const r = await _get(''); eq(r.status, 400); eq(await r.json(), { error: 'q is required' }); });`,
      hints: ['`new URL(request.url).searchParams` — or `request.nextUrl.searchParams` on a NextRequest.', 'The second argument to `Response.json` takes `{ status }`.'],
    },
    {
      id: 'route-post', title: 'POST with validation', tier: 2,
      prompt: "File: `app/api/todos/route.ts`\n\nAn in-memory `todos` array is provided. Export:\n\n- `GET` → all todos as JSON\n- `POST` → reads a JSON body `{ title }`. If `title` is missing, not a string, or blank: `400` with `{ \"error\": \"title is required\" }`. Otherwise append `{ id, title, done: false }` (ids count up from 1, title trimmed) and respond `201` with the new todo.",
      starter: `const todos = [];\n\nexport async function GET() {\n  \n}\n\nexport async function POST(request) {\n  \n}\n`,
      solution: `const todos = [];\n\nexport async function GET() {\n  return Response.json(todos);\n}\n\nexport async function POST(request) {\n  const body = await request.json().catch(() => null);\n  const title = body && typeof body.title === 'string' ? body.title.trim() : '';\n  if (!title) return Response.json({ error: 'title is required' }, { status: 400 });\n  const todo = { id: todos.length + 1, title, done: false };\n  todos.push(todo);\n  return Response.json(todo, { status: 201 });\n}\n`,
      tests: `const _post = (body) => POST(new NextRequest('http://localhost/api/todos', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) }));
test('creates a todo', async () => { const r = await _post({ title: '  Learn Next  ' }); eq(r.status, 201); eq(await r.json(), { id: 1, title: 'Learn Next', done: false }); });
test('GET lists them', async () => { await _post({ title: 'Second' }); eq((await (await GET()).json()).map((t) => t.title), ['Learn Next', 'Second']); });
test('rejects a missing title', async () => { const r = await _post({}); eq(r.status, 400); eq(await r.json(), { error: 'title is required' }); });
test('rejects blank and non-string titles', async () => { eq((await _post({ title: '   ' })).status, 400); eq((await _post({ title: 5 })).status, 400); });`,
      hints: ['`await request.json()` parses the body.', 'Status `201 Created` is the conventional answer to a successful POST that makes something.', 'Validate before you trust: check the type, then trim.'],
    },
    {
      id: 'route-404', title: 'Not found, properly', tier: 2,
      prompt: "File: `app/api/products/[slug]/route.ts`\n\nUsing the provided `PRODUCTS`, export `GET` that responds with the matching product, or `404` with `{ \"error\": \"Product not found\" }`. Also export `DELETE`, which removes the product and responds with status `204` and **no body**, or the same 404.",
      starter: `const PRODUCTS = [\n  { slug: 'laptop', price: 1200 },\n  { slug: 'monitor', price: 300 },\n];\n\nexport async function GET(request, { params }) {\n  \n}\n\nexport async function DELETE(request, { params }) {\n  \n}\n`,
      solution: `const PRODUCTS = [\n  { slug: 'laptop', price: 1200 },\n  { slug: 'monitor', price: 300 },\n];\n\nconst missing = () => Response.json({ error: 'Product not found' }, { status: 404 });\n\nexport async function GET(request, { params }) {\n  const { slug } = await params;\n  const product = PRODUCTS.find((p) => p.slug === slug);\n  return product ? Response.json(product) : missing();\n}\n\nexport async function DELETE(request, { params }) {\n  const { slug } = await params;\n  const i = PRODUCTS.findIndex((p) => p.slug === slug);\n  if (i === -1) return missing();\n  PRODUCTS.splice(i, 1);\n  return new Response(null, { status: 204 });\n}\n`,
      tests: `const _rq = new NextRequest('http://localhost/api/products/x');
test('finds a product', async () => eq(await (await GET(_rq, ${P({ slug: 'monitor' })})).json(), { slug: 'monitor', price: 300 }));
test('404 for unknown', async () => { const r = await GET(_rq, ${P({ slug: 'nope' })}); eq(r.status, 404); eq(await r.json(), { error: 'Product not found' }); });
test('DELETE answers 204 with no body', async () => { const r = await DELETE(_rq, ${P({ slug: 'laptop' })}); eq(r.status, 204); eq(await r.text(), ''); });
test('deleted product is gone', async () => eq((await GET(_rq, ${P({ slug: 'laptop' })})).status, 404));
test('DELETE unknown is 404', async () => eq((await DELETE(_rq, ${P({ slug: 'laptop' })})).status, 404));`,
      hints: ['`Array.prototype.find` returns `undefined` when nothing matches.', 'A 204 must not carry a body: `new Response(null, { status: 204 })`.'],
    },
    {
      id: 'server-page', title: 'An async server component', tier: 1,
      prompt: "File: `app/posts/page.tsx`\n\nServer components can be `async` and fetch data directly — no `useEffect`. Export a default async component `Page` that fetches `https://api.dojo.test/posts` (an array of `{ id, title }`) and renders an `<h1>Posts</h1>` and a `<ul>` with each title in an `<li>`.",
      starter: `export default async function Page() {\n  return null;\n}\n`,
      solution: `export default async function Page() {\n  const res = await fetch('https://api.dojo.test/posts');\n  const posts = await res.json();\n  return (\n    <main>\n      <h1>Posts</h1>\n      <ul>\n        {posts.map((p) => <li key={p.id}>{p.title}</li>)}\n      </ul>\n    </main>\n  );\n}\n`,
      tests: `test('renders fetched posts', async () => { const calls = mockFetch({ 'https://api.dojo.test/posts': [{ id: 1, title: 'Hello' }, { id: 2, title: 'World' }] }); render(await Page()); eq(screen.getByRole('heading', { level: 1 }).textContent, 'Posts'); eq(screen.getAllByRole('listitem').map((l) => l.textContent), ['Hello', 'World']); eq(calls.length, 1); });
test('no client hooks needed', () => ok(!/useEffect|useState/.test(SOURCE), 'a server component fetches with plain await'));`,
      hints: ['Mark the component `async` and `await fetch(...)` right in its body.', 'This code runs on the server, so secrets and database calls are safe here.'],
    },
    {
      id: 'page-notfound', title: 'Dynamic page + notFound()', tier: 2,
      prompt: "File: `app/posts/[id]/page.tsx`\n\nExport a default async `Page({ params })`. Fetch `https://api.dojo.test/posts/<id>`. If the response is not `ok`, call `notFound()` from `next/navigation`. Otherwise render the post's `title` in an `<h1>` and its `body` in a `<p>`.",
      starter: `import { notFound } from 'next/navigation';\n\nexport default async function Page({ params }) {\n  return null;\n}\n`,
      solution: `import { notFound } from 'next/navigation';\n\nexport default async function Page({ params }) {\n  const { id } = await params;\n  const res = await fetch('https://api.dojo.test/posts/' + id);\n  if (!res.ok) notFound();\n  const post = await res.json();\n  return (\n    <article>\n      <h1>{post.title}</h1>\n      <p>{post.body}</p>\n    </article>\n  );\n}\n`,
      tests: `test('renders the post', async () => { mockFetch({ '/posts/5': { title: 'Five', body: 'Body text' } }); render(await Page(${P({ id: '5' })})); eq(screen.getByRole('heading', { level: 1 }).textContent, 'Five'); ok(screen.getByText('Body text')); });
test('missing post triggers notFound()', async () => { mockFetch({}); eq(await isNotFound(() => Page(${P({ id: '404' })})), true); });`,
      hints: ['`notFound()` throws a special error that Next catches to render `not-found.tsx`, so nothing after it runs.', '`fetch` resolves even on a 404 — look at `res.ok`.'],
    },
    {
      id: 'metadata', title: 'generateMetadata', tier: 2,
      prompt: "File: `app/posts/[id]/page.tsx`\n\nExport an async `generateMetadata({ params })` that fetches `https://api.dojo.test/posts/<id>` and returns `{ title: '<post title> | Dojo Blog', description: <post summary> }`. If the fetch is not ok, return `{ title: 'Not found | Dojo Blog' }`.",
      starter: `export async function generateMetadata({ params }) {\n  \n}\n`,
      solution: `export async function generateMetadata({ params }) {\n  const { id } = await params;\n  const res = await fetch('https://api.dojo.test/posts/' + id);\n  if (!res.ok) return { title: 'Not found | Dojo Blog' };\n  const post = await res.json();\n  return { title: post.title + ' | Dojo Blog', description: post.summary };\n}\n`,
      tests: `test('builds metadata from the post', async () => { mockFetch({ '/posts/1': { title: 'Ownership', summary: 'Who frees the memory?' } }); eq(await generateMetadata(${P({ id: '1' })}), { title: 'Ownership | Dojo Blog', description: 'Who frees the memory?' }); });
test('fallback title', async () => { mockFetch({}); eq(await generateMetadata(${P({ id: '9' })}), { title: 'Not found | Dojo Blog' }); });`,
      hints: ['`generateMetadata` receives the same `params` as the page and returns a plain object.', 'Next puts `title` in `<title>` and `description` in a meta tag for you.'],
    },
    {
      id: 'static-params', title: 'generateStaticParams', tier: 1,
      prompt: "File: `app/docs/[slug]/page.tsx`\n\nTo pre-render dynamic pages at build time, Next asks which parameter values exist. Export async `generateStaticParams()` that fetches `https://api.dojo.test/docs` (an array of `{ slug, title, draft }`) and returns one `{ slug }` object per **non-draft** doc.",
      starter: `export async function generateStaticParams() {\n  \n}\n`,
      solution: `export async function generateStaticParams() {\n  const docs = await (await fetch('https://api.dojo.test/docs')).json();\n  return docs.filter((d) => !d.draft).map((d) => ({ slug: d.slug }));\n}\n`,
      tests: `test('one entry per published doc', async () => { mockFetch({ '/docs': [{ slug: 'intro', title: 'Intro', draft: false }, { slug: 'wip', title: 'WIP', draft: true }, { slug: 'api', title: 'API', draft: false }] }); eq(await generateStaticParams(), [{ slug: 'intro' }, { slug: 'api' }]); });`,
      hints: ['Return an array of objects whose keys match the dynamic segment names — here, `slug`.'],
    },
    {
      id: 'nav-links', title: 'Link', tier: 1,
      prompt: "File: `app/nav.tsx`\n\nExport a default component `Nav` rendering a `<nav aria-label=\"Main\">` containing three `next/link` links: `Home` → `/`, `Blog` → `/blog`, `About` → `/about`.",
      starter: `import Link from 'next/link';\n\nexport default function Nav() {\n  return null;\n}\n`,
      solution: `import Link from 'next/link';\n\nexport default function Nav() {\n  return (\n    <nav aria-label="Main">\n      <Link href="/">Home</Link>\n      <Link href="/blog">Blog</Link>\n      <Link href="/about">About</Link>\n    </nav>\n  );\n}\n`,
      tests: `test('three links with the right targets', () => { render(<Nav />); eq(screen.getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')]), [['Home', '/'], ['Blog', '/blog'], ['About', '/about']]); });
test('wrapped in a labelled nav', () => { render(<Nav />); ok(screen.getByRole('navigation', { name: 'Main' })); });
test('uses next/link', () => ok(/next\\/link/.test(SOURCE) && !/<a\\s/.test(SOURCE), 'use <Link>, not a raw <a>'));`,
      hints: ['`<Link href="/blog">Blog</Link>` renders an `<a>` but navigates on the client and prefetches.'],
    },
    {
      id: 'active-link', title: 'Highlight the current page', tier: 2,
      prompt: "File: `app/nav-link.tsx`\n\nWrite a **client component** `NavLink({ href, children })`. It renders a `next/link` link, and when the current pathname (from `usePathname()`) equals `href`, adds `aria-current=\"page\"` and the class `active`. Otherwise neither is present.\n\nHooks only work in client components — the file must start with the `'use client'` directive.",
      starter: `import Link from 'next/link';\nimport { usePathname } from 'next/navigation';\n\nexport default function NavLink({ href, children }) {\n  return null;\n}\n`,
      solution: `'use client';\n\nimport Link from 'next/link';\nimport { usePathname } from 'next/navigation';\n\nexport default function NavLink({ href, children }) {\n  const active = usePathname() === href;\n  return (\n    <Link href={href} aria-current={active ? 'page' : undefined} className={active ? 'active' : undefined}>\n      {children}\n    </Link>\n  );\n}\n`,
      tests: `test('marks the current page', () => { nextNav.pathname = '/blog'; render(<NavLink href="/blog">Blog</NavLink>); const a = screen.getByRole('link'); eq([a.getAttribute('aria-current'), a.className], ['page', 'active']); });
test('other links are plain', () => { nextNav.pathname = '/blog'; render(<NavLink href="/about">About</NavLink>); const a = screen.getByRole('link'); eq(a.getAttribute('aria-current'), null); ok(!a.classList.contains('active')); });
test("declares 'use client'", () => ok(/^\\s*['"]use client['"]/.test(SOURCE), "the first line must be 'use client'"));`,
      hints: ['`"use client";` goes on the very first line, above the imports.', 'Passing `undefined` for an attribute leaves it off the element entirely.'],
    },
    {
      id: 'search-box', title: 'useRouter', tier: 2,
      prompt: "File: `app/search-box.tsx`\n\nWrite a client component `SearchBox`: a form with a text input labelled `Search` and a `Go` button. On submit it calls `router.push('/search?q=<encoded text>')`. Blank searches do nothing.",
      starter: `'use client';\n\nimport { useState } from 'react';\nimport { useRouter } from 'next/navigation';\n\nexport default function SearchBox() {\n  return null;\n}\n`,
      solution: `'use client';\n\nimport { useState } from 'react';\nimport { useRouter } from 'next/navigation';\n\nexport default function SearchBox() {\n  const router = useRouter();\n  const [q, setQ] = useState('');\n\n  function onSubmit(e) {\n    e.preventDefault();\n    if (!q.trim()) return;\n    router.push('/search?q=' + encodeURIComponent(q.trim()));\n  }\n\n  return (\n    <form onSubmit={onSubmit}>\n      <label htmlFor="q">Search</label>\n      <input id="q" value={q} onChange={(e) => setQ(e.target.value)} />\n      <button type="submit">Go</button>\n    </form>\n  );\n}\n`,
      tests: `const _search = (text) => { render(<SearchBox />); fireEvent.change(screen.getByLabelText('Search'), { target: { value: text } }); fireEvent.click(screen.getByRole('button', { name: 'Go' })); };
test('pushes the search URL', () => { _search('rust'); eq(nextNav.router.push.calls, [['/search?q=rust']]); });
test('encodes the query', () => { _search('a & b'); eq(nextNav.router.push.calls, [['/search?q=a%20%26%20b']]); });
test('ignores blank searches', () => { _search('   '); eq(nextNav.router.push.calls.length, 0); });`,
      hints: ['Import `useRouter` from `next/navigation` (not `next/router` — that is the old Pages Router).', '`encodeURIComponent` makes user text safe inside a URL.'],
    },
    {
      id: 'search-params-page', title: 'Pagination from searchParams', tier: 2,
      prompt: "File: `app/items/page.tsx`\n\nExport a default async `Page({ searchParams })`. `searchParams` is a Promise of the query string as an object. Read `page` (default `1`) and render:\n\n- `<h1>Page N</h1>`\n- a `Previous` link to `/items?page=N-1` — only when N > 1\n- a `Next` link to `/items?page=N+1`",
      starter: `import Link from 'next/link';\n\nexport default async function Page({ searchParams }) {\n  return null;\n}\n`,
      solution: `import Link from 'next/link';\n\nexport default async function Page({ searchParams }) {\n  const { page = '1' } = await searchParams;\n  const n = Number(page);\n  return (\n    <main>\n      <h1>Page {n}</h1>\n      {n > 1 && <Link href={'/items?page=' + (n - 1)}>Previous</Link>}\n      <Link href={'/items?page=' + (n + 1)}>Next</Link>\n    </main>\n  );\n}\n`,
      tests: `const _page = async (sp) => render(await Page({ searchParams: Promise.resolve(sp) }));
test('defaults to page 1 with no Previous', async () => { await _page({}); eq(screen.getByRole('heading').textContent, 'Page 1'); eq(screen.queryByRole('link', { name: 'Previous' }), null); eq(screen.getByRole('link', { name: 'Next' }).getAttribute('href'), '/items?page=2'); });
test('middle page has both links', async () => { await _page({ page: '4' }); eq(screen.getByRole('heading').textContent, 'Page 4'); eq(screen.getByRole('link', { name: 'Previous' }).getAttribute('href'), '/items?page=3'); eq(screen.getByRole('link', { name: 'Next' }).getAttribute('href'), '/items?page=5'); });`,
      hints: ['Pages receive `searchParams` as a prop; like `params`, it must be awaited.', 'Query values are strings — convert before doing arithmetic, or `"4" + 1` gives `"41"`.'],
    },
    {
      id: 'error-page', title: 'error.tsx', tier: 1,
      prompt: "File: `app/dashboard/error.tsx`\n\nAn `error.tsx` file is the error boundary for its route segment. It must be a client component. Export a default `ErrorPage({ error, reset })` that renders `<h2>Something went wrong</h2>`, the `error.message` in a `<p role=\"alert\">`, and a `Try again` button that calls `reset`.",
      starter: `export default function ErrorPage({ error, reset }) {\n  return null;\n}\n`,
      solution: `'use client';\n\nexport default function ErrorPage({ error, reset }) {\n  return (\n    <div>\n      <h2>Something went wrong</h2>\n      <p role="alert">{error.message}</p>\n      <button onClick={() => reset()}>Try again</button>\n    </div>\n  );\n}\n`,
      tests: `test('shows the message', () => { render(<ErrorPage error={new Error('DB offline')} reset={() => {}} />); eq(screen.getByRole('heading', { level: 2 }).textContent, 'Something went wrong'); eq(screen.getByRole('alert').textContent, 'DB offline'); });
test('Try again calls reset', () => { const reset = spy(); render(<ErrorPage error={new Error('x')} reset={reset} />); fireEvent.click(screen.getByRole('button', { name: 'Try again' })); eq(reset.calls.length, 1); });
test("declares 'use client'", () => ok(/^\\s*['"]use client['"]/.test(SOURCE), "error.tsx must be a client component: start with 'use client'"));`,
      hints: ['Error boundaries are interactive (they hold state and a retry button), so Next requires `"use client"`.', '`reset()` re-renders the segment to try again.'],
    },
    {
      id: 'revalidate', title: 'Cache with a time limit', tier: 2,
      prompt: "File: `lib/products.ts`\n\nExport async `getProducts()` that fetches `https://api.dojo.test/products` and returns the JSON. Ask Next to cache the response and refresh it at most every **60 seconds**, and tag it `'products'` so it can be invalidated on demand. If the response is not ok, throw `new Error('Failed to load products')`.",
      starter: `export async function getProducts() {\n  \n}\n`,
      solution: `export async function getProducts() {\n  const res = await fetch('https://api.dojo.test/products', { next: { revalidate: 60, tags: ['products'] } });\n  if (!res.ok) throw new Error('Failed to load products');\n  return res.json();\n}\n`,
      tests: `test('returns the data', async () => { mockFetch({ '/products': [{ id: 1 }] }); eq(await getProducts(), [{ id: 1 }]); });
test('asks for 60s revalidation', async () => { const calls = mockFetch({ '/products': [] }); await getProducts(); eq(calls[0].init.next && calls[0].init.next.revalidate, 60); });
test("tags the request 'products'", async () => { const calls = mockFetch({ '/products': [] }); await getProducts(); eq(calls[0].init.next.tags, ['products']); });
test('throws on a bad response', async () => { mockFetch({}); eq((await rejects(getProducts())).message, 'Failed to load products'); });`,
      hints: ['Next extends `fetch` with a `next` option: `fetch(url, { next: { revalidate: 60 } })`.', '`tags: ["products"]` lets `revalidateTag("products")` purge it later.'],
    },
    {
      id: 'cookies', title: 'Read cookies on the server', tier: 2,
      prompt: "File: `lib/theme.ts`\n\nExport async `getTheme()`. Read the `theme` cookie with `cookies()` from `next/headers` and return its value if it is `'light'` or `'dark'`; in every other case return `'light'`.\n\n`cookies()` is async — await it.",
      starter: `import { cookies } from 'next/headers';\n\nexport async function getTheme() {\n  \n}\n`,
      solution: `import { cookies } from 'next/headers';\n\nexport async function getTheme() {\n  const store = await cookies();\n  const value = store.get('theme')?.value;\n  return value === 'dark' || value === 'light' ? value : 'light';\n}\n`,
      tests: `test('reads the cookie', async () => { setCookies({ theme: 'dark' }); eq(await getTheme(), 'dark'); });
test('defaults to light', async () => eq(await getTheme(), 'light'));
test('ignores junk values', async () => { setCookies({ theme: '<script>' }); eq(await getTheme(), 'light'); });`,
      hints: ['`(await cookies()).get("theme")` returns `{ name, value }` or `undefined`.', 'A cookie is user input. Accept only the values you expect.'],
    },
    {
      id: 'middleware', title: 'Middleware', tier: 3,
      prompt: "File: `middleware.ts`\n\nExport `middleware(request)`:\n\n- if the path starts with `/dashboard` and there is **no** `session` cookie → redirect to `/login?from=<the original pathname>`\n- otherwise let the request continue with `NextResponse.next()`\n\nAlso export `config` with a `matcher` so the middleware only runs for `/dashboard` and everything under it.",
      starter: `import { NextResponse } from 'next/server';\n\nexport function middleware(request) {\n  \n}\n\nexport const config = {};\n`,
      solution: `import { NextResponse } from 'next/server';\n\nexport function middleware(request) {\n  const { pathname } = request.nextUrl;\n  if (pathname.startsWith('/dashboard') && !request.cookies.has('session')) {\n    const url = new URL('/login', request.url);\n    url.searchParams.set('from', pathname);\n    return NextResponse.redirect(url);\n  }\n  return NextResponse.next();\n}\n\nexport const config = { matcher: ['/dashboard/:path*'] };\n`,
      tests: `const _mw = (path, cookie) => middleware(new NextRequest('http://localhost' + path, cookie ? { headers: { cookie } } : undefined));
test('redirects anonymous visitors', () => { const r = _mw('/dashboard/settings'); ok(r.status >= 300 && r.status < 400, 'expected a redirect status'); const to = new URL(r.headers.get('location')); eq([to.pathname, to.searchParams.get('from')], ['/login', '/dashboard/settings']); });
test('lets signed-in users through', () => { const r = _mw('/dashboard', 'session=abc123'); eq(r.headers.get('x-middleware-next'), '1'); });
test('leaves public pages alone', () => eq(_mw('/pricing').headers.get('x-middleware-next'), '1'));
test('matcher covers the dashboard', () => { const m = [].concat(config.matcher || []); ok(m.some((p) => p.startsWith('/dashboard')), 'config.matcher should target /dashboard'); });`,
      hints: ['`request.nextUrl.pathname` and `request.cookies.has("session")`.', 'Redirect URLs must be absolute: `new URL("/login", request.url)`.', "`matcher: ['/dashboard/:path*']` matches `/dashboard` and anything below it."],
    },
    {
      id: 'server-action', title: 'A server action', tier: 3,
      prompt: "File: `app/posts/actions.ts`\n\nA server action is an async function that a `<form action={...}>` can call directly on the server. Write `createPost(formData)`:\n\n1. read `title` from the `FormData`; trim it\n2. if it is empty, **return** `{ error: 'Title is required' }` (do not throw)\n3. otherwise push `{ id, title }` onto the provided `posts` array (ids count up from 1)\n4. call `revalidatePath('/posts')` so the list page refetches\n5. `redirect('/posts')`\n\nThe file must start with `'use server'`.",
      starter: `import { revalidatePath } from 'next/cache';\nimport { redirect } from 'next/navigation';\n\nconst posts = [];\n\nexport async function createPost(formData) {\n  \n}\n`,
      solution: `'use server';\n\nimport { revalidatePath } from 'next/cache';\nimport { redirect } from 'next/navigation';\n\nconst posts = [];\n\nexport async function createPost(formData) {\n  const title = String(formData.get('title') ?? '').trim();\n  if (!title) return { error: 'Title is required' };\n  posts.push({ id: posts.length + 1, title });\n  revalidatePath('/posts');\n  redirect('/posts');\n}\n`,
      tests: `const _fd = (title) => { const f = new FormData(); if (title !== undefined) f.set('title', title); return f; };
test('rejects an empty title without redirecting', async () => { eq(await createPost(_fd('   ')), { error: 'Title is required' }); eq(await createPost(_fd()), { error: 'Title is required' }); eq(posts.length, 0); eq(nextStore.cache.length, 0); });
test('saves, revalidates, then redirects', async () => { eq(await redirectOf(() => createPost(_fd('  First post '))), '/posts'); eq(posts, [{ id: 1, title: 'First post' }]); eq(nextStore.cache, [['path', '/posts']]); });
test('ids count up', async () => { await redirectOf(() => createPost(_fd('Second'))); eq(posts[1], { id: 2, title: 'Second' }); });
test("declares 'use server'", () => ok(/^\\s*['"]use server['"]/.test(SOURCE), "the first line must be 'use server'"));`,
      hints: ['`formData.get("title")` returns a string, a File, or `null`.', '`redirect()` works by throwing, so call it last and never inside a `try` block that would catch it.', 'Revalidate before redirecting, or the destination shows stale data.'],
    },
    {
      id: 'api-boss', title: 'Boss: a protected, paginated API', tier: 3,
      prompt: "File: `app/api/orders/route.ts`\n\nUsing the provided `ORDERS`, export `GET(request)`:\n\n- no `session` cookie on the request → `401` with `{ \"error\": \"Unauthorized\" }`\n- optional `status` query parameter filters orders by status\n- `limit` (default `2`, capped at `50`) and `offset` (default `0`) paginate the filtered list\n- a `limit` or `offset` that is not a non-negative integer → `400` with `{ \"error\": \"Invalid pagination\" }`\n- success → `{ items, total }` where `total` is the count **after filtering, before pagination**",
      starter: `const ORDERS = [\n  { id: 1, status: 'shipped' },\n  { id: 2, status: 'pending' },\n  { id: 3, status: 'shipped' },\n  { id: 4, status: 'shipped' },\n  { id: 5, status: 'cancelled' },\n];\n\nexport async function GET(request) {\n  \n}\n`,
      solution: `const ORDERS = [\n  { id: 1, status: 'shipped' },\n  { id: 2, status: 'pending' },\n  { id: 3, status: 'shipped' },\n  { id: 4, status: 'shipped' },\n  { id: 5, status: 'cancelled' },\n];\n\nexport async function GET(request) {\n  if (!request.cookies.has('session')) return Response.json({ error: 'Unauthorized' }, { status: 401 });\n  const sp = request.nextUrl.searchParams;\n  const limit = Number(sp.get('limit') ?? 2);\n  const offset = Number(sp.get('offset') ?? 0);\n  if (!Number.isInteger(limit) || !Number.isInteger(offset) || limit < 0 || offset < 0) {\n    return Response.json({ error: 'Invalid pagination' }, { status: 400 });\n  }\n  const status = sp.get('status');\n  const filtered = status ? ORDERS.filter((o) => o.status === status) : ORDERS;\n  return Response.json({ items: filtered.slice(offset, offset + Math.min(limit, 50)), total: filtered.length });\n}\n`,
      tests: `const _get = (qs, authed = true) => GET(new NextRequest('http://localhost/api/orders' + qs, authed ? { headers: { cookie: 'session=s1' } } : undefined));
test('401 without a session', async () => { const r = await _get('', false); eq(r.status, 401); eq(await r.json(), { error: 'Unauthorized' }); });
test('default page', async () => eq(await (await _get('')).json(), { items: [{ id: 1, status: 'shipped' }, { id: 2, status: 'pending' }], total: 5 }));
test('limit and offset', async () => eq((await (await _get('?limit=2&offset=3')).json()).items.map((o) => o.id), [4, 5]));
test('filter, then paginate', async () => eq(await (await _get('?status=shipped&limit=1&offset=1')).json(), { items: [{ id: 3, status: 'shipped' }], total: 3 }));
test('offset past the end is an empty page', async () => eq(await (await _get('?offset=99')).json(), { items: [], total: 5 }));
test('bad pagination is a 400', async () => { for (const qs of ['?limit=abc', '?offset=-1', '?limit=1.5']) { const r = await _get(qs); eq(r.status, 400, qs); eq(await r.json(), { error: 'Invalid pagination' }); } });`,
      hints: ['Order of checks: authentication first, then validate input, then do the work.', '`Number("abc")` is `NaN` and `Number.isInteger(NaN)` is false — one test covers junk and fractions.', 'Compute `total` from the filtered list *before* slicing.'],
    },
    {
      id: 'root-layout', title: 'The root layout', tier: 1,
      prompt: "File: `app/layout.tsx`\n\nEvery App Router project needs a root layout that renders `<html>` and `<body>`. Export:\n\n- `metadata` — an object with `title: 'Dojo'` and `description: 'Practice every day'`\n- a default `RootLayout({ children })` rendering `<html lang=\"en\">`, a `<body>` containing a `<header>` with the text `Dojo`, and the children inside `<main>`",
      starter: `export const metadata = {};\n\nexport default function RootLayout({ children }) {\n  return null;\n}\n`,
      solution: `export const metadata = {\n  title: 'Dojo',\n  description: 'Practice every day',\n};\n\nexport default function RootLayout({ children }) {\n  return (\n    <html lang="en">\n      <body>\n        <header>Dojo</header>\n        <main>{children}</main>\n      </body>\n    </html>\n  );\n}\n`,
      tests: `const _html = () => require('react-dom/server').renderToStaticMarkup(<RootLayout><p>Page body</p></RootLayout>);
test('html with a language', () => ok(_html().startsWith('<html lang="en">'), 'the outermost element should be <html lang="en">'));
test('header and main', () => { ok(/<body>.*<header>Dojo<\\/header>/.test(_html())); ok(_html().includes('<main><p>Page body</p></main>'), 'children belong inside <main>'); });
test('metadata', () => eq(metadata, { title: 'Dojo', description: 'Practice every day' }));`,
      hints: ['The root layout is the only place `<html>` and `<body>` appear.', '`lang` on `<html>` is an accessibility requirement: it tells screen readers which pronunciation to use.', 'A static `metadata` export is enough when the title does not depend on data.'],
    },
    {
      id: 'loading', title: 'loading.tsx', tier: 1,
      prompt: "File: `app/dashboard/loading.tsx`\n\nNext shows this file instantly while the page's data is still loading. Export a default `Loading` component that renders a `<div role=\"status\">` containing the text `Loading dashboard…`.",
      starter: `export default function Loading() {\n  return null;\n}\n`,
      solution: `export default function Loading() {\n  return <div role="status">Loading dashboard…</div>;\n}\n`,
      tests: `test('announces itself', () => { render(<Loading />); eq(screen.getByRole('status').textContent, 'Loading dashboard…'); });`,
      hints: ['`role="status"` makes screen readers announce the text without interrupting.'],
    },
    {
      id: 'not-found', title: 'not-found.tsx', tier: 1,
      prompt: "File: `app/not-found.tsx`\n\nThis is what `notFound()` renders. Export a default `NotFound` component with an `<h2>` reading `Page not found`, a `<p>` reading `We could not find what you were looking for.`, and a `next/link` link `Back home` pointing to `/`.",
      starter: `import Link from 'next/link';\n\nexport default function NotFound() {\n  return null;\n}\n`,
      solution: `import Link from 'next/link';\n\nexport default function NotFound() {\n  return (\n    <div>\n      <h2>Page not found</h2>\n      <p>We could not find what you were looking for.</p>\n      <Link href="/">Back home</Link>\n    </div>\n  );\n}\n`,
      tests: `test('heading and message', () => { render(<NotFound />); eq(screen.getByRole('heading', { level: 2 }).textContent, 'Page not found'); ok(screen.getByText('We could not find what you were looking for.')); });
test('a way back', () => { render(<NotFound />); eq(screen.getByRole('link', { name: 'Back home' }).getAttribute('href'), '/'); });`,
      hints: ['It is an ordinary component — the file name is what gives it its job.'],
    },
    {
      id: 'breadcrumbs', title: 'Catch-all segments', tier: 2,
      prompt: "File: `app/docs/[...slug]/page.tsx`\n\nA catch-all segment delivers the rest of the URL as an **array**: `/docs/guides/routing/dynamic` gives `slug = ['guides', 'routing', 'dynamic']`.\n\nExport a default async `Page({ params })` rendering a `<nav aria-label=\"Breadcrumb\">` with one link per segment. Each link's text is the segment and its `href` is the path up to and including it (`/docs/guides`, `/docs/guides/routing`, …). The **last** link has `aria-current=\"page\"`.",
      starter: `import Link from 'next/link';\n\nexport default async function Page({ params }) {\n  return null;\n}\n`,
      solution: `import Link from 'next/link';\n\nexport default async function Page({ params }) {\n  const { slug } = await params;\n  return (\n    <nav aria-label="Breadcrumb">\n      {slug.map((part, i) => (\n        <Link key={i} href={'/docs/' + slug.slice(0, i + 1).join('/')} aria-current={i === slug.length - 1 ? 'page' : undefined}>\n          {part}\n        </Link>\n      ))}\n    </nav>\n  );\n}\n`,
      tests: `const _p = async (slug) => render(await Page({ params: Promise.resolve({ slug }) }));
test('one link per segment', async () => { await _p(['guides', 'routing', 'dynamic']); eq(screen.getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')]), [['guides', '/docs/guides'], ['routing', '/docs/guides/routing'], ['dynamic', '/docs/guides/routing/dynamic']]); });
test('last link is the current page', async () => { await _p(['a', 'b']); eq(screen.getAllByRole('link').map((a) => a.getAttribute('aria-current')), [null, 'page']); });
test('labelled nav', async () => { await _p(['a']); ok(screen.getByRole('navigation', { name: 'Breadcrumb' })); });`,
      hints: ['`[...slug]` in the folder name means `params.slug` is an array of strings.', '`slug.slice(0, i + 1).join("/")` is the path through segment `i`.'],
    },
    {
      id: 'protected-page', title: 'Redirect from a page', tier: 2,
      prompt: "File: `app/account/page.tsx`\n\nExport a default async `Page`. Read the `session` cookie with `cookies()`. If there is none, `redirect('/login')`. Otherwise fetch `https://api.dojo.test/me` — sending the session as an `Authorization: Bearer <session>` header — and render `<h1>Welcome back, <name></h1>` from the JSON's `name`.",
      starter: `import { cookies } from 'next/headers';\nimport { redirect } from 'next/navigation';\n\nexport default async function Page() {\n  return null;\n}\n`,
      solution: `import { cookies } from 'next/headers';\nimport { redirect } from 'next/navigation';\n\nexport default async function Page() {\n  const session = (await cookies()).get('session')?.value;\n  if (!session) redirect('/login');\n  const res = await fetch('https://api.dojo.test/me', { headers: { Authorization: 'Bearer ' + session } });\n  const user = await res.json();\n  return <h1>Welcome back, {user.name}</h1>;\n}\n`,
      tests: `test('anonymous visitors are redirected', async () => { const calls = mockFetch({ '/me': { name: 'Ada' } }); eq(await redirectOf(() => Page()), '/login'); eq(calls.length, 0, 'do not call the API without a session'); });
test('signed-in users see their name', async () => { setCookies({ session: 'tok123' }); mockFetch({ '/me': { name: 'Ada' } }); render(await Page()); eq(screen.getByRole('heading', { level: 1 }).textContent, 'Welcome back, Ada'); });
test('sends the bearer token', async () => { setCookies({ session: 'tok123' }); const calls = mockFetch({ '/me': { name: 'Ada' } }); await Page(); eq(new Headers(calls[0].init.headers).get('authorization'), 'Bearer tok123'); });`,
      hints: ['`redirect()` throws, so the code after it never runs for anonymous visitors — no `else` needed.', '`fetch(url, { headers: { Authorization: "Bearer " + token } })`.'],
    },
    {
      id: 'route-patch', title: 'PATCH: partial updates', tier: 2,
      prompt: "File: `app/api/todos/[id]/route.ts`\n\nExport `PATCH(request, { params })` for the provided `todos`. The JSON body may contain `title` (string) and/or `done` (boolean); apply only the fields that are present and respond with the updated todo.\n\n- unknown id → `404` `{ \"error\": \"Not found\" }`\n- a `title` that is not a non-blank string, or a `done` that is not a boolean → `400` `{ \"error\": \"Invalid body\" }` and **nothing** is changed",
      starter: `const todos = [\n  { id: 1, title: 'Learn routing', done: false },\n  { id: 2, title: 'Ship it', done: false },\n];\n\nexport async function PATCH(request, { params }) {\n  \n}\n`,
      solution: `const todos = [\n  { id: 1, title: 'Learn routing', done: false },\n  { id: 2, title: 'Ship it', done: false },\n];\n\nexport async function PATCH(request, { params }) {\n  const { id } = await params;\n  const todo = todos.find((t) => t.id === Number(id));\n  if (!todo) return Response.json({ error: 'Not found' }, { status: 404 });\n  const body = await request.json().catch(() => null);\n  const bad = !body\n    || ('title' in body && (typeof body.title !== 'string' || !body.title.trim()))\n    || ('done' in body && typeof body.done !== 'boolean');\n  if (bad) return Response.json({ error: 'Invalid body' }, { status: 400 });\n  if ('title' in body) todo.title = body.title.trim();\n  if ('done' in body) todo.done = body.done;\n  return Response.json(todo);\n}\n`,
      tests: `const _patch = (id, body) => PATCH(new NextRequest('http://localhost/api/todos/' + id, { method: 'PATCH', body: typeof body === 'string' ? body : JSON.stringify(body) }), { params: Promise.resolve({ id: String(id) }) });
test('updates one field', async () => eq(await (await _patch(1, { done: true })).json(), { id: 1, title: 'Learn routing', done: true }));
test('updates both', async () => eq(await (await _patch(2, { title: ' Ship it now ', done: true })).json(), { id: 2, title: 'Ship it now', done: true }));
test('unknown id', async () => { const r = await _patch(99, { done: true }); eq(r.status, 404); eq(await r.json(), { error: 'Not found' }); });
test('bad values are rejected', async () => { for (const b of [{ done: 'yes' }, { title: '  ' }, { title: 5 }, '{oops']) { const r = await _patch(1, b); eq(r.status, 400); eq(await r.json(), { error: 'Invalid body' }); } });
test('a rejected request changes nothing', async () => { await _patch(1, { title: 'Sneaky', done: 'nope' }); eq((await (await _patch(1, {})).json()).title, 'Learn routing'); });`,
      hints: ['PATCH means "change only what I sent". Test with `"field" in body`, not truthiness — `done: false` is a real value.', 'Validate everything first, then apply. If you apply as you go, a half-valid body leaves a half-updated record.'],
    },
    {
      id: 'bearer-auth', title: 'Reading request headers', tier: 2,
      prompt: "File: `app/api/reports/route.ts`\n\nExport `GET(request)` protected by an API key. The key arrives as `Authorization: Bearer <key>`.\n\n- header missing, or not in the `Bearer …` form → `401` `{ \"error\": \"Missing token\" }`, with a `WWW-Authenticate: Bearer` response header\n- a key that is not in the provided `KEYS` → `403` `{ \"error\": \"Invalid token\" }`\n- otherwise `200` `{ \"owner\": <the key's owner>, \"reports\": [] }`",
      starter: `const KEYS = { 'key-ada': 'Ada', 'key-linus': 'Linus' };\n\nexport async function GET(request) {\n  \n}\n`,
      solution: `const KEYS = { 'key-ada': 'Ada', 'key-linus': 'Linus' };\n\nexport async function GET(request) {\n  const header = request.headers.get('authorization') || '';\n  const [scheme, token] = header.split(' ');\n  if (scheme !== 'Bearer' || !token) {\n    return Response.json({ error: 'Missing token' }, { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } });\n  }\n  if (!Object.hasOwn(KEYS, token)) return Response.json({ error: 'Invalid token' }, { status: 403 });\n  return Response.json({ owner: KEYS[token], reports: [] });\n}\n`,
      tests: `const _get = (auth) => GET(new NextRequest('http://localhost/api/reports', auth ? { headers: { authorization: auth } } : undefined));
test('valid key', async () => { const r = await _get('Bearer key-ada'); eq(r.status, 200); eq(await r.json(), { owner: 'Ada', reports: [] }); });
test('no header is 401 with a challenge', async () => { const r = await _get(); eq(r.status, 401); eq(await r.json(), { error: 'Missing token' }); eq(r.headers.get('www-authenticate'), 'Bearer'); });
test('wrong scheme is 401', async () => eq((await _get('Basic abc')).status, 401));
test('unknown key is 403', async () => { const r = await _get('Bearer nope'); eq(r.status, 403); eq(await r.json(), { error: 'Invalid token' }); });
test('inherited property names are not keys', async () => eq((await _get('Bearer toString')).status, 403));`,
      hints: ['`request.headers.get("authorization")` — header names are case-insensitive.', '401 means "you have not identified yourself"; 403 means "I know who you are, and no".', '`KEYS[token]` is truthy for `"toString"`, because every object inherits it. Use `Object.hasOwn(KEYS, token)`.'],
    },
    {
      id: 'theme-action', title: 'A server action that sets a cookie', tier: 3,
      prompt: "File: `app/actions.ts`\n\nWrite the server action `setTheme(formData)`:\n\n1. read `theme` from the form data\n2. if it is not exactly `'light'` or `'dark'`, return `{ error: 'Unknown theme' }` and change nothing\n3. otherwise store it in the `theme` cookie, call `revalidatePath('/')`, and return `{ ok: true }`\n\nThe file must start with `'use server'`.",
      starter: `import { cookies } from 'next/headers';\nimport { revalidatePath } from 'next/cache';\n\nexport async function setTheme(formData) {\n  \n}\n`,
      solution: `'use server';\n\nimport { cookies } from 'next/headers';\nimport { revalidatePath } from 'next/cache';\n\nexport async function setTheme(formData) {\n  const theme = formData.get('theme');\n  if (theme !== 'light' && theme !== 'dark') return { error: 'Unknown theme' };\n  (await cookies()).set('theme', theme);\n  revalidatePath('/');\n  return { ok: true };\n}\n`,
      tests: `const _fd = (theme) => { const f = new FormData(); if (theme !== undefined) f.set('theme', theme); return f; };
test('stores a valid theme', async () => { eq(await setTheme(_fd('dark')), { ok: true }); eq(nextStore.cookies.get('theme'), 'dark'); eq(nextStore.cache, [['path', '/']]); });
test('rejects anything else', async () => { for (const t of ['neon', '', undefined, 'DARK']) eq(await setTheme(_fd(t)), { error: 'Unknown theme' }); eq(nextStore.cookies.has('theme'), false); eq(nextStore.cache.length, 0); });
test("declares 'use server'", () => ok(/^\\s*['"]use server['"]/.test(SOURCE), "the first line must be 'use server'"));`,
      hints: ['A server action is a public HTTP endpoint in disguise — anyone can post any value to it, so validate.', '`(await cookies()).set(name, value)` works inside server actions and route handlers.'],
    },
  ],
  drills: [
    { q: 'In the App Router, which file makes `/blog/my-post` render?', choices: ['app/blog/[slug].tsx', 'app/blog/[slug]/page.tsx', 'pages/blog/my-post.tsx', 'app/blog/slug/route.tsx'], answer: 1, why: 'Folders define the URL; a `page.tsx` inside makes it routable. `[slug]` is a dynamic segment.' },
    { q: 'By default, components in `app/` are…', choices: ['Client components', 'Server components', 'Static HTML only', 'Edge functions'], answer: 1, why: 'Server by default: they render on the server and ship no JavaScript. Add `"use client"` only where you need state, effects or event handlers.' },
    { q: 'Which of these needs `"use client"`?', choices: ['An async component that queries a database', 'A component using `useState`', 'A component that renders a `<Link>`', 'A layout'], answer: 1, why: 'Hooks and event handlers run in the browser. Data fetching and static markup are happier on the server.' },
    { q: 'What does `layout.tsx` do?', choices: ['Styles one page', 'Wraps every page in its folder and below, and persists across navigation', 'Defines API routes', 'Replaces page.tsx'], answer: 1, why: 'Layouts nest by folder and keep their state when you navigate between sibling pages. Each must render `{children}`.' },
    { q: 'Where does a file at `app/api/users/route.ts` respond?', choices: ['/users', '/api/users', '/app/api/users', '/route'], answer: 1, why: 'The `app` folder itself is not part of the URL. `route.ts` is to APIs what `page.tsx` is to pages.' },
    { q: 'Why can a server component read a secret API key but a client component cannot?', choices: ['Client components are slower', 'Client component code is sent to the browser, where anyone can read it', 'Secrets are blocked by React', 'It can, with NEXT_PUBLIC_'], answer: 1, why: 'Anything in a client bundle is public. `NEXT_PUBLIC_` variables are deliberately exposed — never put a secret behind that prefix.' },
    { q: 'What is `loading.tsx` for?', choices: ['Lazy-loading images', 'An instant fallback shown while the segment\'s server component is still fetching', 'Preloading fonts', 'A progress bar library'], answer: 1, why: 'Next wraps the page in a Suspense boundary with `loading.tsx` as the fallback, so navigation feels immediate.' },
    { q: 'What is a route group, written `(marketing)`?', choices: ['A dynamic segment', 'A folder that organises routes without appearing in the URL', 'A private folder', 'An API namespace'], answer: 1, why: 'Parentheses group files — often to give them a shared layout — without adding a URL segment.' },
    { q: 'What does `[...slug]` match?', choices: ['Exactly one segment', 'One or more segments, as an array', 'Only numbers', 'Query strings'], answer: 1, why: 'A catch-all: `/docs/a/b/c` gives `slug = ["a", "b", "c"]`. `[[...slug]]` also matches zero segments.' },
    { q: 'How should you navigate after a form submit inside a client component?', choices: ['window.location = "/done"', 'useRouter().push("/done") from next/navigation', 'import Router from "next/router"', '<meta refresh>'], answer: 1, why: '`router.push` keeps it a client-side transition. `next/router` belongs to the old Pages Router and does not work in `app/`.' },
    { q: 'What does `revalidatePath("/posts")` do?', choices: ['Reloads the browser', 'Marks the cached data for that route stale so the next visit refetches', 'Deletes the page', 'Restarts the server'], answer: 1, why: 'After a mutation, cached renders are out of date. Revalidating tells Next to rebuild them on the next request.' },
    { q: 'Where does middleware run?', choices: ['After the page renders', 'Before the request reaches a route, for every path its matcher allows', 'Only on API routes', 'In the browser'], answer: 1, why: 'It sits in front of routing — ideal for redirects, auth gates and header rewrites. Keep it small: it runs on every matched request.' },
    { q: 'Can a server component be imported into a client component?', choices: ['Yes, freely', 'No — but it can be passed in as `children` or another prop', 'Only with dynamic()', 'Only in development'], answer: 1, why: 'Anything imported by a client file becomes client code. Passing server-rendered JSX down as children keeps it on the server.' },
    { q: 'What does the `"use client"` directive mark?', choices: ['A component that only runs in the browser', 'The boundary where the client bundle begins', 'A file excluded from the build', 'A component that skips hydration'], answer: 1, why: 'Client components are still pre-rendered to HTML on the server; the directive means their code is also shipped and hydrated.' },
    { q: 'Why can environment variables without `NEXT_PUBLIC_` not be read in the browser?', choices: ['A bug', 'Next only inlines the public-prefixed ones into client code', 'Browsers block env vars', 'They are encrypted'], answer: 1, why: 'Everything else stays server-side, where database passwords and API secrets belong.' },
    { q: 'What does `next/image` give you over a plain `<img>`?', choices: ['Nothing', 'Resizing, modern formats, lazy loading and reserved space to avoid layout shift', 'Only alt text checking', 'Animated images'], answer: 1, why: 'It needs `width` and `height` (or `fill`) so the browser can reserve space before the image loads.' },
    { q: 'Where does `export const dynamic = "force-dynamic"` go, and what does it do?', choices: ['In next.config: disables caching globally', 'In a page or layout: render it on every request instead of caching', 'In middleware: skips it', 'In a component: makes it a client component'], answer: 1, why: 'It is a route segment config. Use it when a page must always be fresh; the default is to cache what can be cached.' },
    { q: 'What is `template.tsx`, compared with `layout.tsx`?', choices: ['The same thing', 'Like a layout, but re-mounted on every navigation', 'A file for email templates', 'A page with no URL'], answer: 1, why: 'A layout keeps its state between sibling pages; a template gets a fresh instance each time — useful for enter animations.' },
    { q: 'How do you read form fields in a server action?', code: `async function save(formData) { 'use server'; /* ... */ }`, choices: ['formData.title', "formData.get('title')", 'request.body.title', 'event.target.title.value'], answer: 1, why: 'A form action receives a standard `FormData` object. Validate what comes out — it is untrusted input.' },
    { q: 'What is a parallel route folder, written `@modal`?', choices: ['A private folder', 'A named slot that renders alongside the page in the same layout', 'A route group', 'An API namespace'], answer: 1, why: 'The layout receives each slot as a prop (`modal`) next to `children` — the basis for dashboards and intercepted modals.' },
    { q: 'What does `<Link prefetch>` buy you by default?', choices: ['Nothing', 'The linked route is loaded in the background when the link scrolls into view', 'A full page reload', 'Server-side caching'], answer: 1, why: 'Navigation then feels instant. It is automatic in production for links in the viewport.' },
    { q: 'Where should you put code that must never reach the browser?', choices: ['In any component', 'In server components, route handlers or server actions', 'In a file named private.ts', 'Behind an if (typeof window) check'], answer: 1, why: 'A runtime check still ships the code. Importing the `server-only` package makes an accidental client import a build error.' },
    { q: 'What does `revalidate = 60` exported from a page mean?', choices: ['Reload the browser every 60 seconds', 'Serve the cached page, regenerating it in the background at most once a minute', 'Time out requests after 60 seconds', 'Cache for 60 minutes'], answer: 1, why: 'Incremental static regeneration: visitors get the fast cached page, and it refreshes itself on a schedule.' },
    { q: 'Which hook reads the query string in a client component?', choices: ['useRouter().query', 'useSearchParams()', 'useParams()', 'useQuery()'], answer: 1, why: '`useParams` is for dynamic segments like `[id]`; `useSearchParams` is for `?page=2`. `router.query` belongs to the old Pages Router.' },
  ],
};
