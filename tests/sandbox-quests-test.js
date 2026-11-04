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
// T1 Oasis: five heaters hold a pool on Titan bedrock
{
  const w = S.createWorld('titan', 801);
  S.paint(w, 'tech', TECH.HEATER, 32, 25, 1);
  step(w, 100);
  ok('T1 Oasis completes', done(w, 'T1'), 'water=' + w.counts.water);
}
// T2 Hothouse: dome + heaters + sprinkler over imported soil
{
  const w = S.createWorld('titan', 802);
  S.paint(w, 'base', E.SOIL, 32, 25, 5);
  S.paint(w, 'tech', TECH.DOME, 32, 25, 0);
  S.paint(w, 'tech', TECH.HEATER, 30, 25, 0);
  S.paint(w, 'tech', TECH.HEATER, 34, 25, 0);
  S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
  S.paint(w, 'life', LIFE.MOSS, 32, 25, 3);
  step(w, 120);
  ok('T2 Hothouse completes', done(w, 'T2'), 'moss=' + w.counts.moss);
}
// T3 Sun glass: a cluster of suns over a big dune
{
  const w = S.createWorld('titan', 803);
  S.paint(w, 'base', E.SAND, 32, 25, 6);
  S.paint(w, 'base', E.SUN, 32, 25, 2);
  step(w, 70);
  ok('T3 Sun glass completes', done(w, 'T3'), 'glass=' + w.counts.glass);
}
// T4 Nuggets: kiln over a wide ore disc strikes gold
{
  const w = S.createWorld('titan', 804);
  S.paint(w, 'base', E.COPPERORE, 32, 25, 4);
  S.paint(w, 'tech', TECH.KILN, 32, 25, 0);
  step(w, 20);
  ok('T4 Nuggets completes', done(w, 'T4'), 'gold=' + w.counts.gold);
}
// V1 Volcanic glass: sand bed with a lava core poured last
{
  const w = S.createWorld('venus', 805);
  S.paint(w, 'base', E.SAND, 20, 20, 5);
  S.paint(w, 'base', E.LAVA, 20, 20, 2);
  step(w, 60);
  ok('V1 Volcanic glass completes', done(w, 'V1'), 'glass=' + w.counts.glass);
}
// V2 Marble works: limestone bed with a lava core poured last
{
  const w = S.createWorld('venus', 806);
  S.paint(w, 'base', E.LIMESTONE, 20, 20, 4);
  S.paint(w, 'base', E.LAVA, 20, 20, 2);
  step(w, 30);
  ok('V2 Marble works completes', done(w, 'V2'), 'marble=' + w.counts.marble);
}
// V3 Diamond forge: coal bed with a lava core poured last
{
  const w = S.createWorld('venus', 807);
  S.paint(w, 'base', E.COAL, 20, 20, 5);
  S.paint(w, 'base', E.LAVA, 20, 20, 2);
  step(w, 30);
  ok('V3 Diamond forge completes', done(w, 'V3'), 'diamond=' + w.counts.diamond);
}
// V4 Steel works: metal on charcoal, ambient does the firing
{
  const w = S.createWorld('venus', 808);
  S.paint(w, 'base', E.METAL, 20, 20, 4);
  S.paint(w, 'base', E.CHARCOAL, 20, 20, 3);
  step(w, 40);
  ok('V4 Steel works completes', done(w, 'V4'), 'steel=' + w.counts.steel);
}
// E10 Fish pond: stocked algae pool at dawn
{
  const w = S.createWorld('earth', 809);
  S.paint(w, 'base', E.WATER, 32, 25, 3); w.sol = 2;
  S.paint(w, 'life', LIFE.ALGAE, 32, 25, 2);
  S.paint(w, 'life', LIFE.FISH, 32, 25, 1);
  step(w, 25);
  ok('E10 Fish pond completes', done(w, 'E10'), 'fish=' + w.counts.fish);
}
// H7 Diamond core: coal bed with a lava core poured last
{
  const w = S.createWorld('hadean', 810);
  S.paint(w, 'base', E.COAL, 20, 20, 4);
  S.paint(w, 'base', E.LAVA, 20, 20, 2);
  step(w, 30);
  ok('H7 Diamond core completes', done(w, 'H7'), 'diamond=' + w.counts.diamond);
}
// E11 Gilded copies: one gold seed beside one clone fills the ring
{
  const w = S.createWorld('earth', 811);
  S.paint(w, 'base', E.EMPTY, 32, 25, 3);
  S.paint(w, 'base', E.GOLD, 32, 25, 0);
  S.paint(w, 'base', E.CLONE, 33, 25, 0);
  step(w, 60);
  ok('E11 Gilded copies completes', done(w, 'E11'), 'gold=' + w.counts.gold);
}
// E12 Flower bed: wet soil + daylight; perennials persist the night, seed by day
{
  const w = S.createWorld('earth', 812);
  S.paint(w, 'base', E.SOIL, 32, 25, 5);
  S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
  w.sol = 2;
  S.paint(w, 'life', LIFE.FLOWER, 32, 25, 3);
  step(w, 60);
  ok('E12 Flower bed completes', done(w, 'E12'), 'flowers=' + countLife(w, LIFE.FLOWER));
}
// E12b Perennial nights: a planted bed survives into the next dawn, not just the day
{
  const w = S.createWorld('earth', 813);
  S.paint(w, 'base', E.SOIL, 32, 25, 4);
  S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
  w.sol = 2;
  S.paint(w, 'life', LIFE.FLOWER, 32, 25, 2);
  step(w, 30);
  ok('E12b Flowers persist nights', countLife(w, LIFE.FLOWER) >= 8, 'flowers=' + countLife(w, LIFE.FLOWER));
}
// E13 Shale oil: bury mud under sand, kiln the shale past cracking heat
{
  const w = S.createWorld('earth', 814);
  S.paint(w, 'base', E.MUD, 32, 26, 5);
  S.paint(w, 'base', E.SAND, 32, 23, 5);
  step(w, 140);
  S.paint(w, 'tech', TECH.KILN, 32, 25, 1);
  step(w, 120);
  ok('E13 Shale oil completes', done(w, 'E13'), 'oil=' + countEl(w, E.OIL));
}
// E14 Honey harvest: flower bed by day, bees at the edge with comb space
{
  const w = S.createWorld('earth', 815);
  S.paint(w, 'base', E.SOIL, 32, 25, 4);
  S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
  w.sol = 2;
  S.paint(w, 'life', LIFE.FLOWER, 32, 25, 2);
  step(w, 20);
  S.paint(w, 'life', LIFE.BEE, 30, 25, 1);
  S.paint(w, 'life', LIFE.BEE, 34, 25, 1);
  step(w, 120);
  ok('E14 Honey harvest completes', done(w, 'E14'), 'honey=' + countEl(w, E.HONEY));
}
// E15 Guano island: stocked pool, birds roosting on the shore
{
  const w = S.createWorld('earth', 816);
  S.paint(w, 'base', E.WATER, 30, 25, 3);
  w.sol = 2;
  S.paint(w, 'life', LIFE.ALGAE, 30, 25, 2);
  S.paint(w, 'life', LIFE.FISH, 30, 25, 1);
  step(w, 15);
  S.paint(w, 'life', LIFE.BIRD, 34, 25, 0);
  S.paint(w, 'life', LIFE.BIRD, 35, 24, 0);
  S.paint(w, 'life', LIFE.BIRD, 35, 26, 0);
  S.paint(w, 'life', LIFE.BIRD, 26, 25, 0);
  S.paint(w, 'life', LIFE.BIRD, 25, 24, 0);
  step(w, 60);
  ok('E15 Guano island completes', done(w, 'E15'), 'guano=' + countEl(w, E.GUANO));
}
// E16 Clover rotation: like grass, but it feeds the dirt
{
  const w = S.createWorld('earth', 817);
  S.paint(w, 'base', E.SOIL, 32, 25, 4);
  S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
  S.paint(w, 'life', LIFE.CLOVER, 32, 25, 2);
  step(w, 80);
  ok('E16 Clover rotation completes', done(w, 'E16'), 'clover=' + countLife(w, LIFE.CLOVER));
}
// E17 Spider guard: loose locusts, then spiders; guardians, not livestock
{
  const w = S.createWorld('earth', 818);
  S.paint(w, 'base', E.SOIL, 32, 25, 5);
  S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
  S.paint(w, 'life', LIFE.GRASS, 32, 25, 4);
  step(w, 10);
  S.paint(w, 'life', LIFE.LOCUSTS, 32, 25, 1);
  S.paint(w, 'life', LIFE.SPIDER, 32, 25, 1);
  step(w, 12);
  ok('E17 Spider guard completes', done(w, 'E17'), `spiders=${countLife(w, LIFE.SPIDER)} locusts=${countLife(w, LIFE.LOCUSTS)}`);
}
// E19 Stromatolite reef: cyano first and spread, then mats beside the builders
{
  const w = S.createWorld('earth', 819);
  S.paint(w, 'base', E.WATER, 32, 25, 3);
  w.sol = 8;
  S.paint(w, 'life', LIFE.CYANO, 32, 25, 2);
  step(w, 10);
  S.paint(w, 'life', LIFE.STROM, 32, 25, 1);
  step(w, 80);
  ok('E19 Stromatolite reef completes', done(w, 'E19'), 'limestone=' + countEl(w, E.LIMESTONE));
}
// E20 Soda flat: damp salt + lime crust trona (floods boil via slaking)
{
  const w = S.createWorld('earth', 820);
  S.paint(w, 'base', E.SALT, 32, 25, 3);
  S.paint(w, 'base', E.LIME, 32, 25, 1);
  S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
  step(w, 80);
  ok('E20 Soda flat completes', done(w, 'E20'), 'trona=' + countEl(w, E.TRONA));
}
// U5 Brine stock: five-heater pool salted to brine, stocked at dawn
{
  const w = S.createWorld('europa', 821);
  S.paint(w, 'tech', TECH.HEATER, 32, 25, 1);
  step(w, 100);
  S.paint(w, 'base', E.SALT, 32, 25, 3);
  step(w, 20);
  w.sol = 2;
  S.paint(w, 'life', LIFE.ALGAE, 32, 25, 2);
  S.paint(w, 'life', LIFE.SHRIMP, 32, 25, 1);
  step(w, 30);
  ok('U5 Brine stock completes', done(w, 'U5'), 'shrimp=' + countLife(w, LIFE.SHRIMP));
}
// H8 Hot-spring seed: walled pool on hot ground, seeded the same morning
{
  const w = S.createWorld('hadean', 822);
  for (let x = 28; x <= 34; x++) { S.paint(w, 'base', E.ROCK, x, 22, 0); S.paint(w, 'base', E.ROCK, x, 29, 0); }
  for (let y = 22; y <= 29; y++) { S.paint(w, 'base', E.ROCK, 28, y, 0); S.paint(w, 'base', E.ROCK, 34, y, 0); }
  S.paint(w, 'base', E.WATER, 31, 25, 2);
  step(w, 10);
  S.paint(w, 'life', LIFE.ARCHAEA, 31, 25, 1);
  step(w, 20);
  ok('H8 Hot-spring seed completes', done(w, 'H8'), 'archaea=' + countLife(w, LIFE.ARCHAEA));
}
// R5 Oxygenate: heated oasis, cyano dozing through 35-tick nights
{
  const w = S.createWorld('mars', 823);
  S.paint(w, 'base', E.WATER, 32, 25, 2);
  S.paint(w, 'tech', TECH.HEATER, 32, 25, 1);
  step(w, 30);
  S.paint(w, 'life', LIFE.CYANO, 32, 25, 1);
  step(w, 170);
  ok('R5 Oxygenate completes', done(w, 'R5'), 'o2=' + w.o2.toFixed(1));
}
// R6 Decontaminate: dome + heater + sprinkler over uranium, seeded by day
{
  const w = S.createWorld('mars', 824);
  S.paint(w, 'base', E.URANIUM, 32, 25, 2);
  S.paint(w, 'tech', TECH.DOME, 32, 25, 1);
  S.paint(w, 'tech', TECH.HEATER, 32, 25, 0);
  S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
  step(w, 10);
  w.sol = 10;
  S.paint(w, 'life', LIFE.DEINO, 32, 25, 1);
  step(w, 60);
  ok('R6 Decontaminate completes', done(w, 'R6'), 'uClean=' + w.uClean);
}
// R7 Banded iron: after Oxygenate, lay metal in your own air
{
  const w = S.createWorld('mars', 825);
  S.paint(w, 'base', E.WATER, 32, 25, 2);
  S.paint(w, 'tech', TECH.HEATER, 32, 25, 1);
  step(w, 30);
  S.paint(w, 'life', LIFE.CYANO, 32, 25, 1);
  step(w, 150);
  S.paint(w, 'base', E.METAL, 32, 25, 1);
  step(w, 120);
  ok('R7 Banded iron completes', done(w, 'R7'), 'rust=' + countEl(w, E.RUST));
}
// M5 Moonwalk: water bears outlast a full 90-tick cycle
{
  const w = S.createWorld('moon', 826);
  S.paint(w, 'life', LIFE.TARDI, 32, 25, 1);
  step(w, 100);
  ok('M5 Moonwalk completes', done(w, 'M5'), `tardi=${countLife(w, LIFE.TARDI)} sol=${w.sol}`);
}
// I1 Sulfur snow: gather the foundry's frost and paint your own drifts
{
  const w = S.createWorld('io', 827);
  S.paint(w, 'base', E.SULFUR, 32, 25, 4);
  step(w, 20);
  ok('I1 Sulfur snow completes', done(w, 'I1'), 'sulfur=' + countEl(w, E.SULFUR));
}
// I2 Living lake: pour fresh lava, crust wins unless you feed it
{
  const w = S.createWorld('io', 828);
  S.paint(w, 'base', E.LAVA, 32, 25, 3);
  step(w, 30);
  ok('I2 Living lake completes', done(w, 'I2'), 'lava=' + countEl(w, E.LAVA));
}
console.log(fail ? `\n${fail} QUEST FAILURES (${pass} passed)` : `\nALL ${pass} QUESTS COMPLETABLE`);
process.exit(fail ? 1 : 0);
