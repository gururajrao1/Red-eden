/* Sim6: batch-4 behaviours hold — exotic matter (wall/void/clone/battery),
   pressure transforms (diamond/gold/marble), food (sugar/meat) and the five
   new lifeforms keep their homes. Predator windows score the boom, not the bust.
   Run: node tests/sandbox-sim6-test.js   (from the evolution/ root) */
'use strict';
const S = require('../app/simsandbox.js');
const { E, LIFE, TECH } = S;
let fail = 0;
const ok = (name, cond, info) => {
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (cond ? '' : ' :: ' + info));
  if (!cond) fail++;
};
const cntE = (w, id) => { let n = 0; for (let i = 0; i < w.el.length; i++) if (w.el[i] === id) n++; return n; };
const cntL = (w, id) => { let n = 0; for (let i = 0; i < w.life.length; i++) if (w.life[i] === id) n++; return n; };
const step = (w, n) => { for (let k = 0; k < n; k++) S.stepWorld(w); };
// wall outlives TNT next door (paint wall on dug ground: base paint never overwrites rock)
{
  const w = S.createWorld('earth', 1);
  S.paint(w, 'base', E.SOIL, 32, 25, 3); S.paint(w, 'base', E.WALL, 32, 25, 0);
  S.paint(w, 'base', E.TNT, 30, 25, 0); S.paint(w, 'base', E.FIRE, 30, 25, 0);
  step(w, 8);
  ok('wall outlives TNT next door', w.el[25 * 64 + 32] === E.WALL, 'el=' + w.el[25 * 64 + 32]);
}
// void clears its neighbours and persists
{
  const w = S.createWorld('earth', 2);
  S.paint(w, 'base', E.EMPTY, 32, 25, 4); // clear natural soil: the region holds only our disc
  S.paint(w, 'base', E.SOIL, 32, 25, 1); S.paint(w, 'base', E.EMPTY, 32, 25, 0); // r1: every tile touches the void
  S.paint(w, 'base', E.VOID, 32, 25, 0);
  step(w, 6);
  let local = 0;
  for (let y = 22; y <= 28; y++) for (let x = 29; x <= 35; x++) if (w.el[y * 64 + x] === E.SOIL) local++;
  ok('void clears its neighbours', local === 0 && w.el[25 * 64 + 32] === E.VOID, 'local soil=' + local);
}
// clone duplicates water into air pockets
{
  const w = S.createWorld('earth', 3);
  S.paint(w, 'base', E.EMPTY, 32, 25, 2);
  S.paint(w, 'base', E.CLONE, 32, 25, 0); S.paint(w, 'base', E.WATER, 33, 25, 0);
  step(w, 10);
  ok('clone spreads water', cntE(w, E.WATER) > 3, 'water=' + cntE(w, E.WATER));
}
// battery shorts in water
{
  const w = S.createWorld('earth', 4);
  S.paint(w, 'base', E.WATER, 32, 25, 2); S.paint(w, 'base', E.BATTERY, 32, 25, 0);
  let zap = false;
  for (let k = 0; k < 25; k++) { S.stepWorld(w); if (w.ev.some(e => e[0] === 'zap')) zap = true; }
  ok('battery shorts in water (zap)', zap, 'no zap seen');
}
// white-hot coal makes diamond
{
  let d = 0;
  for (let s = 0; s < 6; s++) {
    const w = S.createWorld('earth', 100 + s);
    S.paint(w, 'base', E.COAL, 32, 25, 2); S.paint(w, 'base', E.LAVA, 32, 22, 2);
    step(w, 30); d += cntE(w, E.DIAMOND);
  }
  ok('white-hot coal makes diamond', d > 0, 'diamonds=' + d);
}
// bonanza ore runs gold (and usually copper)
{
  let g = 0, c = 0;
  for (let s = 0; s < 10; s++) {
    const w = S.createWorld('earth', 200 + s);
    S.paint(w, 'base', E.COPPERORE, 32, 25, 1); S.paint(w, 'tech', TECH.KILN, 32, 25, 0);
    step(w, 12); g += cntE(w, E.GOLD); c += cntE(w, E.COPPER);
  }
  ok('bonanza ore runs gold', g > 0 && c > 0, `gold=${g} copper=${c}`);
}
// lava bakes limestone to marble
{
  let m = 0;
  for (let s = 0; s < 6; s++) {
    const w = S.createWorld('earth', 300 + s);
    S.paint(w, 'base', E.LIMESTONE, 32, 25, 2); S.paint(w, 'base', E.LAVA, 32, 22, 2);
    step(w, 25); m += cntE(w, E.MARBLE);
  }
  ok('lava bakes marble', m > 0, 'marble=' + m);
}
// sugar pile feeds ants
{
  const w = S.createWorld('earth', 400);
  S.paint(w, 'base', E.SOIL, 32, 25, 4);
  S.paint(w, 'base', E.SUGAR, 32, 25, 1); S.paint(w, 'life', LIFE.ANT, 34, 25, 1);
  step(w, 20);
  ok('ants work a sugar pile', cntL(w, LIFE.ANT) > 0, 'ants=' + cntL(w, LIFE.ANT));
}
// meat rots to soil
{
  const w = S.createWorld('earth', 401);
  S.paint(w, 'base', E.MEAT, 32, 25, 2);
  step(w, 200);
  ok('carrion composts', cntE(w, E.SOIL) > 0, 'soil=' + cntE(w, E.SOIL));
}
// fish keep a stocked pool
{
  const w = S.createWorld('earth', 500);
  S.paint(w, 'base', E.WATER, 32, 25, 3); w.sol = 2;
  S.paint(w, 'life', LIFE.ALGAE, 32, 25, 2); S.paint(w, 'life', LIFE.FISH, 32, 25, 1);
  step(w, 20);
  ok('fish keep a stocked pool', cntL(w, LIFE.FISH) > 0, 'fish=' + cntL(w, LIFE.FISH));
}
// virus epidemics peak before the hosts run out (boom, not bust)
{
  const w = S.createWorld('earth', 600);
  S.paint(w, 'base', E.SOIL, 32, 25, 4); S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
  S.paint(w, 'life', LIFE.GERMS, 32, 25, 3); S.paint(w, 'life', LIFE.VIRUS, 32, 25, 0);
  step(w, 6);
  ok('virus hijacks a germ bed', cntL(w, LIFE.VIRUS) > 5, 'virus=' + cntL(w, LIFE.VIRUS));
}
// birds hunt the swarm (boom, not bust)
{
  const w = S.createWorld('earth', 700);
  S.paint(w, 'base', E.SOIL, 32, 25, 5); S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
  S.paint(w, 'life', LIFE.GRASS, 32, 25, 4);
  step(w, 10);
  S.paint(w, 'life', LIFE.LOCUSTS, 32, 25, 1); S.paint(w, 'life', LIFE.BIRD, 34, 25, 1);
  step(w, 6);
  ok('birds keep a hunted meadow', cntL(w, LIFE.BIRD) > 0, 'birds=' + cntL(w, LIFE.BIRD));
}
// trees hold a watered bed and rain seeds
{
  const w = S.createWorld('earth', 900);
  S.paint(w, 'base', E.SOIL, 32, 25, 5); S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
  S.paint(w, 'life', LIFE.TREE, 32, 25, 1);
  step(w, 60);
  ok('trees hold a watered bed', cntL(w, LIFE.TREE) > 0, 'trees=' + cntL(w, LIFE.TREE));
}
// science audit: charcoal drinks chlorine gas, never dissolved salt
{
  const w = S.createWorld('earth', 1001);
  S.paint(w, 'base', E.CHARCOAL, 30, 25, 1); S.paint(w, 'base', E.CHLORINE, 32, 25, 1);
  S.paint(w, 'base', E.CHARCOAL, 40, 25, 1); S.paint(w, 'base', E.BRINE, 42, 25, 1);
  let filt = false;
  for (let k = 0; k < 30; k++) { S.stepWorld(w); if (w.ev.some(e => e[0] === 'filter')) filt = true; }
  ok('charcoal scrubs chlorine, ignores brine', filt && cntE(w, E.BRINE) > 0,
    `filter=${filt} brine=${cntE(w, E.BRINE)}`);
}
// science audit: bloomery steel etches in acid over time
{
  const w = S.createWorld('earth', 1002);
  S.paint(w, 'base', E.STEEL, 32, 25, 2); S.paint(w, 'base', E.ACID, 32, 25, 1);
  step(w, 120);
  ok('acid etches steel in time', cntE(w, E.STEEL) < 13, 'steel=' + cntE(w, E.STEEL));
}
// science audit: dirty sand vitrifies before pure quartz
{
  const w = S.createWorld('earth', 1003);
  S.paint(w, 'base', E.SAND, 28, 25, 2); S.paint(w, 'tech', TECH.KILN, 28, 25, 0);
  S.paint(w, 'base', E.QUARTZ, 36, 25, 2); S.paint(w, 'tech', TECH.KILN, 36, 25, 0);
  step(w, 30);
  const kilnGlass = cntE(w, E.GLASS);
  S.paint(w, 'base', E.SUN, 36, 23, 0);
  step(w, 30);
  ok('kiln glasses neither, sun glasses quartz', kilnGlass === 0 && cntE(w, E.GLASS) > 0,
    `kiln-glass=${kilnGlass} total=${cntE(w, E.GLASS)}`);
}
// science audit: buried coal + heat presses diamond without burning
{
  let d = 0;
  for (let s = 0; s < 3; s++) {
    const w = S.createWorld('earth', 1010 + s);
    S.paint(w, 'base', E.COAL, 32, 26, 2);
    S.paint(w, 'base', E.SAND, 32, 24, 3);
    S.paint(w, 'tech', TECH.KILN, 28, 26, 0);
    step(w, 150); d += cntE(w, E.DIAMOND);
  }
  ok('burial + kiln presses diamond', d > 0, 'diamonds=' + d);
}
console.log(fail ? `\n${fail} SIM6 FAILURES` : '\nALL SIM6 PASSED');
process.exit(fail ? 1 : 0);
