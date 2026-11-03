/* Batch-4 harness: ecosystem score (E9) + abiogenesis chain (H5/H6).
   Run: node tests/sandbox-sim4-test.js   (from the evolution/ root) */
'use strict';
const S = require('../app/simsandbox.js');
const { E, LIFE, TECH } = S;
let pass = 0, fail = 0;
function ok(name, cond, info) {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + ' :: ' + info); }
}
const step = (w, n) => { for (let k = 0; k < n; k++) S.stepWorld(w); };
function stepEv(w, n) {
  const seen = new Set();
  for (let k = 0; k < n; k++) { S.stepWorld(w); for (const [kind] of w.ev) seen.add(kind); }
  return seen;
}

// 1. a supported everything-garden peaks past Shannon 1.4 (E9 latches the peak)
{
  const w = S.createWorld('earth', 500);
  w.sol = 15;
  const bed = (cx, el, life, r) => {
    S.paint(w, 'base', E.WATER, cx, 30, r);
    S.paint(w, 'base', el, cx, 30, r);
    S.paint(w, 'life', life, cx, 30, r);
    S.paint(w, 'tech', TECH.SPRINKLER, cx, 30, 0);
  };
  bed(8, E.SOIL, LIFE.GERMS, 2);
  bed(14, E.SOIL, LIFE.MOSS, 2);
  bed(20, E.SOIL, LIFE.GRASS, 2);
  bed(26, E.WOOD, LIFE.FUNGUS, 2);
  S.paint(w, 'base', E.WATER, 34, 30, 2);
  S.paint(w, 'life', LIFE.ALGAE, 34, 30, 2);
  S.paint(w, 'base', E.ROCK, 44, 30, 2);
  S.paint(w, 'life', LIFE.LICHEN, 44, 30, 1);
  S.paint(w, 'life', LIFE.WORMS, 20, 30, 1);
  step(w, 200);
  ok('garden scores Shannon + richness', w.counts.ecoH > 0.5 && w.counts.richness >= 4,
    `H=${w.counts.ecoH} richness=${w.counts.richness}`);
  ok('E9 Web of life fires', !!w.quests.E9, 'quests=' + JSON.stringify(w.quests));
}
// 2. abiogenesis, end to end: basin + salted vent pool + dome -> soup -> genesis -> 100
{
  const w = S.createWorld('hadean', 504);
  w.sol = 45;
  for (let x = 27; x <= 37; x++) { S.paint(w, 'base', E.ROCK, x, 21, 0); S.paint(w, 'base', E.ROCK, x, 31, 0); }
  for (let y = 21; y <= 31; y++) { S.paint(w, 'base', E.ROCK, 27, y, 0); S.paint(w, 'base', E.ROCK, 37, y, 0); }
  S.paint(w, 'base', E.WATER, 32, 26, 3);
  S.paint(w, 'base', E.SALT, 32, 26, 2); // (buried by the vent below: paint buries actors)
  S.paint(w, 'base', E.VENT, 32, 26, 2); // actors last: paint buries
  // salt that survives: four blobs on the pool rim dissolve into real brine,
  // which alone holds liquid at vent heat in vacuum (fresh boils past 60)
  for (const [sx, sy] of [[29, 26], [35, 26], [32, 23], [32, 29]])
    S.paint(w, 'base', E.SALT, sx, sy, 1);
  S.paint(w, 'tech', TECH.DOME, 32, 26, 5);
  S.paint(w, 'tech', TECH.SPRINKLER, 32, 26, 0);
  S.paint(w, 'base', E.WATER, 18, 12, 5); // open top-up pool: freshwater for the H5 census
  const evEarly = stepEv(w, 60);
  ok('H5 Primordial soup fires', !!w.quests.H5, 'quests=' + JSON.stringify(w.quests));
  const ev = stepEv(w, 640);
  for (const k of evEarly) ev.add(k);
  ok('vent pool seeds germs (genesis)', ev.has('genesis'), 'no genesis');
  ok('H6 Genesis fires', !!w.quests.H6, `germs=${w.counts.germs} quests=` + JSON.stringify(w.quests));
}

console.log(fail ? `\n${fail} SIM4 FAILURES (${pass} passed)` : `\nALL ${pass} SIM4 PASSED`);
process.exit(fail ? 1 : 0);
