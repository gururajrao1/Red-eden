/* Save/load round-trip: paint a yard, save it, wipe it, load it back.
   Run: node tests/sandbox-save-test.js   (from the evolution/ root) */
'use strict';
const fs = require('fs');
const vm = require('vm');
const base = __dirname + '/../app/';
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
els['btn-start'].click();
vm.runInContext(`world = createWorld('earth', 5)`, sb);
vm.runInContext(`paint(world, 'base', 4, 20, 20, 4)`, sb); // soil block
vm.runInContext(`for (let i = 0; i < 2560; i++) if (world.el[i] === 4) world.wet[i] = 1`, sb);
vm.runInContext(`paint(world, 'life', 3, 20, 20, 3)`, sb); // grass
vm.runInContext(`paint(world, 'base', 27, 50, 30, 2)`, sb); // concrete landmark (static)
for (let k = 0; k < 10; k++) vm.runInContext(`tick()`, sb);
const sol = vm.runInContext(`world.sol`, sb);
vm.runInContext(`world.m1done = true; world.quests.M1 = 99;`, sb); // quest state must survive too
vm.runInContext(`saveSlot(1)`, sb);
ok('save confirms', els.ticker.textContent.includes('slot 1'), els.ticker.textContent.slice(0, 60));
vm.runInContext(`paint(world, 'base', 0, 32, 20, 30)`, sb); // wipe the yard
vm.runInContext(`loadSlot(1)`, sb);
ok('world id restored', vm.runInContext(`world.id`, sb) === 'earth', '');
ok('sol restored', vm.runInContext(`world.sol`, sb) === sol + 1, 'sol=' + vm.runInContext(`world.sol`, sb));
ok('matter restored', vm.runInContext(`world.el[20 * 64 + 20]`, sb) === 4, '');
ok('life counts rebuilt', vm.runInContext(`world.counts.grass`, sb) > 0, '');
ok('landmark restored', vm.runInContext(`world.el[30 * 64 + 50]`, sb) === 27, '');
ok('quest state restored', vm.runInContext(`world.quests.M1`, sb) === 99
  && vm.runInContext(`world.m1done`, sb) === true, '');
ok('history restored', vm.runInContext(`world.hist.length`, sb) > 0, '');
vm.runInContext(`loadSlot(2)`, sb);
ok('empty slot says so', els.ticker.textContent.includes('empty'), els.ticker.textContent.slice(0, 60));
console.log(fail ? `\n${fail} SAVE FAILURES` : '\nSAVE/LOAD ROUND-TRIPS');
process.exit(fail ? 1 : 0);
