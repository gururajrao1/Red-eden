/* Progression proof: quest solves and journal firsts mint RP exactly once,
   and RP gates ranks and world unlocks.
   Run: node tests/sandbox-progress-test.js   (from the evolution/ root) */
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
    id, innerHTML: '', textContent: '', hidden: false, value: '',
    style: {}, dataset: {}, children: [], disabled: false, title: '',
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
const envBtns = ['earth', 'moon', 'mars', 'europa', 'hadean'].map(w => {
  const b = mkEl('env-' + w); b.dataset.world = w; return b;
});
const sb = {
  console, performance: { now: () => 0 },
  requestAnimationFrame: () => {},
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
  window: { addEventListener() {} },
  document: {
    getElementById: id => els[id] || (els[id] = mkEl(id)),
    createElement: t => mkEl(t),
    querySelectorAll: sel => (String(sel).includes('envbar') ? envBtns : []),
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
ok('starts at zero RP', vm.runInContext(`getRP()`, sb) === 0, '');
ok('europa locked at start', vm.runInContext(`isUnlocked('europa')`, sb) === false, '');
ok('earth always open', vm.runInContext(`isUnlocked('earth')`, sb) === true, '');
// solve E1 through the real tick path
vm.runInContext(`world = createWorld('earth', 5)`, sb);
vm.runInContext(`paint(world, 'base', 4, 20, 20, 8)`, sb);
vm.runInContext(`for (let i = 0; i < 2560; i++) if (world.el[i] === 4) world.wet[i] = 0.9`, sb);
vm.runInContext(`paint(world, 'life', 3, 20, 20, 8)`, sb);
vm.runInContext(`tick()`, sb);
ok('E1 solved', vm.runInContext(`!!world.quests.E1`, sb) === true, '');
// the tick also journals the pre-placed spill fizzing: 100 quest + 10 per first
const afterE1 = vm.runInContext(`Object.keys(journal).length`, sb);
ok('E1 mints quest + journal RP', store.sandbox_rp_total === String(100 + 10 * afterE1),
  'total=' + store.sandbox_rp_total);
vm.runInContext(`tick()`, sb);
const afterE1b = vm.runInContext(`Object.keys(journal).length`, sb);
ok('no double-claim (quest pays once)', store.sandbox_rp_total === String(100 + 10 * afterE1b),
  'total=' + store.sandbox_rp_total);
// journal firsts mint 10 each: quench a lava blob (burst, maybe steam too)
const before = +(store.sandbox_rp_total || 0);
const jb = vm.runInContext(`Object.keys(journal).length`, sb);
vm.runInContext(`paint(world, 'base', 10, 45, 20, 2)`, sb);
vm.runInContext(`paint(world, 'base', 7, 45, 16, 3)`, sb);
for (let k = 0; k < 15; k++) vm.runInContext(`tick()`, sb);
const keys = vm.runInContext(`Object.keys(journal)`, sb);
ok('burst journalled', keys.includes('burst'), JSON.stringify(keys));
ok('each first mints 10 RP', +(store.sandbox_rp_total || 0) === before + 10 * (keys.length - jb),
  'total=' + store.sandbox_rp_total);
// locked worlds answer instead of sitting dead (the reported bug: disabled
// buttons swallowed clicks, so Europa/Hadean felt unreachable)
const euBtn = envBtns[3], haBtn = envBtns[4];
euBtn.click();
ok('locked europa names its price + wallet', els.ticker.textContent.includes('unlocks at 400 RP (you have '),
  els.ticker.textContent);
ok('locked europa points at the next problem', els.ticker.textContent.includes('Next problem:'),
  els.ticker.textContent);
vm.runInContext(`refreshQuests()`, sb);
ok('locked buttons stay clickable', euBtn.disabled === false, 'disabled=' + euBtn.disabled);
ok('locked buttons wear the padlock', euBtn.textContent.startsWith('🔒') && euBtn.textContent.includes('Europa'),
  euBtn.textContent);
// ranks and unlocks follow the wallet
vm.runInContext(`addRP(400 - getRP(), 'test grant')`, sb);
ok('400 RP total', vm.runInContext(`getRP()`, sb) === 400, '');
ok('europa unlocks at 400', vm.runInContext(`isUnlocked('europa')`, sb) === true, '');
ok('hadean waits for 1000', vm.runInContext(`isUnlocked('hadean')`, sb) === false, '');
vm.runInContext(`refreshQuests()`, sb);
ok('rank names the grad student', els.rank.textContent === 'Grad student', els.rank.textContent);
ok('next unlock advertised', els.unlocknext.textContent.includes('titan'), els.unlocknext.textContent);
euBtn.click();
ok('europa opens at 400 RP', vm.runInContext(`world.id`, sb) === 'europa', vm.runInContext(`world.id`, sb));
haBtn.click();
ok('hadean still gated with directions', els.ticker.textContent.includes('unlocks at 1000 RP'),
  els.ticker.textContent);
ok('gated click switches nothing', vm.runInContext(`world.id`, sb) === 'europa', vm.runInContext(`world.id`, sb));
console.log(fail ? `\n${fail} PROGRESS FAILURES` : '\nPROGRESSION PAYS OUT');
process.exit(fail ? 1 : 0);
