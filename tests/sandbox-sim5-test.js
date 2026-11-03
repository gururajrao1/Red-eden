/* Batch-5 harness: ten new elements (basalt..tuff) form through the real
   tick path, plus picker/inspector names exist for all of them.
   Run: node tests/sandbox-sim5-test.js   (from the evolution/ root) */
'use strict';
const fs = require('fs');
const S = require('../app/simsandbox.js');
const { E, LIFE, TECH } = S;
let pass = 0, fail = 0;
function ok(name, cond, info) {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + ' :: ' + info); }
}
const step = (w, n) => { for (let k = 0; k < n; k++) S.stepWorld(w); };
const countEl = (w, id) => { let n = 0; for (let i = 0; i < w.el.length; i++) if (w.el[i] === id) n++; return n; };

ok('batch-3 ids 69-78', E.BASALT === 69 && E.PERMAFROST === 70 && E.STEEL === 71 && E.COMPOST === 72
  && E.SLUSH === 73 && E.EMBER === 74 && E.PHOSPHORUS === 75 && E.MUD === 76
  && E.SINTER === 77 && E.TUFF === 78, JSON.stringify([E.BASALT, E.TUFF]));
// 1. lava cooling on dry land lays basalt (the old comment already said so)
{
  const w = S.createWorld('hadean', 500);
  S.paint(w, 'base', E.LAVA, 32, 30, 2);
  step(w, 80);
  ok('lava cools to basalt', countEl(w, E.BASALT) > 0, 'basalt=' + countEl(w, E.BASALT));
}
// 2. bloomery steel: a lava/metal/charcoal row deep underground (all static there)
{
  const w = S.createWorld('earth', 501);
  S.paint(w, 'base', E.LAVA, 28, 35, 0);
  S.paint(w, 'base', E.METAL, 29, 35, 0);
  S.paint(w, 'base', E.CHARCOAL, 30, 35, 0);
  step(w, 120);
  ok('metal smelts to steel', countEl(w, E.STEEL) > 0, 'steel=' + countEl(w, E.STEEL));
}
// 3. fungus rots some wood to compost
{
  const w = S.createWorld('earth', 502);
  S.paint(w, 'base', E.WOOD, 20, 20, 3);
  for (let i = 0; i < w.el.length; i++) if (w.el[i] === E.WOOD) w.wet[i] = 0.9;
  S.paint(w, 'life', LIFE.FUNGUS, 20, 20, 3);
  for (let k = 0; k < 20; k++) {
    step(w, 10);
    for (let i = 0; i < w.el.length; i++) if (w.el[i] === E.WOOD) w.wet[i] = Math.max(w.wet[i], 0.8);
  }
  ok('rot yields compost', countEl(w, E.COMPOST) > 0, 'compost=' + countEl(w, E.COMPOST));
}
// 4. slush stages both ways
{
  const w = S.createWorld('earth', 503);
  S.paint(w, 'base', E.SLUSH, 20, 20, 2);
  step(w, 10);
  ok('slush melts to water', countEl(w, E.WATER) > 0 && countEl(w, E.SLUSH) === 0,
    `water=${countEl(w, E.WATER)} slush=${countEl(w, E.SLUSH)}`);
  const v = S.createWorld('europa', 504);
  S.paint(v, 'base', E.SLUSH, 20, 20, 2);
  step(v, 10);
  ok('slush refreezes to ice', countEl(v, E.ICE) > 0, 'ice=' + countEl(v, E.ICE));
}
// 5. fires die back to embers on fuel beds
{
  const w = S.createWorld('earth', 505);
  S.paint(w, 'base', E.WOOD, 32, 25, 5);
  S.paint(w, 'base', E.FIRE, 32, 20, 0); // lit corner: the front advances for hundreds of ticks
  let seen = 0;
  for (let k = 0; k < 300; k++) { S.stepWorld(w); seen = Math.max(seen, countEl(w, E.EMBER)); }
  ok('embers bank on fuel', seen > 0, 'max ember=' + seen);
}
// 6. phosphorus: spontaneous in air, safe in vacuum
{
  const w = S.createWorld('earth', 506);
  S.paint(w, 'base', E.LAVA, 30, 25, 1);
  S.paint(w, 'base', E.PHOSPHORUS, 30, 28, 1);
  step(w, 60);
  ok('phosphorus catches in air', countEl(w, E.PHOSPHORUS) === 0, 'left=' + countEl(w, E.PHOSPHORUS));
  const v = S.createWorld('moon', 507);
  S.paint(v, 'base', E.LAVA, 30, 25, 1);
  S.paint(v, 'base', E.PHOSPHORUS, 30, 28, 1);
  step(v, 60);
  ok('phosphorus stockpiles in vacuum', countEl(v, E.PHOSPHORUS) > 0, 'left=' + countEl(v, E.PHOSPHORUS));
}
// 7. soil-wetting stages through mud, and mud dries back
{
  const w = S.createWorld('earth', 508);
  S.paint(w, 'base', E.SOIL, 20, 25, 2);
  S.paint(w, 'base', E.WATER, 20, 22, 2);
  let seenMud = 0;
  for (let k = 0; k < 120; k++) { S.stepWorld(w); seenMud = Math.max(seenMud, countEl(w, E.MUD)); }
  ok('wet soil goes muddy', seenMud > 0, 'max mud=' + seenMud);
  const v = S.createWorld('moon', 509); // vacuum: no standing water anywhere
  S.paint(v, 'base', E.MUD, 20, 20, 2);
  step(v, 60);
  ok('mud dries to soil', countEl(v, E.MUD) === 0 && countEl(v, E.SOIL) > 0,
    `mud=${countEl(v, E.MUD)} soil=${countEl(v, E.SOIL)}`);
}
// 8. hot vent water lays silica on sand
{
  const w = S.createWorld('earth', 510);
  S.paint(w, 'base', E.VENT, 32, 35, 1);
  // triple junctions on solid ground: sand touching vent + water (5 candidates)
  for (const [wx, sx] of [[30, 30], [34, 34]]) {
    S.paint(w, 'base', E.WATER, wx, 35, 0);
    S.paint(w, 'base', E.SAND, sx, 36, 0);
  }
  S.paint(w, 'base', E.WATER, 32, 33, 0);
  S.paint(w, 'base', E.SAND, 33, 33, 0);
  S.paint(w, 'base', E.SAND, 31, 33, 0);
  S.paint(w, 'base', E.WATER, 32, 37, 0);
  S.paint(w, 'base', E.SAND, 31, 37, 0);
  step(w, 300);
  ok('sinter terraces grow', countEl(w, E.SINTER) > 0, 'sinter=' + countEl(w, E.SINTER));
}
// 9. buried ash lithifies
{
  const w = S.createWorld('earth', 511);
  S.paint(w, 'base', E.ASH, 20, 20, 3);
  step(w, 300);
  ok('ash compacts to tuff', countEl(w, E.TUFF) > 0, 'tuff=' + countEl(w, E.TUFF));
}
// 10. permafrost locks and releases
{
  const w = S.createWorld('europa', 512);
  S.paint(w, 'base', E.SOIL, 20, 20, 2);
  step(w, 120);
  ok('deep cold locks soil', countEl(w, E.PERMAFROST) > 0, 'permafrost=' + countEl(w, E.PERMAFROST));
  const v = S.createWorld('earth', 513);
  S.paint(v, 'base', E.PERMAFROST, 20, 20, 2);
  step(v, 40);
  ok('thaw frees soil', countEl(v, E.SOIL) > 0, 'soil=' + countEl(v, E.SOIL));
}
// picker + inspector know all ten names
const ui = fs.readFileSync(__dirname + '/../app/sandbox.js', 'utf8');
for (const n of ['Basalt', 'Permafrost', 'Steel', 'Compost', 'Slush', 'Ember', 'Phosphorus', 'Mud', 'Sinter', 'Tuff'])
  ok(`picker sells ${n}`, ui.includes(`name: '${n}'`), 'missing ' + n);
console.log(fail ? `\n${fail} SIM5 FAILURES (${pass} passed)` : `\nALL ${pass} SIM5 PASSED`);
process.exit(fail ? 1 : 0);
