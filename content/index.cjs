'use strict';
// The curriculum: one file per track, in the order the sidebar shows them.
//
// Track    { id, name, short, blurb, lang, runner, challenges[], drills[] }
// Challenge{ id, title, tier (1|2|3), prompt, starter, solution, tests, hints[] }
//   + typeTests (TypeScript), setup (Bash/PowerShell), check / ordered (SQL/Mongo)
// Drill    { q, code?, choices[], answer (index into choices), why }
//
// Challenge ids are permanent once someone has progress: the save file keys on
// `trackId/challengeId`, so renaming one silently un-solves it.
const ids = ['javascript', 'typescript', 'node', 'react', 'nextjs', 'react-native', 'electron', 'postgresql', 'mongodb', 'bash', 'powershell', 'rust'];
const fs = require('fs');
const path = require('path');

module.exports = ids
  .filter((id) => fs.existsSync(path.join(__dirname, 'tracks', id + '.cjs')))
  .map((id) => require('./tracks/' + id + '.cjs'));
