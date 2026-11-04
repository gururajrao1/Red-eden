/* Brush test: the pointer really resizes — default 2, +/− buttons, slider,
   and the painted disc matches the radius (0 = single tile).
   Run: node tests/sandbox-brush-test.js   (from the evolution/ root) */
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
ok('pointer defaults to radius 2', V('brush') === 2, 'brush=' + V('brush'));
V(`$('btn-brush').click()`);
ok('+ button grows to 3 and syncs dots + slider',
  V('brush') === 3 && V(`$('btn-brush').textContent`) === '●●●○○○' && V(`$('rng-brush').value`) === '3',
  `brush=${V('brush')} dots=${V(`$('btn-brush').textContent`)} slider=${V(`$('rng-brush').value`)}`);
V(`$('btn-brush-dec').click()`);
ok('− button shrinks back to 2', V('brush') === 2, 'brush=' + V('brush'));
// slider drags the pointer down to a single tile
els['rng-brush'].oninput({ target: { value: '0' } });
ok('slider sets single tile and dots go hollow',
  V('brush') === 0 && V(`$('btn-brush').textContent`) === '○○○○○○', 'brush=' + V('brush'));
V(`setBrush(9)`);
ok('brush clamps at 6 for megabuilds', V('brush') === 6, 'brush=' + V('brush'));
V(`setBrush(-2)`);
ok('brush clamps at 0', V('brush') === 0, 'brush=' + V('brush'));
// the painted disc matches the radius: erase then stamp SUN (id 26, never natural)
const suns = () => V(`world.el.reduce((n, e) => n + (e === 26 ? 1 : 0), 0)`);
V(`tool = { kind: 'base', id: 0 }`); // eraser
V(`paintAt({ clientX: 240, clientY: 300 })`); // tile (20,25), brush 0
V(`tool = { kind: 'base', id: 26 }`);
V(`paintAt({ clientX: 240, clientY: 300 })`);
ok('radius 0 paints exactly one tile', suns() === 1, 'suns=' + suns());
V(`setBrush(2)`);
V(`tool = { kind: 'base', id: 0 }`);
V(`paintAt({ clientX: 480, clientY: 300 })`); // tile (40,25), brush 2
V(`tool = { kind: 'base', id: 26 }`);
V(`paintAt({ clientX: 480, clientY: 300 })`);
ok('radius 2 paints a 21-tile disc', suns() === 22, 'suns=' + suns());
V(`setBrush(6)`);
V(`tool = { kind: 'base', id: 0 }`);
V(`paintAt({ clientX: 600, clientY: 300 })`); // tile (50,25), brush 6
V(`tool = { kind: 'base', id: 26 }`);
V(`paintAt({ clientX: 600, clientY: 300 })`);
ok('radius 6 paints a megastructure disc', suns() === 22 + 129, 'suns=' + suns());
console.log(fail ? `\n${fail} BRUSH FAILURES` : '\nPOINTER RESIZES');
process.exit(fail ? 1 : 0);
