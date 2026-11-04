/* Pixel proof for batch-6 materials: same bar as batch-5 (manhattan d>=40
   in daylight) over the real picker path and the single-blit renderer.
   Sample points land on sprite pixels: comb cells, guano splatter, clover
   leaflets, spider body, shrimp comma, archaea rods, cyano film, strom dome,
   tardi barrel, deino tetrads; trona's pale base stands alone.
   Run: node tests/sandbox-pixels-batch6.js   (from the evolution/ root) */
'use strict';
const fs = require('fs');
const vm = require('vm');
const base = __dirname + '/../app/';
const Wpx = 768, Hpx = 480;
const buf = new Uint8ClampedArray(Wpx * Hpx * 3);
function hexRGB(h) {
  const n = parseInt(h.slice(1), 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}
const ctx = {
  imageSmoothingEnabled: true, globalAlpha: 1, lineWidth: 1,
  fillStyle: '#000', strokeStyle: '#000',
  fillRect(x, y, w, h) {
    let c = this.fillStyle;
    if (typeof c !== 'string' || !c.startsWith('#')) {
      if (typeof c === 'string' && c.startsWith('rgba')) {
        const m = c.match(/[\d.]+/g).map(Number);
        const a = m[3];
        for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
          if (i < 0 || j < 0 || i >= Wpx || j >= Hpx) continue;
          const k = (j * Wpx + i) * 3;
          buf[k] = buf[k] * (1 - a) + m[0] * a;
          buf[k + 1] = buf[k + 1] * (1 - a) + m[1] * a;
          buf[k + 2] = buf[k + 2] * (1 - a) + m[2] * a;
        }
      }
      return;
    }
    const [r, g, b] = hexRGB(c.length === 4 ?
      '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3] : c);
    const al = this.globalAlpha;
    for (let j = Math.max(0, y | 0); j < Math.min(Hpx, y + h); j++)
      for (let i = Math.max(0, x | 0); i < Math.min(Wpx, x + w); i++) {
        const k = (j * Wpx + i) * 3;
        buf[k] = buf[k] * (1 - al) + r * al;
        buf[k + 1] = buf[k + 1] * (1 - al) + g * al;
        buf[k + 2] = buf[k + 2] * (1 - al) + b * al;
      }
  },
  strokeRect() {}, beginPath() {}, arc() {}, stroke() {},
  createImageData(w, h) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; },
  putImageData(img, x, y) { // the single blit: replace, never blend
    const ox = x | 0, oy = y | 0;
    for (let j = 0; j < img.height; j++) for (let i = 0; i < img.width; i++) {
      const px = ox + i, py = oy + j;
      if (px < 0 || py < 0 || px >= Wpx || py >= Hpx) continue;
      const s = (j * img.width + i) * 4, k = (py * Wpx + px) * 3;
      buf[k] = img.data[s]; buf[k + 1] = img.data[s + 1]; buf[k + 2] = img.data[s + 2];
    }
  },
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
const els = {};
const sb = {
  console, performance: { now: () => 0 },
  requestAnimationFrame: () => {},
  localStorage: { getItem: () => null, setItem: () => {} },
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
vm.runInContext(`world = createWorld('mars', 4242)`, sb); // pin terrain: pixel proof must not ride host randomness
vm.runInContext(`paint(world, 'base', 0, 24, 19, 24)`, sb);
// soil beds for the living rows (paint refuses rock and air)
for (const tx of [8, 14, 20, 26]) {
  vm.runInContext(`paint(world, 'base', 4, ${tx}, 10, 2)`, sb);
  vm.runInContext(`paint(world, 'base', 4, ${tx}, 16, 2)`, sb);
}
const row = (y, names) => names.forEach((n, k) => { pick(n); strokeAt(8 + k * 6, y); });
row(4, ['Honey', 'Guano', 'Trona']);
row(10, ['Clover', 'Spider', 'Shrimp', 'Archaea']);
row(16, ['Cyano', 'Strom', 'Tardi', 'Deino']);
vm.runInContext(`world.sol = 17`, sb); // daylight judgement
vm.runInContext(`draw()`, sb);
function px(tx, ty, ox, oy) {
  const k = ((ty * 12 + (oy || 6)) * Wpx + (tx * 12 + (ox || 6))) * 3;
  return [buf[k] | 0, buf[k + 1] | 0, buf[k + 2] | 0];
}
const S = { // sprite-anchored sample points (comb cells, guano splatter,
  Honey: [8, 4, 3, 4], Guano: [14, 4, 4, 5], Trona: [20, 4, 6, 6], // clover leaflets,
  Clover: [8, 10, 4, 5], Spider: [14, 10, 6, 6], Shrimp: [20, 10, 5, 5], // spider body, shrimp comma,
  Archaea: [26, 10, 4, 5], Cyano: [8, 16, 5, 7], Strom: [14, 16, 6, 4], // archaea rods, cyano film,
  Tardi: [20, 16, 6, 6], Deino: [26, 16, 4, 5], // strom dome, tardi barrel, deino tetrads
};
const got = {};
for (const [n, [tx, ty, ox, oy]] of Object.entries(S)) got[n] = px(tx, ty, ox, oy);
const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const BG = [6, 4, 3]; // empty tile
let fail = 0;
for (const [n, c] of Object.entries(got)) {
  console.log(n, 'rgb', JSON.stringify(c));
  if (dist(c, BG) < 40) { console.log('FAIL ' + n + ' blends into background'); fail++; }
}
const names = Object.keys(got);
for (let a = 0; a < names.length; a++) for (let b = a + 1; b < names.length; b++) {
  const d = dist(got[names[a]], got[names[b]]);
  if (d < 40) { console.log(`FAIL ${names[a]} vs ${names[b]} look identical (d=${d})`); fail++; }
}
console.log(fail ? `\n${fail} PIXEL FAILURES` : '\nALL BATCH-6 MATERIALS DISTINCT');
process.exit(fail ? 1 : 0);
