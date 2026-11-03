/* Batch-3 harness: hydrothermal vents + Europa/Hadean quests (U3/U4/H3/H4).
   Run: node tests/sandbox-sim3-test.js   (from the evolution/ root) */
'use strict';
const S = require('../app/simsandbox.js');
const { E, LIFE, TECH } = S;
let pass = 0, fail = 0;
function ok(name, cond, info) {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + ' :: ' + info); }
}
const step = (w, n) => { for (let k = 0; k < n; k++) S.stepWorld(w); };
const countEl = (w, id) => { let n = 0; for (let i = 0; i < w.el.length; i++) if (w.el[i] === id) n++; return n; };
const countLife = (w, id) => { let n = 0; for (let i = 0; i < w.life.length; i++) if (w.life[i] === id) n++; return n; };
function stepEv(w, n) {
  const seen = new Set();
  for (let k = 0; k < n; k++) { S.stepWorld(w); for (const [kind] of w.ev) seen.add(kind); }
  return seen;
}

// 1. vent holds ~90C in europan ice and melts a standing pool (U3 fires)
{
  const w = S.createWorld('europa', 400);
  S.paint(w, 'base', E.VENT, 32, 25, 3);
  step(w, 60);
  const pt = w.pt[S.gidx(32, 25)];
  ok('vent holds 90C', pt > 70 && pt < 110, 'pt=' + pt.toFixed(0));
  step(w, 240);
  ok('vent melts a pool', countEl(w, E.WATER) >= 10, 'water=' + countEl(w, E.WATER));
  ok('U3 Warm pool fires', !!w.quests.U3, 'quests=' + JSON.stringify(w.quests));
}
// 2. white smoker lays limestone (U4 fires, smoker note exists)
{
  const w = S.createWorld('europa', 401);
  S.paint(w, 'base', E.VENT, 32, 25, 3);
  S.paint(w, 'base', E.WATER, 32, 22, 2);
  const ev = stepEv(w, 300);
  ok('vent precipitates (smoker)', ev.has('smoker'), 'no smoker');
  ok('limestone accumulates', countEl(w, E.LIMESTONE) >= 8, 'limestone=' + countEl(w, E.LIMESTONE));
  ok('U4 White smoker fires', !!w.quests.U4, 'quests=' + JSON.stringify(w.quests));
  ok('pool core survives the chimney', countEl(w, E.WATER) >= 5, 'water=' + countEl(w, E.WATER));
}
// 3. Glass shore: banked sand vitrifies against a permanent lava vent (H3 fires)
{
  const w = S.createWorld('hadean', 402);
  let vent = null; // find a real lava throat to bank sand against
  for (let y = 0; y < 40 && !vent; y++) for (let x = 0; x < 64; x++)
    if (w.el[y * 64 + x] === E.LAVA) { vent = [x, y]; break; }
  ok('hadean spawns a lava vent', !!vent, 'no lava at seed 402');
  if (vent) {
    S.paint(w, 'base', E.SAND, vent[0] + 4, vent[1], 4); // banked into the vent field: maximum contact
    const ev = stepEv(w, 200);
    ok('vent heat vitrifies sand', ev.has('glaze') && countEl(w, E.GLASS) >= 10,
      'glass=' + countEl(w, E.GLASS));
    ok('H3 Glass shore fires', !!w.quests.H3, 'quests=' + JSON.stringify(w.quests));
  }
}
// 4. shade garden: a domed, shaded, watered bed holds 50 fungus at night (H4 fires)
{
  const w = S.createWorld('hadean', 403);
  w.sol = 45;
  S.paint(w, 'base', E.WOOD, 32, 25, 5);
  S.paint(w, 'life', LIFE.FUNGUS, 32, 25, 5);
  S.paint(w, 'tech', TECH.DOME, 32, 25, 4);
  S.paint(w, 'tech', TECH.SHADE, 32, 25, 0);
  S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
  step(w, 2);
  ok('H4 Shade garden fires', !!w.quests.H4, `fungus=${countLife(w, LIFE.FUNGUS)} quests=` + JSON.stringify(w.quests));
}

console.log(fail ? `\n${fail} SIM3 FAILURES (${pass} passed)` : `\nALL ${pass} SIM3 PASSED`);
process.exit(fail ? 1 : 0);
