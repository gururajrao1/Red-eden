/* The readout lives above the yard and teaches constantly: the inspect tab pins
   the hovered tile's story plus one experiment, and the clue strip rotates live
   guidance (next problem, planting needs, undiscovered reactions, RP).
   Run: node tests/sandbox-clue-test.js   (from the evolution/ root) */
'use strict';
const fs = require('fs');
const vm = require('vm');
const base = __dirname + '/../app/';
const Wpx = 768, Hpx = 480;
const ctx = {
  imageSmoothingEnabled: true, globalAlpha: 1, lineWidth: 1,
  fillStyle: '#000', strokeStyle: '#000',
  fillRect() {}, strokeRect() {}, beginPath() {}, arc() {}, stroke() {},
  moveTo() {}, lineTo() {}, fillText() {},
};
function mkEl(id) {
  return {
    id, innerHTML: '', textContent: '', hidden: false,
    style: {}, dataset: {}, children: [],
    classList: { add() {}, remove() {}, toggle() {} },
    appendChild(c) { this.children.push(c); return c; },
    addEventListener(ev, fn) { this['on' + ev] = fn; },
    getContext: () => ctx,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 768, height: 480 }),
    setPointerCapture() {},
    click() { if (this.onclick) this.onclick({ target: this }); },
  };
}
const store = {};
const els = {};
const sb = {
  console, performance: { now: () => 0 },
  requestAnimationFrame: () => {},
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
  window: { addEventListener() {} },
  document: {
    getElementById: id => els[id] || (els[id] = mkEl(id)),
    createElement: t => mkEl(t),
    querySelectorAll: () => [],
  },
  Math, JSON, Set, Map, Float32Array, Uint8Array, Uint8ClampedArray, Array,
  Object, Number, String, Boolean, Error, parseInt, parseFloat, isNaN,
  setTimeout: () => 0, clearTimeout: () => {},
};
sb.globalThis = sb;
vm.createContext(sb);
vm.runInContext(fs.readFileSync(base + 'simsandbox.js', 'utf8'), sb);
vm.runInContext(fs.readFileSync(base + 'sandbox.js', 'utf8'), sb);
let fail = 0;
const ok = (name, cond, info) => {
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (cond ? '' : ' :: ' + info));
  if (!cond) fail++;
};
// 1. readout order in the real HTML: inspect + clue + ticker all above the yard
const html = fs.readFileSync(base + 'sandbox.html', 'utf8');
const at = id => html.indexOf(`id="${id}"`);
ok('readout sits above the yard', at('readout') > -1 && at('readout') < at('sandbox'),
  `readout@${at('readout')} canvas@${at('sandbox')}`);
ok('inspect pinned at top', at('inspect') < at('sandbox'), `inspect@${at('inspect')}`);
ok('ticker pinned at top', at('ticker') < at('sandbox'), `ticker@${at('ticker')}`);
ok('clue strip exists above yard', at('clue') > -1 && at('clue') < at('sandbox'), `clue@${at('clue')}`);
ok('palette stays below yard', at('palette') > at('sandbox'), 'palette moved?');
// 2. clue pool on a fresh earth yard leads with the first problem
vm.runInContext(`world = createWorld('earth', 11)`, sb);
const pool0 = vm.runInContext(`cluePool().join('\\n---\\n')`, sb);
ok('clue pool leads with next problem', pool0.includes('E1'), pool0.split('\n')[0]);
ok('clue pool teaches reactions', /undiscovered/i.test(pool0), pool0.split('\n')[2] || pool0);
ok('clue pool tracks RP', /unlocks at/i.test(pool0), 'no RP line');
vm.runInContext(`updateClue()`, sb);
ok('clue strip renders', /NEXT|undiscovered|unlocks/i.test(els.clue.innerHTML), els.clue.innerHTML);
// 3. hover readout carries a try-this experiment for soil
vm.runInContext(`paint(world, 'base', 4, 32, 25, 2); inspect(32, 25)`, sb);
ok('soil readout keeps its story', els.inspect.innerHTML.includes('soil'), els.inspect.innerHTML);
ok('soil readout adds try-this', els.inspect.innerHTML.includes('try this:'), els.inspect.innerHTML);
// 4. hover readout carries a try-this for life too
vm.runInContext(`paint(world, 'life', 3, 20, 20, 1); inspect(20, 20)`, sb);
ok('grass readout adds try-this', els.inspect.innerHTML.includes('try this:'), els.inspect.innerHTML);
// 5. picking a life tool puts its needs into the rotation
const nav = els.palette;
const b = nav.children.find(c => (c.innerHTML.match(/<b>(.*?)<\/b>/) || [])[1] === 'Grass');
if (!b) { ok('grass picker exists', false, 'no button'); }
else {
  b.onclick();
  const pool1 = vm.runInContext(`cluePool().join('\\n---\\n')`, sb);
  ok('planting clue names needs', pool1.includes('Planting grass?'), pool1);
}
console.log(fail ? `\n${fail} CLUE FAILURES` : '\nREADOUT TEACHES FROM THE TOP');
process.exit(fail ? 1 : 0);
