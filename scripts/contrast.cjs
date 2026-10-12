'use strict';
// npm run contrast — WCAG 2.1 AA check of the palette in src/styles.css and
// the editor theme in src/Editor.tsx. Text pairs need 4.5:1; the boundaries of
// controls need 3:1. Update this list when you change a colour.
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const BG = '#0f1218', PANEL = '#171b24', PANEL2 = '#1e2430', EDITOR = '#0b0e14';
const text = [
  ['body text / page', '#e8ebf2', BG], ['body text / panel', '#e8ebf2', PANEL], ['body text / raised panel', '#e8ebf2', PANEL2],
  ['muted / page', '#a7b1c2', BG], ['muted / panel', '#a7b1c2', PANEL], ['muted / raised panel', '#a7b1c2', PANEL2],
  ['accent text / page', '#f5b83d', BG], ['accent text / panel', '#f5b83d', PANEL],
  ['primary button label', '#1a1304', '#f5b83d'], ['primary button label (hover)', '#1a1304', '#ffca5c'],
  ['pass / panel', '#5fe08d', PANEL], ['pass / raised panel', '#5fe08d', PANEL2], ['pass / green tint', '#5fe08d', '#12301f'],
  ['fail / panel', '#ff9a9a', PANEL], ['fail / raised panel', '#ff9a9a', PANEL2], ['fail / red tint', '#ff9a9a', '#351a1c'],
  ['text / green tint', '#e8ebf2', '#12301f'], ['text / red tint', '#e8ebf2', '#2a1c1d'], ['text / wrong choice', '#e8ebf2', '#351a1c'],
  ['link / panel', '#7fcaff', PANEL], ['tier core', '#7fcaff', PANEL], ['tier advanced', '#ffb3d1', PANEL],
  ['track chip', '#dbe4ff', '#2b3550'], ['toast text', '#e8ebf2', '#232b3a'], ['resume card text', '#e8ebf2', '#2a2210'], ['muted / resume card', '#a7b1c2', '#2a2210'],
  ['editor text', '#e8ebf2', EDITOR], ['editor gutter', '#8b96aa', EDITOR], ['editor comment', '#9aa7bd', EDITOR],
  ['editor keyword', '#c9b0ff', EDITOR], ['editor string', '#a5e89a', EDITOR], ['editor number', '#ffb877', EDITOR],
  ['editor function', '#7fcaff', EDITOR], ['editor type', '#63e6d0', EDITOR], ['editor property', '#f0c674', EDITOR],
  ['editor punctuation', '#c3cad8', EDITOR], ['editor invalid', '#ff9a9a', EDITOR], ['editor text / selection', '#e8ebf2', '#2c4a7a'],
];
const ui = [
  ['control border / page', '#6b7890', BG], ['control border / panel', '#6b7890', PANEL], ['control border / raised panel', '#6b7890', PANEL2],
  ['focus ring / page', '#f5b83d', BG], ['focus ring / panel', '#f5b83d', PANEL], ['progress fill / track', '#f5b83d', '#2b3342'],
  ['belt swatch border / panel', '#aab3c3', PANEL], ['correct-choice border', '#5fe08d', BG], ['wrong-choice border', '#ff9a9a', BG],
];
let bad = 0;
const check = (rows, min) => rows.forEach(([name, fg, bg]) => {
  const r = ratio(fg, bg);
  if (r < min) bad++;
  console.log(`${r >= min ? 'ok  ' : 'FAIL'} ${r.toFixed(2).padStart(5)}:1  (needs ${min})  ${name}`);
});
check(text, 4.5);
check(ui, 3);
console.log(bad ? `\n${bad} pair(s) below AA.` : '\nAll pairs meet WCAG 2.1 AA.');
process.exit(bad ? 1 : 0);
