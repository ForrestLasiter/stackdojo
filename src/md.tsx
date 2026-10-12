import type { ReactNode } from 'react';

// Just enough Markdown for challenge prompts: paragraphs, "- " lists, fenced
// code blocks, and inline `code` / **bold**. Content is authored in this repo,
// and everything is rendered as React nodes — no HTML strings.

export function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    out.push(tok[0] === '`' ? <code key={i++}>{tok.slice(1, -1)}</code> : <strong key={i++}>{tok.slice(2, -2)}</strong>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Prose({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  const parts = text.split('```');
  parts.forEach((part, pi) => {
    if (pi % 2 === 1) {
      blocks.push(<pre key={`c${pi}`} className="codeblock"><code>{part.replace(/^\n|\n$/g, '')}</code></pre>);
      return;
    }
    part.split(/\n{2,}/).forEach((para, i) => {
      const lines = para.split('\n').filter((l) => l.trim());
      if (!lines.length) return;
      const k = `${pi}-${i}`;
      if (lines.every((l) => /^\s*- /.test(l))) {
        blocks.push(<ul key={k}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*- /, ''))}</li>)}</ul>);
      } else if (lines.every((l) => /^\s*\d+\. /.test(l))) {
        blocks.push(<ol key={k}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*\d+\. /, ''))}</li>)}</ol>);
      } else {
        // A paragraph may carry a trailing list ("Write X:\n- a\n- b").
        const firstItem = lines.findIndex((l) => /^\s*- /.test(l));
        if (firstItem > 0 && lines.slice(firstItem).every((l) => /^\s*- /.test(l))) {
          blocks.push(<p key={k}>{inline(lines.slice(0, firstItem).join(' '))}</p>);
          blocks.push(<ul key={k + 'l'}>{lines.slice(firstItem).map((l, j) => <li key={j}>{inline(l.replace(/^\s*- /, ''))}</li>)}</ul>);
        } else {
          blocks.push(<p key={k}>{inline(lines.join(' '))}</p>);
        }
      }
    });
  });
  return <div className="prose">{blocks}</div>;
}
