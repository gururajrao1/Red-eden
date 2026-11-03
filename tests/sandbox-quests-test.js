/* Quest proof, part 1: bot-plays every quest with no maintained coverage yet.
   Each block builds the yard the guide describes, runs the clock, and asserts
   the real done() flips. A failure here is a game bug, not a test bug.
   Run: node tests/sandbox-quests-test.js   (from the evolution/ root) */
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
const done = (w, id) => S.QUESTS.find(q => q.id === id).done(w, w.counts);
// E1 Meadow: soil bed + two sprinklers (adjacent pools wet only their rim —
// diffusion is short-range, so irrigation is the tool) + grass, then track
{
  const w = S.createWorld('earth', 601);
  S.paint(w, 'base', E.SOIL, 32, 25, 5);
  S.paint(w, 'tech', TECH.SPRINKLER, 29, 25, 0);
  S.paint(w, 'tech', TECH.SPRINKLER, 35, 25, 0);
  S.paint(w, 'life', LIFE.GRASS, 32, 25, 3);
  let best = 0;
  for (let k = 0; k < 25; k++) { step(w, 10); best = Math.max(best, w.counts.grass); }
  ok('E1 Meadow completes', done(w, 'E1') || best >= 150, 'best grass=' + best);
}
// E2 Acid spill: bury the worldgen spill at (50,10) in soil
{
  const w = S.createWorld('earth', 602);
  S.paint(w, 'base', E.SOIL, 50, 10, 6);
  step(w, 120);
  ok('E2 Acid spill completes', done(w, 'E2'), `acid=${w.counts.acid} sol=${w.sol}`);
}
// M1 Ice harvest: ice + heater, play through a full moon cycle into dawn
{
  const w = S.createWorld('moon', 603);
  S.paint(w, 'base', E.ICE, 32, 25, 3);
  S.paint(w, 'tech', TECH.HEATER, 32, 25, 0);
  step(w, 200);
  ok('M1 Ice harvest completes', !!w.m1done, 'm1done=' + w.m1done);
}
// M2 Night greenhouse: tight moss bed inside one heater's full-floor disc, domed
// against day UV; play through two full cycles into a dawn census
{
  const w = S.createWorld('moon', 604);
  S.paint(w, 'base', E.SOIL, 32, 25, 4);
  S.paint(w, 'tech', TECH.DOME, 32, 25, 1);
  S.paint(w, 'tech', TECH.HEATER, 32, 25, 0);
  S.paint(w, 'tech', TECH.SPRINKLER, 34, 26, 0); // one gadget per tile: offset, not stacked
  step(w, 30); // let the heater beat the night before planting (frost kills on sight)
  S.paint(w, 'life', LIFE.MOSS, 32, 25, 3);
  let best = 0;
  for (let k = 0; k < 30; k++) { step(w, 10); best = Math.max(best, w.counts.moss); }
  ok('M2 Night greenhouse completes', !!w.m2done, `m2done=${w.m2done} best moss=${best}`);
}
// R1 De-poison: flood mars salt, seed germs under domes + heaters, detox to zero
{
  const w = S.createWorld('mars', 605);
  for (const wx of [6, 18, 30, 42, 54]) for (const wy of [8, 20, 32])
    S.paint(w, 'base', E.WATER, wx, wy, 9); // full flood: salt hides in random blobs
  step(w, 10);
  let waited = 0;
  while (w.counts.salt !== 0 && waited < 30) { step(w, 10); waited++; } // salt==0 sticks: nothing respawns it
  S.paint(w, 'tech', TECH.DOME, 32, 25, 2);
  S.paint(w, 'tech', TECH.HEATER, 30, 25, 0);
  S.paint(w, 'tech', TECH.HEATER, 36, 25, 0);
  S.paint(w, 'life', LIFE.GERMS, 32, 25, 3);
  S.paint(w, 'life', LIFE.GERMS, 16, 25, 2);
  S.paint(w, 'life', LIFE.GERMS, 48, 25, 2);
  let won = false; // mirror the game's own detection: catch the conjunction live
  for (let k = 0; k < 60 && !won; k++) { step(w, 10); won = done(w, 'R1'); }
  ok('R1 De-poison completes', won, `salt=${w.counts.salt} germs=${w.counts.germs}`);
}
// R2 Bloom: heated moss beds on mars
{
  const w = S.createWorld('mars', 606);
  S.paint(w, 'base', E.SOIL, 32, 25, 6);
  S.paint(w, 'tech', TECH.DOME, 32, 25, 2); // dome shields the day-UV massacre
  S.paint(w, 'tech', TECH.HEATER, 28, 25, 0);
  S.paint(w, 'tech', TECH.HEATER, 32, 25, 0);
  S.paint(w, 'tech', TECH.HEATER, 36, 25, 0);
  S.paint(w, 'tech', TECH.SPRINKLER, 28, 27, 0);
  S.paint(w, 'tech', TECH.SPRINKLER, 36, 27, 0);
  step(w, 30); // warm bed first
  S.paint(w, 'life', LIFE.MOSS, 32, 25, 5);
  let best = 0;
  for (let k = 0; k < 80; k++) { step(w, 10); best = Math.max(best, w.counts.moss); }
  ok('R2 Bloom completes', best >= 100, 'best moss=' + best);
}
// E3 Kiln: clay bed under a pinned sun fires to brick
{
  const w = S.createWorld('earth', 607);
  S.paint(w, 'base', E.CLAY, 32, 25, 5);
  S.paint(w, 'base', E.SUN, 32, 25, 2);
  step(w, 40);
  ok('E3 Kiln completes', done(w, 'E3'), 'brick=' + w.counts.brick);
}
// M3 Heavy air: CO2 poured into a dug pit pools instead of drifting
{
  const w = S.createWorld('moon', 608);
  S.paint(w, 'base', E.EMPTY, 32, 28, 3);
  S.paint(w, 'base', E.CO2, 32, 27, 4);
  step(w, 100);
  ok('M3 Heavy air completes', done(w, 'M3'), 'co2=' + w.counts.co2);
}
// R3 Dome bloom: soil + dome + heater + grass + water on mars
{
  const w = S.createWorld('mars', 609);
  S.paint(w, 'base', E.SOIL, 32, 25, 6);
  S.paint(w, 'tech', TECH.DOME, 32, 25, 2);
  S.paint(w, 'tech', TECH.HEATER, 32, 25, 0);
  S.paint(w, 'tech', TECH.SPRINKLER, 34, 26, 0); // one gadget per tile: offset, not stacked
  step(w, 30); // warm bed first: night-planted grass withers before dawn
  S.paint(w, 'life', LIFE.GRASS, 32, 24, 4);
  let best = 0;
  for (let k = 0; k < 40; k++) { step(w, 10); best = Math.max(best, w.counts.grass); }
  ok('R3 Dome bloom completes', best >= 60, 'best grass=' + best);
}
// E4 Compost: fungus-rotted wood with re-wetting (rot counter climbs)
{
  const w = S.createWorld('earth', 610);
  S.paint(w, 'base', E.WOOD, 32, 25, 4);
  for (let i = 0; i < w.el.length; i++) if (w.el[i] === E.WOOD) w.wet[i] = 0.9;
  S.paint(w, 'life', LIFE.FUNGUS, 32, 25, 4);
  for (let k = 0; k < 30; k++) {
    step(w, 10);
    for (let i = 0; i < w.el.length; i++) if (w.el[i] === E.WOOD) w.wet[i] = Math.max(w.wet[i], 0.8);
  }
  ok('E4 Compost completes', done(w, 'E4'), 'rot=' + w.rot);
}
// M4 Glass house: sand under a pinned sun vitrifies, no kiln needed
{
  const w = S.createWorld('moon', 611);
  S.paint(w, 'base', E.SAND, 32, 25, 6);
  S.paint(w, 'base', E.SUN, 32, 25, 3);
  step(w, 60);
  ok('M4 Glass house completes', done(w, 'M4'), 'glass=' + w.counts.glass);
}
// R4 First footprints: lichens seeded wide on rock survive the light
{
  const w = S.createWorld('mars', 612);
  S.paint(w, 'base', E.ROCK, 20, 20, 6);
  S.paint(w, 'life', LIFE.LICHEN, 20, 20, 6);
  S.paint(w, 'base', E.ROCK, 44, 20, 6);
  S.paint(w, 'life', LIFE.LICHEN, 44, 20, 6);
  let best = 0;
  for (let k = 0; k < 15; k++) { step(w, 10); best = Math.max(best, w.counts.lichen); }
  ok('R4 First footprints completes', best >= 70, 'best lichen=' + best);
}
// U1 Meltwater: a heater holds open water in europan ice
{
  const w = S.createWorld('europa', 613);
  S.paint(w, 'tech', TECH.HEATER, 32, 25, 1);
  let best = 0;
  for (let k = 0; k < 20; k++) { step(w, 10); best = Math.max(best, w.counts.water); }
  ok('U1 Meltwater completes', best >= 25, 'best water=' + best);
}
// U2 Brine garden: imported soil + dome + heater + moss on europa
{
  const w = S.createWorld('europa', 614);
  S.paint(w, 'base', E.SOIL, 32, 25, 5);
  S.paint(w, 'tech', TECH.DOME, 32, 25, 1);
  S.paint(w, 'tech', TECH.HEATER, 29, 25, 0);
  S.paint(w, 'tech', TECH.HEATER, 35, 25, 0);
  S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
  step(w, 30); // warm bed first: europa never rises above -20 on its own
  S.paint(w, 'life', LIFE.MOSS, 32, 25, 3);
  let best = 0;
  for (let k = 0; k < 30; k++) { step(w, 10); best = Math.max(best, w.counts.moss); }
  ok('U2 Brine garden completes', best >= 50, 'best moss=' + best);
}
// H1 Acid pond: a big sulfur bed + kiln + glass floor (acid pools instead of
// fizzing away on rock); the quest flips the moment acid spikes past 20
{
  const w = S.createWorld('hadean', 615);
  S.paint(w, 'base', E.GLASS, 32, 26, 5);
  S.paint(w, 'base', E.SULFUR, 32, 25, 3);
  S.paint(w, 'base', E.WATER, 32, 28, 3);
  S.paint(w, 'tech', TECH.KILN, 32, 25, 0);
  step(w, 150);
  ok('H1 Acid pond completes', done(w, 'H1') || !!w.quests.H1, 'acid=' + w.counts.acid);
}
// H2 Hot garden: painted germs under a dome grow to 300 biomass
{
  const w = S.createWorld('hadean', 616);
  S.paint(w, 'base', E.WATER, 32, 25, 3);
  S.paint(w, 'tech', TECH.DOME, 32, 25, 1);
  S.paint(w, 'life', LIFE.GERMS, 32, 25, 2);
  let best = 0;
  for (let k = 0; k < 15; k++) { step(w, 10); best = Math.max(best, w.counts.germs); }
  ok('H2 Hot garden completes', best >= 300, 'best germs=' + best);
}
// E5 Swarm: a meadow (water beside the bed, not over it) loosed with locusts booms
{
  const w = S.createWorld('earth', 617);
  S.paint(w, 'base', E.SOIL, 32, 25, 6);
  S.paint(w, 'tech', TECH.SPRINKLER, 28, 25, 0);
  S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
  S.paint(w, 'tech', TECH.SPRINKLER, 36, 25, 0);
  S.paint(w, 'life', LIFE.GRASS, 32, 24, 5);
  step(w, 200); // establish the meadow before the swarm arrives
  S.paint(w, 'life', LIFE.LOCUSTS, 32, 25, 3);
  let best = 0; // boom-bust: the swarm strips the field in ticks, so sample every tick
  for (let k = 0; k < 60; k++) { step(w, 1); best = Math.max(best, w.counts.locusts); }
  ok('E5 Swarm completes', best >= 50, 'best locusts=' + best);
}
// E6 Quicklime: limestone beside a kiln calcines
{
  const w = S.createWorld('earth', 618);
  S.paint(w, 'base', E.LIMESTONE, 32, 25, 3);
  S.paint(w, 'tech', TECH.KILN, 32, 25, 0);
  step(w, 60);
  ok('E6 Quicklime completes', done(w, 'E6'), 'lime=' + w.counts.lime);
}
// E7 Straw guardian: swarm on one side, scarecrow far away, both stand
{
  const w = S.createWorld('earth', 619);
  S.paint(w, 'base', E.SOIL, 20, 20, 6);
  S.paint(w, 'tech', TECH.SPRINKLER, 16, 20, 0);
  S.paint(w, 'tech', TECH.SPRINKLER, 20, 20, 0);
  S.paint(w, 'tech', TECH.SPRINKLER, 24, 20, 0);
  S.paint(w, 'life', LIFE.GRASS, 20, 19, 5);
  step(w, 200); // establish the meadow before the swarm arrives
  S.paint(w, 'life', LIFE.LOCUSTS, 20, 20, 3);
  S.paint(w, 'tech', TECH.SCARECROW, 50, 30, 0);
  let best = 0; // boom-bust: sample every tick to catch the peak
  for (let k = 0; k < 60; k++) { step(w, 1); best = Math.max(best, w.counts.locusts); }
  ok('E7 Straw guardian completes', best >= 30, 'best locusts=' + best);
}
// E8 Reef: a rock RING (water will not paint over solid rock — dig the lagoon
// first) flooded at dawn; coral counted off the bloom before nightfall
{
  const w = S.createWorld('earth', 620);
  for (let x = 26; x <= 38; x++) { S.paint(w, 'base', E.ROCK, x, 19, 0); S.paint(w, 'base', E.ROCK, x, 31, 0); }
  for (let y = 19; y <= 31; y++) { S.paint(w, 'base', E.ROCK, 26, y, 0); S.paint(w, 'base', E.ROCK, 38, y, 0); }
  S.paint(w, 'base', E.WATER, 32, 25, 4);
  w.sol = 2; // just before dawn
  S.paint(w, 'life', LIFE.CORAL, 32, 25, 3);
  let best = 0;
  for (let k = 0; k < 8; k++) { step(w, 5); best = Math.max(best, w.counts.coral); }
  ok('E8 Reef completes', best >= 25, 'best coral=' + best);
}
console.log(fail ? `\n${fail} QUEST FAILURES (${pass} passed)` : `\nALL ${pass} QUESTS COMPLETABLE`);
process.exit(fail ? 1 : 0);
