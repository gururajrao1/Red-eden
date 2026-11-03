/* Sound-coverage test: every reaction event the sim can emit must have a voice,
   and every voice must hold sane synth numbers (no ear-bleed, no silence).
   Run: node tests/sandbox-sfx-test.js   (from the evolution/ root) */
'use strict';
const fs = require('fs');
const sim = fs.readFileSync(__dirname + '/../app/simsandbox.js', 'utf8');
const ui = fs.readFileSync(__dirname + '/../app/sandbox.js', 'utf8');
let fail = 0;
const ok = (name, cond, info) => {
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (cond ? '' : ' :: ' + info));
  if (!cond) fail++;
};
// every ev.push(['kind', ...]) in the sim
const kinds = [...new Set([...sim.matchAll(/ev\.push\(\['(\w+)'/g)].map(m => m[1]))];
// SFX block keys (brace-counted so note arrays cannot confuse it)
const start = ui.indexOf('const SFX = {');
let depth = 0, end = -1;
for (let i = ui.indexOf('{', start); i < ui.length; i++) {
  if (ui[i] === '{') depth++;
  if (ui[i] === '}') { depth--; if (!depth) { end = i; break; } }
}
const block = ui.slice(start, end + 1);
const keys = [...block.matchAll(/(\w+): \[\[/g)].map(m => m[1]);
ok('every sim event has a voice', kinds.every(k => keys.includes(k)),
  'missing: ' + kinds.filter(k => !keys.includes(k)).join(','));
ok('no orphan voices', keys.every(k => kinds.includes(k)),
  'orphans: ' + keys.filter(k => !kinds.includes(k)).join(','));
// every note: [freq, dur, type?, vol?, delay?] with playable numbers
const notes = [...block.matchAll(/\[(\d+),\s*([\d.]+)([^\]]*)\]/g)];
ok('all voices well-formed', notes.length > 0 && notes.every(m => {
  const f = +m[1], d = +m[2];
  return f >= 40 && f <= 2000 && d >= 0.01 && d <= 0.5;
}), 'bad note ranges');
ok('genesis gets the arpeggio', /genesis: \[\[523,.+659,.+784,/s.test(block), 'genesis flat');
console.log(fail ? `\n${fail} SFX FAILURES` : `\nALL SOUND COVERED (${keys.length}/${kinds.length} events)`);
process.exit(fail ? 1 : 0);
