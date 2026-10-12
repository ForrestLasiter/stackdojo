'use strict';
// Stand-ins for the Next.js runtime modules an App Router file imports. They
// keep the real contracts (NextResponse extends Response, redirect() throws,
// cookies()/headers() are async) so exercises grade against Next's behaviour
// without booting a Next server.
module.exports = function createNext(React, spy) {
  const makeRouter = () => ({ push: spy(), replace: spy(), back: spy(), forward: spy(), refresh: spy(), prefetch: spy() });
  const nav = { pathname: '/', search: '', params: {}, router: makeRouter() };
  const store = { cookies: new Map(), headers: new Headers(), cache: [] };

  class NextResponse extends Response {
    constructor(body, init) {
      super(body, init);
      const self = this;
      this.cookies = {
        set(name, value) { self.headers.append('set-cookie', `${name}=${value}; Path=/`); return this; },
        delete(name) { self.headers.append('set-cookie', `${name}=; Path=/; Max-Age=0`); return this; },
      };
    }
    static json(data, init = {}) {
      const headers = new Headers(init.headers);
      headers.set('content-type', 'application/json');
      return new NextResponse(JSON.stringify(data), { ...init, headers });
    }
    static redirect(url, status = 307) {
      return new NextResponse(null, { status: typeof status === 'number' ? status : status.status || 307, headers: { location: String(url) } });
    }
    static rewrite(url) { return new NextResponse(null, { headers: { 'x-middleware-rewrite': String(url) } }); }
    static next(init = {}) { const h = new Headers(init.headers); h.set('x-middleware-next', '1'); return new NextResponse(null, { headers: h }); }
  }
  class NextRequest extends Request {
    constructor(input, init) {
      super(input, init);
      const jar = new Map();
      for (const part of (this.headers.get('cookie') || '').split(';')) {
        const i = part.indexOf('=');
        if (i > 0) jar.set(part.slice(0, i).trim(), part.slice(i + 1).trim());
      }
      this.cookies = {
        get: (n) => (jar.has(n) ? { name: n, value: jar.get(n) } : undefined),
        has: (n) => jar.has(n),
        getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      };
      const u = new URL(this.url);
      u.clone = () => { const c = new URL(u.href); c.clone = u.clone; return c; };
      this.nextUrl = u;
    }
  }
  const redirect = (url) => { const e = new Error('NEXT_REDIRECT'); e.digest = `NEXT_REDIRECT;${url}`; e.url = url; throw e; };
  const notFound = () => { const e = new Error('NEXT_NOT_FOUND'); e.digest = 'NEXT_NOT_FOUND'; throw e; };
  const cookieStore = {
    get: (n) => (store.cookies.has(n) ? { name: n, value: store.cookies.get(n) } : undefined),
    has: (n) => store.cookies.has(n),
    set: (n, v) => { store.cookies.set(n, String(v)); },
    delete: (n) => { store.cookies.delete(n); },
    getAll: () => [...store.cookies].map(([name, value]) => ({ name, value })),
  };
  const Link = ({ href, children, prefetch, replace, scroll, ...rest }) =>
    React.createElement('a', { href: typeof href === 'string' ? href : href.pathname, ...rest }, children);
  const Image = ({ src, alt, width, height, priority, fill, ...rest }) =>
    React.createElement('img', { src: typeof src === 'string' ? src : src.src, alt, width, height, ...rest });
  const esm = (def) => ({ __esModule: true, default: def });

  return {
    modules: {
      'next/server': { NextResponse, NextRequest },
      'next/navigation': {
        redirect, notFound, permanentRedirect: redirect,
        useRouter: () => nav.router, usePathname: () => nav.pathname,
        useSearchParams: () => new URLSearchParams(nav.search), useParams: () => nav.params,
      },
      'next/link': esm(Link),
      'next/image': esm(Image),
      'next/headers': { cookies: async () => cookieStore, headers: async () => store.headers },
      'next/cache': {
        revalidatePath: (p) => { store.cache.push(['path', p]); },
        revalidateTag: (t) => { store.cache.push(['tag', t]); },
      },
    },
    helpers: {
      NextRequest, NextResponse,
      nextNav: nav,
      nextStore: store,
      setCookies: (obj) => { store.cookies = new Map(Object.entries(obj)); },
      async redirectOf(fn) {
        try { await fn(); } catch (e) { if (e && e.message === 'NEXT_REDIRECT') return e.url; throw e; }
        return null;
      },
      async isNotFound(fn) {
        try { await fn(); } catch (e) { if (e && e.message === 'NEXT_NOT_FOUND') return true; throw e; }
        return false;
      },
    },
    reset() {
      nav.pathname = '/'; nav.search = ''; nav.params = {}; nav.router = makeRouter();
      store.cookies = new Map(); store.headers = new Headers(); store.cache.length = 0;
    },
  };
};
