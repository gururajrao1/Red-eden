/* Science-coverage test: every reaction event the sim can emit must have a
   just-in-time note, and every note must be short and wired to the page.
   Run: node tests/sandbox-science-test.js   (from the evolution/ root) */
'use strict';
const fs = require('fs');
const sim = fs.readFileSync(__dirname + '/../app/simsandbox.js', 'utf8');
const ui = fs.readFileSync(__dirname + '/../app/sandbox.js', 'utf8');
const html = fs.readFileSync(__dirname + '/../app/sandbox.html', 'utf8');
let fail = 0;
const ok = (name, cond, info) => {
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (cond ? '' : ' :: ' + info));
  if (!cond) fail++;
};
// every ev.push(['kind', ...]) in the sim
const kinds = [...new Set([...sim.matchAll(/ev\.push\(\['(\w+)'/g)].map(m => m[1]))];
// SCIENCE block keys (brace-counted so message text cannot confuse it)
const start = ui.indexOf('const SCIENCE = {');
let depth = 0, end = -1;
for (let i = ui.indexOf('{', start); i < ui.length; i++) {
  if (ui[i] === '{') depth++;
  if (ui[i] === '}') { depth--; if (!depth) { end = i; break; } }
}
const block = ui.slice(start, end + 1);
const keys = [...block.matchAll(/^  (\w+): \{/gm)].map(m => m[1]);
const msgs = [...block.matchAll(/m: '((?:[^'\\]|\\.)*)'/g)].map(m => m[1]);
const titles = [...block.matchAll(/t: '((?:[^'\\]|\\.)*)'/g)].map(m => m[1]);
ok('every sim event has a note', kinds.every(k => keys.includes(k)),
  'missing: ' + kinds.filter(k => !keys.includes(k)).join(','));
ok('no orphan notes', keys.every(k => kinds.includes(k)),
  'orphans: ' + keys.filter(k => !kinds.includes(k)).join(','));
ok('notes are one-liners (<=140)', msgs.length === keys.length && msgs.every(m => m.length <= 140),
  'bad: ' + msgs.filter(m => m.length > 140).join(' | '));
ok('journal titles unique', new Set(titles).size === titles.length, 'dupes');
ok('journal wired to page', html.includes('id="journal"') && html.includes('id="jcount"')
  && ui.includes('refreshJournal()'), 'journal/jcount/refreshJournal');
ok('tool picks explain themselves', ui.includes('showTool(p)'), 'showTool not called');
console.log(fail ? `\n${fail} SCIENCE FAILURES` : `\nALL SCIENCE COVERED (${keys.length}/${kinds.length} events)`);
process.exit(fail ? 1 : 0);
