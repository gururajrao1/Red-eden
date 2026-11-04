/* Functional proof for just-in-time science: cause a real fire through the UI
   path, run real ticks, and assert the lesson reaches the ticker + journal.
   Run: node tests/sandbox-journal-test.js   (from the evolution/ root) */
'use strict';
const fs = require('fs');
const vm = require('vm');
const base = __dirname + '/../app/';
const Wpx = 768, Hpx = 480;
const buf = new Uint8ClampedArray(Wpx * Hpx * 3);
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
const nav = els.palette;
function pick(name) {
  const b = nav.children.find(c => (c.innerHTML.match(/<b>(.*?)<\/b>/) || [])[1] === name);
  if (!b) throw new Error('no picker button: ' + name);
  b.onclick();
}
function strokeAt(tx, ty) {
  const cv = els.sandbox;
  cv.onpointerdown({ clientX: (tx / 64) * 768, clientY: (ty / 40) * 480, pointerId: 1 });
  cv.onpointerup();
}
els['btn-start'].click();
vm.runInContext(`world = createWorld('earth', 5)`, sb); // air, mild: fire spreads
pick('Wood'); strokeAt(32, 20);
pick('Fire'); strokeAt(34, 22); // spark the edge: fuel must survive the strike
let sawTriangle = false; // the ticker shows the latest lesson, so watch every tick, not just the last
for (let k = 0; k < 25; k++) { vm.runInContext(`tick()`, sb); if (els.ticker.textContent.includes('triangle')) sawTriangle = true; } // under sol 30: no quest takes the ticker
ok('ticker teaches the fire triangle', sawTriangle,
  JSON.stringify(els.ticker.textContent.slice(0, 90)));
const keys = vm.runInContext(`Object.keys(journal)`, sb);
ok('journal logged ignite on earth', keys.includes('ignite')
  && vm.runInContext(`journal.ignite.world`, sb) === 'earth', JSON.stringify(keys));
const total = vm.runInContext(`Object.keys(SCIENCE).length`, sb);
ok('journal rendered + counted', els.journal.children.length >= 2
  && els.jcount.textContent === `${keys.length}/${total}`, els.jcount.textContent);
pick('Cryo');
ok('picking a tool explains it', els.inspect.innerHTML.includes('nitrogen'),
  els.inspect.innerHTML.slice(0, 80));
console.log(fail ? `\n${fail} JOURNAL FAILURES` : '\nSCIENCE REACHES THE PLAYER');
process.exit(fail ? 1 : 0);
