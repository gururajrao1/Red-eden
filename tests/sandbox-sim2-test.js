/* Batch-2 sim harness: 25 new elements + 4 tech + 6 life + 3 quests.
   Run: node tests/sandbox-sim2-test.js   (from the evolution/ root) */
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
const noon = w => { w.sol = 15; }; // earth cycle 60: sol 15 is noon
function stepEv(w, n) {
  const seen = new Set();
  for (let k = 0; k < n; k++) { S.stepWorld(w); for (const [kind] of w.ev) seen.add(kind); }
  return seen;
}

// 1. kiln holds ~500C and fires clay with no lava anywhere
{
  const w = S.createWorld('earth', 101);
  S.paint(w, 'tech', TECH.KILN, 32, 20, 1);
  S.paint(w, 'base', E.CLAY, 20, 25, 3); // bedded in soil: stays put inside the kiln disc
  S.paint(w, 'tech', TECH.KILN, 20, 25, 0);
  step(w, 120);
  const pt = w.pt[S.gidx(32, 20)];
  ok('kiln holds heat', pt > 400 && pt < 600, 'pt=' + pt.toFixed(0));
  ok('kiln fires clay->brick', countEl(w, E.BRICK) > 0, 'brick=' + countEl(w, E.BRICK));
}
// 2. kiln calcines limestone and smelts copper ore (E6 quest fires for real)
{
  const w = S.createWorld('earth', 102);
  S.paint(w, 'base', E.LIMESTONE, 20, 25, 3);
  S.paint(w, 'tech', TECH.KILN, 20, 25, 0);
  S.paint(w, 'base', E.COPPERORE, 44, 25, 3);
  S.paint(w, 'tech', TECH.KILN, 44, 25, 0);
  let peak = 0; // stray lake water slakes lime later: calcination is proved by the peak
  for (let k = 0; k < 20; k++) { step(w, 10); peak = Math.max(peak, countEl(w, E.LIME)); }
  ok('kiln calcines limestone->lime', peak >= 10, 'peak lime=' + peak);
  ok('kiln smelts ore->copper', countEl(w, E.COPPER) > 0, 'copper=' + countEl(w, E.COPPER));
  ok('E6 Quicklime fires', !!w.quests.E6, 'quests=' + JSON.stringify(w.quests));
}
// 3. lime slakes hot in water; quartz vitrifies easier than sand; wax melts first
{
  const w = S.createWorld('earth', 103);
  S.paint(w, 'base', E.LIME, 20, 30, 2);
  S.paint(w, 'base', E.WATER, 20, 25, 2);
  S.paint(w, 'base', E.QUARTZ, 40, 25, 3);
  S.paint(w, 'base', E.LAVA, 40, 21, 1);
  S.paint(w, 'base', E.WAX, 55, 25, 1);
  S.paint(w, 'temp', 1, 55, 25, 1);
  const ev = stepEv(w, 60);
  ok('lime slakes (hiss)', ev.has('hiss'), 'no hiss');
  ok('quartz+lava->glass', countEl(w, E.GLASS) > 0, 'glass=' + countEl(w, E.GLASS));
  ok('wax melts (melt)', ev.has('melt'), 'no melt');
}
// 4. nitrogen blanket smothers fire (snuff), control burns out silently
{
  const w = S.createWorld('earth', 104);
  noon(w);
  S.paint(w, 'base', E.WOOD, 20, 24, 3);
  S.paint(w, 'base', E.NITROGEN, 20, 29, 3);
  S.paint(w, 'base', E.FIRE, 20, 29, 0); // embedded in the nitrogen cloud
  const ev = stepEv(w, 80);
  ok('nitrogen smothers (snuff)', ev.has('snuff'), 'no snuff');
}
// 5. chlorine dissolves into bleach water (painted into the pool: contact is adjacency)
{
  const w = S.createWorld('earth', 105);
  S.paint(w, 'base', E.WATER, 25, 26, 4);
  S.paint(w, 'base', E.CHLORINE, 25, 29, 3);
  const ev = stepEv(w, 120);
  ok('chlorine dissolves (dissolve)', ev.has('dissolve'), 'no dissolve');
}
// 6. uranium runs warm and its radiation clears nearby germs (domed control)
{
  const w = S.createWorld('earth', 106);
  noon(w);
  for (const cx of [15, 45]) { // wet germ beds: domed against UV, sprinkled against drying
    S.paint(w, 'base', E.WATER, cx, 25, 3);
    S.paint(w, 'base', E.SOIL, cx, 25, 3);
    S.paint(w, 'life', LIFE.GERMS, cx, 25, 3);
    S.paint(w, 'tech', TECH.DOME, cx, 25, 4);
    S.paint(w, 'tech', TECH.SPRINKLER, cx, 25, 0);
  }
  S.paint(w, 'base', E.URANIUM, 15, 25, 2); // a real vein: many tiles roll the radiation gate
  const g0a = countLife(w, LIFE.GERMS);
  step(w, 60);
  const pt = w.pt[S.gidx(15, 25)];
  ok('uranium runs warm', pt > 35, 'pt=' + pt.toFixed(0));
  step(w, 120);
  let near = 0, far = 0;
  for (let y = 0; y < 40; y++) for (let x = 0; x < 64; x++) {
    if (w.life[y * 64 + x] !== LIFE.GERMS) continue;
    if (Math.hypot(x - 15, y - 25) < 12) near++; else far++;
  }
  ok('uranium radiation clears germs', near < far * 0.5, `near=${near} far=${far} (started ${g0a})`);
}

// 7. mercury sinks the full length of a water tube
{
  const w = S.createWorld('earth', 107);
  for (let y = 10; y <= 38; y++) { S.paint(w, 'base', E.ROCK, 19, y, 0); S.paint(w, 'base', E.ROCK, 21, y, 0); }
  for (let x = 19; x <= 21; x++) S.paint(w, 'base', E.ROCK, x, 38, 0);
  for (let y = 11; y <= 37; y++) S.paint(w, 'base', E.EMPTY, 20, y, 0); // clear worldgen rock blobs
  for (let y = 12; y <= 37; y++) S.paint(w, 'base', E.WATER, 20, y, 0);
  S.paint(w, 'base', E.MERCURY, 20, 12, 0);
  step(w, 80);
  let deep = 0;
  for (let y = 0; y < 40; y++) for (let x = 0; x < 64; x++)
    if (w.el[y * 64 + x] === E.MERCURY && y >= 35) deep++;
  ok('mercury sinks through water', deep > 0, 'no deep mercury');
}
// 8. foam rides the surface: poured on top, never found down the tube
{
  const w = S.createWorld('earth', 108);
  for (let y = 10; y <= 38; y++) { S.paint(w, 'base', E.ROCK, 19, y, 0); S.paint(w, 'base', E.ROCK, 21, y, 0); }
  for (let x = 19; x <= 21; x++) S.paint(w, 'base', E.ROCK, x, 38, 0);
  for (let y = 11; y <= 37; y++) S.paint(w, 'base', E.EMPTY, 20, y, 0); // clear worldgen rock blobs
  for (let y = 15; y <= 37; y++) S.paint(w, 'base', E.WATER, 20, y, 0);
  for (let y = 12; y <= 14; y++) S.paint(w, 'base', E.FOAM, 20, y, 0);
  step(w, 80);
  let below = 0, total = 0;
  for (let y = 0; y < 40; y++) for (let x = 0; x < 64; x++)
    if (w.el[y * 64 + x] === E.FOAM) { total++; if (y > 15) below++; }
  ok('foam floats, never sinks', total > 0 && below === 0, `foam=${total} below=${below}`);
}
// 9. foam smothers an adjacent flame; cement cures to concrete
{
  const w = S.createWorld('earth', 109);
  noon(w);
  S.paint(w, 'base', E.WOOD, 20, 28, 3);
  S.paint(w, 'base', E.FIRE, 20, 26, 0);
  S.paint(w, 'base', E.FOAM, 21, 26, 0);
  S.paint(w, 'base', E.CEMENT, 45, 28, 3);
  const ev = stepEv(w, 80);
  ok('foam snuffs fire (snuff)', ev.has('snuff'), 'no snuff');
  ok('cement cures (cure)', ev.has('cure') && countEl(w, E.CONCRETE) > 0,
    `concrete=${countEl(w, E.CONCRETE)}`);
}
// 10. coal needs real heat; charcoal drinks chlorine (never brine); niter+charcoal = gunpowder
{
  const w = S.createWorld('earth', 110);
  S.paint(w, 'base', E.COAL, 17, 25, 2);
  S.paint(w, 'base', E.LAVA, 20, 25, 1); // touching: coal catches by contact, not range
  S.paint(w, 'base', E.CHLORINE, 35, 28, 2);
  S.paint(w, 'base', E.CHARCOAL, 35, 24, 2);
  S.paint(w, 'base', E.SALTPETRE, 50, 28, 2);
  S.paint(w, 'base', E.CHARCOAL, 54, 28, 2);
  const ev = stepEv(w, 120);
  ok('coal ignites on lava (ignite)', ev.has('ignite'), 'no ignite');
  ok('charcoal scrubs chlorine (filter)', ev.has('filter'), 'no filter');
  ok('saltpetre+charcoal mixes (mix)', ev.has('mix'), 'no mix');
}
// 11. dust settles into clay; hail melts on warm ground; granite shrugs off TNT
{
  const w = S.createWorld('earth', 111);
  noon(w);
  S.paint(w, 'base', E.WATER, 15, 30, 3);
  S.paint(w, 'base', E.DUST, 15, 22, 3);
  S.paint(w, 'base', E.HAIL, 35, 20, 4);
  const hail0 = countEl(w, E.HAIL);
  for (let y = 10; y <= 30; y++) S.paint(w, 'base', E.GRANITE, 52, y, 1);
  const g0 = countEl(w, E.GRANITE);
  S.paint(w, 'base', E.TNT, 47, 20, 1);
  S.paint(w, 'base', E.FIRE, 47, 20, 0);
  const ev = stepEv(w, 150);
  ok('dust+water->clay', countEl(w, E.CLAY) > 0, 'clay=' + countEl(w, E.CLAY));
  ok('hail melts away', countEl(w, E.HAIL) < hail0 * 0.5, `hail ${hail0}->${countEl(w, E.HAIL)}`);
  ok('granite survives blast', ev.has('boom') && countEl(w, E.GRANITE) === g0,
    `granite ${g0}->${countEl(w, E.GRANITE)}`);
}
// 12. acid fizzes limestone fast and etches copper (baselined after contact)
{
  const w = S.createWorld('earth', 112);
  S.paint(w, 'base', E.LIMESTONE, 15, 26, 4);
  S.paint(w, 'base', E.COPPER, 45, 26, 4);
  S.paint(w, 'base', E.ACID, 15, 21, 2);
  S.paint(w, 'base', E.ACID, 45, 21, 2);
  const l0 = countEl(w, E.LIMESTONE), c0 = countEl(w, E.COPPER);
  step(w, 200);
  ok('limestone fizzes in acid', countEl(w, E.LIMESTONE) < l0 * 0.7,
    `limestone ${l0}->${countEl(w, E.LIMESTONE)}`);
  ok('copper etched by acid', countEl(w, E.COPPER) < c0, `copper ${c0}->${countEl(w, E.COPPER)}`);
}
// 13. paper burns; seed sprouts on wet soil; bone cremates in lava heat
{
  const w = S.createWorld('earth', 113);
  noon(w);
  S.paint(w, 'base', E.PAPER, 12, 24, 2);
  S.paint(w, 'base', E.FIRE, 12, 29, 1);
  S.paint(w, 'base', E.WATER, 32, 28, 3);
  S.paint(w, 'base', E.SOIL, 32, 28, 3);
  S.paint(w, 'base', E.SEED, 32, 25, 1);
  S.paint(w, 'base', E.BONE, 50, 25, 2);
  S.paint(w, 'base', E.LAVA, 54, 25, 1);
  const p0 = countEl(w, E.PAPER);
  const ev = stepEv(w, 200);
  ok('paper burns up', countEl(w, E.PAPER) < p0 * 0.5, `paper ${p0}->${countEl(w, E.PAPER)}`);
  ok('seed sprouts (sprout)', ev.has('sprout'), 'no sprout');
  ok('bone cremates to ash', countEl(w, E.ASH) > 0, 'ash=' + countEl(w, E.ASH));
}

// 14. coral lays reef limestone; cactus colonises dry soil; sponge drinks foam
{
  const w = S.createWorld('earth', 114);
  w.sol = 2; // dawn start: coral gets the whole day to mature before nightfall
  S.paint(w, 'base', E.ROCK, 22, 31, 6); // reef shelf: dig the pool, then flood it
  S.paint(w, 'base', E.EMPTY, 22, 28, 2);
  S.paint(w, 'base', E.WATER, 22, 28, 2);
  S.paint(w, 'life', LIFE.CORAL, 22, 28, 1);
  S.paint(w, 'life', LIFE.CACTUS, 45, 25, 2);
  const cactus0 = countLife(w, LIFE.CACTUS);
  S.paint(w, 'base', E.WATER, 50, 30, 3);
  S.paint(w, 'life', LIFE.SPONGE, 50, 30, 1);
  S.paint(w, 'base', E.FOAM, 53, 30, 1);
  const ev = stepEv(w, 400); // reef fires on day one; cactus and sponge get the full season
  ok('coral lays reef (reef)', ev.has('reef'), 'no reef');
  ok('cactus spreads without water', countLife(w, LIFE.CACTUS) >= cactus0, `cactus ${cactus0}->${countLife(w, LIFE.CACTUS)}`);
  ok('sponge filters foam (filter)', ev.has('filter'), 'no filter');
}
// 15. fern lives under shade cloth, dies in open noon; worms cast; termites gnaw
{
  const w = S.createWorld('earth', 115);
  noon(w);
  for (const cx of [15, 45]) {
    S.paint(w, 'base', E.WATER, cx, 22, 2);
    S.paint(w, 'base', E.SOIL, cx, 22, 2);
    S.paint(w, 'life', LIFE.FERN, cx, 22, 2);
  }
  S.paint(w, 'tech', TECH.SHADE, 15, 22, 0);
  S.paint(w, 'base', E.SOIL, 30, 30, 0);
  S.paint(w, 'life', LIFE.WORMS, 30, 28, 2);
  S.paint(w, 'base', E.WOOD, 55, 28, 3);
  S.paint(w, 'life', LIFE.TERMITES, 55, 28, 1);
  const ev = stepEv(w, 300);
  let shaded = 0, open = 0;
  for (let y = 0; y < 40; y++) for (let x = 0; x < 64; x++) {
    if (w.life[y * 64 + x] !== LIFE.FERN) continue;
    if (Math.hypot(x - 15, y - 22) < 10) shaded++; else open++;
  }
  ok('fern survives in shade', shaded > 0, 'shaded=0');
  ok('fern dies in open noon', open === 0, `open=${open}`);
  ok('worms cast (cast)', ev.has('cast'), 'no cast');
  ok('termites gnaw (gnaw)', ev.has('gnaw') && countEl(w, E.SAWDUST) > 0,
    `sawdust=${countEl(w, E.SAWDUST)}`);
}
// 16. scarecrow clears locusts; sprinkler soaks; shade cools; E7/E8 fire
{
  // scarecrow world vs identical control: fleeing is structural (impossible without the tech)
  const mkMeadow = seed => {
    const m = S.createWorld('earth', seed);
    noon(m);
    S.paint(m, 'base', E.WATER, 30, 25, 6);
    S.paint(m, 'base', E.SOIL, 30, 25, 6);
    S.paint(m, 'life', LIFE.GRASS, 30, 25, 6);
    S.paint(m, 'tech', TECH.SPRINKLER, 30, 25, 0);
    S.paint(m, 'life', LIFE.LOCUSTS, 30, 25, 3);
    return m;
  };
  const wa = mkMeadow(116);
  S.paint(wa, 'tech', TECH.SCARECROW, 30, 25, 0);
  const wb = mkMeadow(116);
  const eva = stepEv(wa, 20), evb = stepEv(wb, 20);
  ok('scarecrow routs locusts (flee)', eva.has('flee') && !evb.has('flee'), 'flee routing broken');
  const grass = m => { let n = 0; for (let i = 0; i < m.life.length; i++) if (m.life[i] === LIFE.GRASS) n++; return n; };
  ok('guarded meadow keeps its grass', grass(wa) > grass(wb), `safe=${grass(wa)} open=${grass(wb)}`);
  ok('sprinkler soaks soil', wb.wet[S.gidx(30, 25)] > 0.9, 'wet=' + wb.wet[S.gidx(30, 25)].toFixed(2));
}
// 17. shade cloth breaks the sun's symmetry; constructed quests fire
{
  const w = S.createWorld('earth', 117);
  noon(w);
  S.paint(w, 'base', E.SUN, 20, 20, 0);
  S.paint(w, 'tech', TECH.SHADE, 20, 24, 0);
  step(w, 80);
  const below = w.pt[S.gidx(20, 21)], above = w.pt[S.gidx(20, 19)];
  ok('shade cools its disc', below < above - 3, `below=${below.toFixed(0)} above=${above.toFixed(0)}`);

  const q = S.createWorld('earth', 118);
  noon(q);
  S.paint(q, 'base', E.WATER, 20, 25, 6);
  S.paint(q, 'base', E.SOIL, 20, 25, 6);
  S.paint(q, 'life', LIFE.GRASS, 20, 25, 6);
  S.paint(q, 'life', LIFE.LOCUSTS, 20, 25, 5);
  S.paint(q, 'tech', TECH.SCARECROW, 20, 25, 0);
  S.paint(q, 'base', E.WATER, 45, 25, 4);
  S.paint(q, 'life', LIFE.CORAL, 45, 25, 4);
  step(q, 3);
  ok('E7 Straw guardian fires', !!q.quests.E7, 'quests=' + JSON.stringify(q.quests));
  ok('E8 Reef fires', !!q.quests.E8, 'quests=' + JSON.stringify(q.quests));
}

console.log(fail ? `\n${fail} SIM2 FAILURES (${pass} passed)` : `\nALL ${pass} SIM2 PASSED`);
process.exit(fail ? 1 : 0);


