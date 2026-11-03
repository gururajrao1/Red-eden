/* Focused sim harness for the sandbox material expansion (lives with the project).
   Run: node tests/sandbox-sim-test.js   (from the evolution/ root) */
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
function stepEv(w, n) { // step, collecting every event kind seen
  const seen = new Set();
  for (let k = 0; k < n; k++) { S.stepWorld(w); for (const [kind] of w.ev) seen.add(kind); }
  return seen;
}

// 1. glass kiln regression: sand touching lava vitrifies (contact melting)
{
  const w = S.createWorld('earth', 40);
  S.paint(w, 'base', E.SAND, 20, 20, 4);
  S.paint(w, 'base', E.LAVA, 20, 17, 2);
  for (let k = 0; k < 4; k++) S.paint(w, 'temp', 1, 20, 19, 2);
  step(w, 60);
  ok('sand+lava->glass', countEl(w, E.GLASS) > 0, 'glass=' + countEl(w, E.GLASS));
}
// 2. quench rate decides the rock: ice -> obsidian, water -> basalt
{
  const w = S.createWorld('earth', 41);
  S.paint(w, 'base', E.LAVA, 20, 20, 2);
  S.paint(w, 'base', E.ICE, 17, 20, 2); // touching the lava face
  S.paint(w, 'base', E.WATER, 28, 20, 3);
  step(w, 60);
  ok('lava+ice->obsidian', countEl(w, E.OBSIDIAN) > 0, 'obsidian=' + countEl(w, E.OBSIDIAN));
  ok('lava+water->rock', countEl(w, E.ROCK) > 10, 'rock=' + countEl(w, E.ROCK));
}
// 3. clay kiln + acid-proof brick vs acid-eaten concrete
{
  const w = S.createWorld('earth', 42);
  S.paint(w, 'base', E.CLAY, 15, 20, 3);
  S.paint(w, 'base', E.FIRE, 15, 16, 1);
  step(w, 40);
  ok('clay+fire->brick', countEl(w, E.BRICK) > 0, 'brick=' + countEl(w, E.BRICK));
  const b = S.createWorld('earth', 43);
  const b0 = countEl(b, E.ROCK);
  S.paint(b, 'base', E.BRICK, 15, 24, 5); // wide slabs; acid pools on top
  S.paint(b, 'base', E.CONCRETE, 45, 24, 5);
  S.paint(b, 'base', E.ACID, 15, 20, 2);
  S.paint(b, 'base', E.ACID, 45, 20, 2);
  const brick0 = countEl(b, E.BRICK), conc0 = countEl(b, E.CONCRETE); // baselined after contact
  step(b, 200);
  ok('brick resists acid', countEl(b, E.BRICK) === brick0, `brick ${brick0}->${countEl(b, E.BRICK)}`);
  ok('concrete yields to acid', countEl(b, E.CONCRETE) < conc0, `concrete ${conc0}->${countEl(b, E.CONCRETE)}`);
  ok('rock control eaten', countEl(b, E.ROCK) <= b0, 'sanity');
}
// 4. concrete wall survives a TNT blast next door
{
  const w = S.createWorld('earth', 44);
  for (let y = 10; y <= 30; y++) S.paint(w, 'base', E.CONCRETE, 30, y, 1);
  const c0 = countEl(w, E.CONCRETE);
  S.paint(w, 'base', E.TNT, 25, 20, 1);
  S.paint(w, 'base', E.FIRE, 25, 20, 0);
  const ev = stepEv(w, 30);
  ok('TNT still detonates', ev.has('boom'), 'no boom seen');
  ok('concrete survives blast', countEl(w, E.CONCRETE) === c0, `concrete ${c0}->${countEl(w, E.CONCRETE)}`);
}
// 5. gunpowder train catches and chains
{
  const w = S.createWorld('earth', 45);
  S.paint(w, 'base', E.GUNPOWDER, 15, 30, 4);
  const g0 = countEl(w, E.GUNPOWDER);
  S.paint(w, 'base', E.FIRE, 10, 30, 0);
  const ev = stepEv(w, 25);
  ok('gunpowder booms', ev.has('boom'), 'no boom seen');
  ok('gunpowder consumed', countEl(w, E.GUNPOWDER) < g0 * 0.5, `left ${countEl(w, E.GUNPOWDER)}/${g0}`);
}
// 6. helium out-rises steam: dug shafts, 10 ticks, exact positions (no RNG on a clear path)
{
  const w = S.createWorld('earth', 46);
  for (let y = 2; y <= 34; y++) {
    S.paint(w, 'base', E.EMPTY, 38, y, 0);
    S.paint(w, 'base', E.EMPTY, 42, y, 0);
  }
  S.paint(w, 'base', E.HELIUM, 38, 30, 0);
  S.paint(w, 'base', E.STEAM, 42, 30, 0);
  step(w, 10);
  let heY = 99, stY = 99;
  for (let y = 0; y < 40; y++) for (let x = 0; x < 64; x++) {
    const e = w.el[y * 64 + x];
    if (e === E.HELIUM) heY = Math.min(heY, y);
    if (e === E.STEAM) stY = Math.min(stY, y);
  }
  ok('helium rises two cells a tick', heY === 10, `helium y=${heY}`);
  ok('helium beats steam up', heY < stY - 5, `helium y=${heY} steam y=${stY}`);
}
// 7. cryo flash-freezes water, then boils away
{
  const w = S.createWorld('earth', 47);
  S.paint(w, 'base', E.WATER, 20, 20, 3);
  S.paint(w, 'base', E.CRYO, 26, 20, 2);
  const ev = stepEv(w, 30);
  ok('cryo frosts water', ev.has('frost'), 'no frost seen');
  step(w, 60);
  ok('cryo boils off', countEl(w, E.CRYO) === 0, 'cryo left=' + countEl(w, E.CRYO));
}
// 8. fungus: spreads on damp dead wood, dies without a host
{
  const w = S.createWorld('earth', 48);
  S.paint(w, 'base', E.WOOD, 20, 20, 4);
  for (let i = 0; i < w.el.length; i++) if (w.el[i] === E.WOOD) w.wet[i] = 1;
  S.paint(w, 'life', LIFE.FUNGUS, 20, 20, 1);
  step(w, 60);
  ok('fungus spreads on wet wood', w.counts.fungus >= 5, 'fungus=' + w.counts.fungus);
  const d = S.createWorld('earth', 49);
  S.paint(d, 'life', LIFE.FUNGUS, 20, 20, 1); // dry soil, no wood
  step(d, 20);
  ok('fungus dies hostless', (d.counts.fungus || 0) === 0, 'fungus=' + d.counts.fungus);
}
// 9. dawn quests still fire after the physics pass
{
  const m0 = S.createWorld('moon', 80);
  S.paint(m0, 'base', E.ICE, 30, 20, 7);
  S.paint(m0, 'tech', TECH.DOME, 30, 20, 1);
  for (let k = 0; k < 4; k++) S.paint(m0, 'tech', TECH.HEATER, 28 + k, 20, 0);
  step(m0, 200);
  ok('M1 ice harvest fires', !!m0.quests.M1, 'bank ice, melt at dawn');
}
{
  const m = S.createWorld('moon', 8);
  step(m, 78);
  S.paint(m, 'tech', TECH.DOME, 32, 20, 1);
  for (let k = 0; k < 4; k++) S.paint(m, 'tech', TECH.HEATER, 30 + k, 20, 0);
  S.paint(m, 'base', E.WATER, 32, 20, 4);
  S.paint(m, 'life', LIFE.MOSS, 32, 20, 4);
  step(m, 25);
  ok('M2 greenhouse fires', !!m.quests.M2, 'moss@dawn=' + m.counts.moss);
}
{
  const w = S.createWorld('earth', 8);
  S.paint(w, 'base', E.SOIL, 20, 20, 8);
  for (let i = 0; i < S.GW * S.GH; i++) if (w.el[i] === E.SOIL) w.wet[i] = 0.9;
  S.paint(w, 'life', LIFE.GRASS, 20, 20, 8);
  S.stepWorld(w);
  ok('E1 fires', !!w.quests.E1, 'grass=' + w.counts.grass);
}
// 11. heavy air, hot sulfur, dinner, floating rock
{
  // hot wet sulfur breathes SO2: neighbouring water turns to acid (sour)
  const w = S.createWorld('earth', 60);
  S.paint(w, 'base', E.SULFUR, 20, 20, 3);
  S.paint(w, 'base', E.WATER, 26, 20, 2);
  for (let k = 0; k < 6; k++) S.paint(w, 'temp', 1, 20, 20, 2);
  let sour = false;
  for (let k = 0; k < 40; k++) { S.stepWorld(w); for (const [kind] of w.ev) if (kind === 'sour') sour = true; }
  ok('hot wet sulfur sours water', sour, 'no sour seen');
}
{
  // fertilizer: fed moss out-spreads its unfed twin (same seed)
  const a = S.createWorld('earth', 61), b = S.createWorld('earth', 61);
  for (const w of [a, b]) {
    S.paint(w, 'base', E.SOIL, 20, 20, 5);
    for (let i = 0; i < w.el.length; i++) if (w.el[i] === E.SOIL) w.wet[i] = 0.9;
    S.paint(w, 'life', LIFE.MOSS, 20, 20, 1);
  }
  // sprinkled over the bed: plants root in the grains and eat (hosts + boost).
  // beds re-wet every tick so the spread gate — not drying — is what differs.
  S.paint(a, 'base', E.FERTILIZER, 20, 20, 2);
  const wetBed = w => { for (let y = 14; y <= 26; y++) for (let x = 14; x <= 26; x++) w.wet[y * 64 + x] = 1; };
  for (let k = 0; k < 100; k++) { wetBed(a); wetBed(b); S.stepWorld(a); S.stepWorld(b); }
  ok('fertilizer boosts moss', a.counts.moss > b.counts.moss, `fed ${a.counts.moss} vs ${b.counts.moss}`);
  let feed = false;
  const f = S.createWorld('earth', 64);
  S.paint(f, 'base', E.WATER, 20, 20, 3);
  S.paint(f, 'base', E.FERTILIZER, 20, 20, 1);
  for (let k = 0; k < 60; k++) { S.stepWorld(f); for (const [kind] of f.ev) if (kind === 'feed') feed = true; }
  ok('fertilizer dissolves in water', feed, 'no feed seen');
}
{
  // CO2 sinks, pools, and a blanket smothers fire
  const w = S.createWorld('earth', 62);
  S.paint(w, 'base', E.EMPTY, 20, 12, 7); // clear a shaft: seed 62 parks a rock at (20,6)
  S.paint(w, 'base', E.CO2, 20, 5, 4);
  step(w, 20);
  let top = 99, n = 0;
  for (let y = 0; y < 40; y++) for (let x = 0; x < 64; x++)
    if (w.el[y * 64 + x] === E.CO2) { top = Math.min(top, y); n++; }
  ok('CO2 sinks', n > 0 && top > 5, `top=${top} n=${n}`);
  const f = S.createWorld('earth', 63);
  S.paint(f, 'base', E.WOOD, 32, 24, 4);
  S.paint(f, 'base', E.FIRE, 32, 24, 0);
  S.paint(f, 'base', E.CO2, 32, 18, 4);
  let snuff = false;
  for (let k = 0; k < 30; k++) { S.stepWorld(f); for (const [kind] of f.ev) if (kind === 'snuff') snuff = true; }
  ok('CO2 blanket smothers', snuff && countEl(f, E.FIRE) === 0, `fire left=${countEl(f, E.FIRE)}`);
}
{
  // pumice rises through water and rests on the surface
  const w = S.createWorld('earth', 65);
  S.paint(w, 'base', E.WATER, 20, 20, 5);
  S.paint(w, 'base', E.PUMICE, 20, 23, 1);
  step(w, 30);
  let top = 99, n = 0;
  for (let y = 0; y < 40; y++) for (let x = 0; x < 64; x++)
    if (w.el[y * 64 + x] === E.PUMICE) { top = Math.min(top, y); n++; }
  ok('pumice floats', n > 0 && top < 23, `top=${top} n=${n}`);
}
// 12. new quests fire on constructed states
{
  const w = S.createWorld('earth', 66);
  S.paint(w, 'base', E.CLAY, 32, 26, 8); // the clay field
  S.paint(w, 'base', E.LAVA, 28, 20, 4); // two pours, like a real kiln run
  step(w, 45);
  S.paint(w, 'base', E.LAVA, 37, 20, 4);
  step(w, 45);
  ok('E3 kiln fires', !!w.quests.E3, 'brick=' + w.counts.brick);
}
{
  const m = S.createWorld('moon', 67);
  S.paint(m, 'base', E.CO2, 20, 30, 6);
  step(m, 30);
  ok('M3 heavy air fires', !!m.quests.M3, 'co2=' + m.counts.co2);
}
{
  const r = S.createWorld('mars', 68);
  S.paint(r, 'tech', TECH.DOME, 32, 20, 1);
  for (let k = 0; k < 4; k++) S.paint(r, 'tech', TECH.HEATER, 30 + k, 20, 0);
  S.paint(r, 'base', E.SOIL, 32, 20, 5);
  for (let i = 0; i < r.el.length; i++) if (r.el[i] === E.SOIL) r.wet[i] = 0.9;
  S.paint(r, 'life', LIFE.GRASS, 32, 20, 4);
  step(r, 60);
  ok('R3 dome bloom fires', !!r.quests.R3, 'grass=' + r.counts.grass);
}
// 13b. the dying speak: unprotected moss on a Mars night emits perish
{
  const w = S.createWorld('mars', 70);
  S.paint(w, 'base', E.SOIL, 20, 20, 4);
  for (let i = 0; i < w.el.length; i++) if (w.el[i] === E.SOIL) w.wet[i] = 1;
  S.paint(w, 'life', LIFE.MOSS, 20, 20, 3);
  let perish = false;
  for (let k = 0; k < 30; k++) { S.stepWorld(w); for (const [kind] of w.ev) if (kind === 'perish') perish = true; }
  ok('dying colonies speak', perish, 'no perish seen');
}
// 13. population history grows and caps
{
  const w = S.createWorld('mars', 69);
  step(w, 310);
  ok('history caps at 300', w.hist.length === 300, 'len=' + w.hist.length);
}
// 14. rot economy, pioneers, lead, glass house
{
  // fungus rots damp wood into soil; the counter feeds E4
  const w = S.createWorld('earth', 71);
  S.paint(w, 'base', E.WOOD, 20, 20, 4);
  S.paint(w, 'life', LIFE.FUNGUS, 20, 20, 3);
  let rot = false;
  for (let k = 0; k < 150; k++) {
    for (let i = 0; i < w.el.length; i++) if (w.el[i] === E.WOOD) w.wet[i] = 1;
    S.stepWorld(w);
    for (const [kind] of w.ev) if (kind === 'rot') rot = true;
  }
  ok('fungus rots wood to soil', rot && w.rot >= 25, `rot=${w.rot}`);
  ok('E4 compost fires', !!w.quests.E4, '');
}
{
  // lichen pioneers bare regolith in daylight (mars base is regolith)
  const w = S.createWorld('mars', 72);
  S.paint(w, 'life', LIFE.LICHEN, 32, 20, 4);
  step(w, 120);
  ok('lichen spreads on rock', w.counts.lichen >= 70, `lichen=${w.counts.lichen}`);
  ok('R4 footprints fires', !!w.quests.R4, '');
}
{
  // lead channels acid: immune slab beside an eaten concrete control
  const w = S.createWorld('earth', 73);
  S.paint(w, 'base', E.LEAD, 15, 24, 5);
  S.paint(w, 'base', E.CONCRETE, 45, 24, 5);
  S.paint(w, 'base', E.ACID, 15, 20, 2);
  S.paint(w, 'base', E.ACID, 45, 20, 2);
  const l0 = countEl(w, E.LEAD), c0 = countEl(w, E.CONCRETE);
  step(w, 200);
  ok('lead resists acid', countEl(w, E.LEAD) === l0, `${l0}->${countEl(w, E.LEAD)}`);
  ok('acid was active', countEl(w, E.CONCRETE) < c0, 'control untouched?');
}
{
  // pioneers seed bare rock (the paint guard used to refuse their own host)
  const p = S.createWorld('earth', 75);
  S.paint(p, 'base', E.ROCK, 20, 20, 1);
  S.paint(p, 'life', LIFE.LICHEN, 20, 20, 1);
  let seeded = 0;
  for (let i = 0; i < p.life.length; i++) if (p.life[i] === LIFE.LICHEN) seeded++;
  ok('lichen paints on rock', seeded > 0, `seeded=${seeded}`);
}
{
  // M4: twin suns vitrify a moon sand field
  const w = S.createWorld('moon', 74);
  S.paint(w, 'base', E.SAND, 32, 24, 6);
  S.paint(w, 'base', E.SUN, 28, 22, 3);
  S.paint(w, 'base', E.SUN, 37, 22, 3);
  step(w, 40);
  ok('M4 glass house fires', !!w.quests.M4, 'glass=' + w.counts.glass);
}
// 15. new worlds are winnable
{
  // U1: heaters melt a Europan pool that stays liquid
  const w = S.createWorld('europa', 80);
  for (let k = 0; k < 4; k++) S.paint(w, 'tech', TECH.HEATER, 28 + k, 20, 0);
  step(w, 150);
  ok('U1 meltwater fires', !!w.quests.U1, 'water=' + w.counts.water);
}
{
  // U2: imported soil + dome + heaters grow moss on an ice moon
  const w = S.createWorld('europa', 81);
  S.paint(w, 'tech', TECH.DOME, 32, 20, 1);
  for (let k = 0; k < 4; k++) S.paint(w, 'tech', TECH.HEATER, 30 + k, 20, 0);
  S.paint(w, 'base', E.SOIL, 32, 20, 5);
  for (let i = 0; i < w.el.length; i++) if (w.el[i] === E.SOIL) w.wet[i] = 0.9;
  S.paint(w, 'life', LIFE.MOSS, 32, 20, 3);
  step(w, 90);
  ok('U2 brine garden fires', !!w.quests.U2, 'moss=' + w.counts.moss);
}
{
  // H1: sulfur sunk in a pond, re-stoked: sustained souring brews acid
  const w = S.createWorld('hadean', 82);
  S.paint(w, 'base', E.WATER, 20, 20, 5);
  S.paint(w, 'base', E.SULFUR, 20, 24, 2);
  for (let round = 0; round < 4; round++) {
    for (let k = 0; k < 6; k++) S.paint(w, 'temp', 1, 20, 24, 2);
    step(w, 15);
  }
  ok('H1 acid pond fires', !!w.quests.H1, 'acid=' + w.counts.acid);
}
{
  // H2: thermophile germs under a dome roof, wet and warm
  const w = S.createWorld('hadean', 83);
  S.paint(w, 'tech', TECH.DOME, 32, 20, 1);
  S.paint(w, 'base', E.WATER, 32, 20, 4);
  S.paint(w, 'life', LIFE.GERMS, 32, 20, 3);
  step(w, 60);
  ok('H2 hot garden fires', !!w.quests.H2, 'germs=' + w.counts.germs);
}
// 16. dry ice, sandstone, gravel, peat, locusts
{
  // dry ice sublimes into CO2 instead of melting
  const w = S.createWorld('earth', 80);
  S.paint(w, 'base', E.DRYICE, 20, 20, 2);
  const d0 = countEl(w, E.DRYICE);
  let sub = false;
  for (let k = 0; k < 80; k++) { S.stepWorld(w); for (const [kind] of w.ev) if (kind === 'sublime') sub = true; }
  ok('dry ice sublimes', sub && countEl(w, E.DRYICE) < d0, `left=${countEl(w, E.DRYICE)}/${d0}`);
}
{
  // wet sand lithifies into sandstone
  const w = S.createWorld('earth', 81);
  S.paint(w, 'base', E.SAND, 20, 20, 3);
  S.paint(w, 'base', E.WATER, 26, 20, 3);
  let set = false;
  for (let k = 0; k < 120; k++) { S.stepWorld(w); for (const [kind] of w.ev) if (kind === 'set') set = true; }
  ok('wet sand sets to sandstone', set && countEl(w, E.SANDSTONE) > 0, `stone=${countEl(w, E.SANDSTONE)}`);
}
{
  // demolition leaves gravel rubble
  const g = S.createWorld('earth', 82);
  S.paint(g, 'base', E.SAND, 20, 20, 4);
  S.paint(g, 'base', E.TNT, 20, 20, 1);
  S.paint(g, 'base', E.FIRE, 20, 20, 0);
  step(g, 20);
  ok('blasts leave gravel', countEl(g, E.GRAVEL) > 0, `gravel=${countEl(g, E.GRAVEL)}`);
}
{
  // bog: waterlogged soil goes peaty, and peat burns
  const w = S.createWorld('earth', 83);
  S.paint(w, 'base', E.SOIL, 20, 20, 4);
  S.paint(w, 'base', E.WATER, 20, 16, 3);
  step(w, 150);
  ok('waterlogged soil peats', countEl(w, E.PEAT) > 0, `peat=${countEl(w, E.PEAT)}`);
  S.paint(w, 'base', E.FIRE, 20, 20, 0);
  let ign = false;
  for (let k = 0; k < 20; k++) { S.stepWorld(w); for (const [kind] of w.ev) if (kind === 'ignite') ign = true; }
  ok('peat burns', ign, 'no ignite');
}
{
  // locusts strip meadows, starve without prey, feed E5
  const w = S.createWorld('earth', 84);
  S.paint(w, 'base', E.SOIL, 20, 20, 6);
  for (let i = 0; i < w.el.length; i++) if (w.el[i] === E.SOIL) w.wet[i] = 0.9;
  S.paint(w, 'life', LIFE.GRASS, 20, 20, 5);
  step(w, 5);
  S.paint(w, 'life', LIFE.LOCUSTS, 20, 20, 4);
  let nib = false;
  for (let k = 0; k < 40; k++) { S.stepWorld(w); for (const [kind] of w.ev) if (kind === 'nibble') nib = true; }
  ok('locusts nibble meadows', nib, 'no nibble');
  ok('E5 swarm fires', !!w.quests.E5, `locusts=${w.counts.locusts}`);
  const s = S.createWorld('earth', 85);
  S.paint(s, 'life', LIFE.LOCUSTS, 20, 20, 2);
  step(s, 30);
  ok('locusts starve prey-less', (s.counts.locusts || 0) === 0, `left=${s.counts.locusts}`);
}
// 10. perf budget: 200 full ticks stay quick
{
  const w = S.createWorld('mars', 99);
  const t0 = Date.now();
  step(w, 200);
  ok('200 ticks quick', Date.now() - t0 < 8000, Date.now() - t0 + 'ms');
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
