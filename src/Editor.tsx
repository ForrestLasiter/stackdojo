import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState, Prec } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { rust } from '@codemirror/lang-rust';
import { sql, PostgreSQL } from '@codemirror/lang-sql';
import { StreamLanguage, HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { powerShell } from '@codemirror/legacy-modes/mode/powershell';
import { tags as t } from '@lezer/highlight';

function language(lang: string) {
  switch (lang) {
    case 'typescript': return javascript({ typescript: true });
    case 'tsx': return javascript({ typescript: true, jsx: true });
    case 'sql': return sql({ dialect: PostgreSQL });
    case 'rust': return rust();
    case 'shell': return StreamLanguage.define(shell);
    case 'powershell': return StreamLanguage.define(powerShell);
    default: return javascript({ jsx: true });
  }
}

// Every token colour clears 4.5:1 against the editor background (#0b0e14),
// comments included — the stock dark themes do not.
const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.modifier, t.controlKeyword, t.operatorKeyword], color: '#c9b0ff' },
  { tag: [t.string, t.special(t.string), t.regexp], color: '#a5e89a' },
  { tag: [t.number, t.bool, t.null, t.atom], color: '#ffb877' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: '#9aa7bd', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.definition(t.variableName)], color: '#7fcaff' },
  { tag: [t.typeName, t.className, t.namespace, t.tagName], color: '#63e6d0' },
  { tag: [t.attributeName, t.propertyName], color: '#f0c674' },
  { tag: [t.operator, t.punctuation, t.bracket], color: '#c3cad8' },
  { tag: t.invalid, color: '#ff9a9a' },
]);

const theme = EditorView.theme({
  '&': { color: '#e8ebf2', backgroundColor: '#0b0e14', height: '100%', fontSize: '14px' },
  '.cm-content': { caretColor: '#f5b83d', fontFamily: "'Cascadia Code', Consolas, 'SF Mono', Menlo, monospace", padding: '10px 0', fontVariantLigatures: 'none' },
  '.cm-scroller': { lineHeight: '1.55' },
  '.cm-cursor': { borderLeftColor: '#f5b83d', borderLeftWidth: '2px' },
  '&.cm-focused': { outline: 'none' },
  '.cm-gutters': { backgroundColor: '#0b0e14', color: '#8b96aa', border: 'none' },
  '.cm-activeLine': { backgroundColor: '#141924' },
  '.cm-activeLineGutter': { backgroundColor: '#141924', color: '#e8ebf2' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': { backgroundColor: '#2c4a7a' },
  '.cm-matchingBracket': { backgroundColor: '#2f3b52', outline: '1px solid #6b7890' },
  '.cm-tooltip': { backgroundColor: '#1b2130', border: '1px solid #6b7890', color: '#e8ebf2' },
  '.cm-tooltip-autocomplete ul li[aria-selected]': { backgroundColor: '#2c4a7a', color: '#ffffff' },
}, { dark: true });

interface Props {
  value: string;
  lang: string;
  label: string;
  readOnly?: boolean;
  onChange?: (code: string) => void;
  onRun?: () => void;
}

/** Uncontrolled after mount: give it a new `key` to load different code. */
export default function Editor({ value, lang, label, readOnly, onChange, onRun }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const handlers = useRef({ onChange, onRun });
  handlers.current = { onChange, onRun };

  useEffect(() => {
    const view = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          Prec.highest(keymap.of([{ key: 'Mod-Enter', run: () => { handlers.current.onRun?.(); return true; } }])),
          basicSetup,
          keymap.of([indentWithTab]),
          language(lang),
          syntaxHighlighting(highlight),
          theme,
          EditorState.tabSize.of(2),
          EditorState.readOnly.of(!!readOnly),
          EditorView.contentAttributes.of({ 'aria-label': label, 'aria-describedby': 'editor-keys' }),
          EditorView.updateListener.of((u) => { if (u.docChanged) handlers.current.onChange?.(u.state.doc.toString()); }),
        ],
      }),
    });
    return () => view.destroy();
    // Mount-only on purpose; see the component comment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="editor" ref={host} />;
}
