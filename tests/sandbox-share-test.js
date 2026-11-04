/* Share/challenge/census test: yard codes round-trip byte-exact, weekly seeds
   are deterministic, the census CSV carries the metrics, and the new buttons
   survive a hostile (featureless) DOM without throwing.
   Run: node tests/sandbox-share-test.js   (from the evolution/ root) */
'use strict';
const fs = require('fs');
const vm = require('vm');
const base = __dirname + '/../app/';
function mkEl(id) {
  return {
    id, innerHTML: '', textContent: '', hidden: false, value: '',
    style: {}, dataset: {}, children: [],
    classList: { add() {}, remove() {}, toggle() {} },
    appendChild(c) { this.children.push(c); return c; },
    addEventListener(ev, fn) { this['on' + ev] = fn; },
    getContext: () => ({ fillRect() {}, strokeRect() {}, beginPath() {}, arc() {}, stroke() {} }),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 768, height: 480 }),
    setPointerCapture() {},
    click() { if (this.onclick) this.onclick({ target: this }); },
  };
}
const els = {};
const sb = {
  console, performance: { now: () => 0 },
  requestAnimationFrame: () => {},
  localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = v; } },
  window: { addEventListener() {} },
  document: {
    getElementById: id => els[id] || (els[id] = mkEl(id)),
    createElement: t => mkEl(t),
    querySelectorAll: () => [],
  },
  btoa: s => Buffer.from(s, 'binary').toString('base64'),
  atob: s => Buffer.from(s, 'base64').toString('binary'),
  Math, JSON, Set, Map, Float32Array, Uint8Array, Uint8ClampedArray, Array,
  Object, Number, String, Boolean, Error, parseInt, parseFloat, isNaN, Date,
  setTimeout: () => 0, clearTimeout: () => {},
};
sb.globalThis = sb;
vm.createContext(sb);
vm.runInContext(fs.readFileSync(base + 'simsandbox.js', 'utf8'), sb);
vm.runInContext(fs.readFileSync(base + 'sandbox.js', 'utf8'), sb);
const V = expr => vm.runInContext(expr, sb);
let fail = 0;
const ok = (name, cond, info) => {
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (cond ? '' : ' :: ' + info));
  if (!cond) fail++;
};
// paint a yard, tick it, round-trip a share code byte-exact
V(`paint(world, 'base', 7, 20, 25, 3)`);
V(`paint(world, 'life', 3, 20, 25, 2)`);
V(`for (let k = 0; k < 5; k++) stepWorld(world)`);
const code = V('shareEncode()');
ok('share code is a long pastable string', typeof code === 'string' && code.length > 1000, typeof code);
const same = V(`JSON.stringify(shareDecode(shareEncode()).el) === JSON.stringify(Array.from(world.el))`);
ok('share round-trips matter byte-exact', same === true, 'el mismatch');
const w0 = V('world.sol');
V(`world = unpackWorld(shareDecode(shareEncode()))`);
ok('shared yard unpacks smeared but sane', V('world.sol') === w0 + 1 && V('world.id') === 'earth' && !!V('world.counts'),
  `sol ${V('world.sol')} id ${V('world.id')}`);
// census CSV carries the metrics
const csv = V('censusCSV()');
ok('census header + metrics', csv.startsWith('metric,value') && csv.includes('\ngerms,') && csv.includes('\nsol,')
  && csv.includes('\necoH,') && csv.includes('\nworld,earth'), csv.split('\n').slice(0, 3).join('|'));
// weekly challenge: deterministic, world- and week-sensitive, ISO-shaped
const a = V(`challengeSeed('mars', '2026-W45')`);
ok('challenge seed deterministic', a === V(`challengeSeed('mars', '2026-W45')`), a);
ok('challenge seed varies by world', a !== V(`challengeSeed('europa', '2026-W45')`), 'same seed');
ok('challenge seed varies by week', a !== V(`challengeSeed('mars', '2026-W46')`), 'same seed');
ok('iso weeks: Mon+Wed same, Sun vs Mon differ',
  V(`isoWeek(new Date('2026-11-02T00:00:00Z'))`) === V(`isoWeek(new Date('2026-11-04T00:00:00Z'))`) &&
  V(`isoWeek(new Date('2026-11-01T00:00:00Z'))`) !== V(`isoWeek(new Date('2026-11-02T00:00:00Z'))`),
  V(`isoWeek(new Date('2026-11-03T00:00:00Z'))`));
// same seed grows the same world
const e1 = V(`JSON.stringify(Array.from(createWorld('europa', challengeSeed('europa', '2026-W45')).el))`);
const e2 = V(`JSON.stringify(Array.from(createWorld('europa', challengeSeed('europa', '2026-W45')).el))`);
ok('challenge worlds identical for everyone', e1 === e2, 'worldgen differs');
// hostile DOM: every new button survives clicks without throwing
for (const id of ['btn-csv', 'btn-share', 'btn-loadcode', 'btn-challenge']) {
  try { els[id].click(); ok(id + ' click safe', true); }
  catch (e) { ok(id + ' click safe', false, e.message); }
}
els.sharecode.value = '!!!not-a-code!!!';
try { els['btn-loadcode'].click(); ok('garbage code handled', els.ticker.textContent.length > 0); }
catch (e) { ok('garbage code handled', false, e.message); }
// voices + eco line run headless without throwing
try {
  V(`playSfx('genesis'); playSfx('bogus'); playSfx('boom')`);
  ok('sfx plays headless', true);
} catch (e) { ok('sfx plays headless', false, e.message); }
ok('eco line reads sane', /Shannon H [\d.]+ · \d+ lifeforms/.test(V('ecoLine()')), V('ecoLine()'));
console.log(fail ? `\n${fail} SHARE FAILURES` : '\nALL SHARE/CHALLENGE/CENSUS PASS');
process.exit(fail ? 1 : 0);
