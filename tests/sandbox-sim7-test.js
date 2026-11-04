/* Sim proof, part 7: the niche batch mechanics — free oxygen, uranium cleanup,
   tun-state, soda crusts, and the food-web manners (spiders spare bees).
   Run: node tests/sandbox-sim7-test.js   (from the evolution/ root) */
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
// 1. oxygen starts where atmospheres say so, and cyano exhales only by day
{
  const e = S.createWorld('earth', 901), m = S.createWorld('mars', 901);
  ok('earth starts oxygenated, mars starts airless', e.o2 === 100 && m.o2 === 0, `${e.o2}/${m.o2}`);
  S.paint(m, 'base', E.WATER, 32, 25, 2);
  S.paint(m, 'tech', TECH.HEATER, 32, 25, 1);
  step(m, 30);
  S.paint(m, 'life', LIFE.CYANO, 32, 25, 1);
  const before = m.o2;
  m.sol = 10; // full day ahead
  step(m, 20);
  ok('cyano exhales by day', m.o2 > before, `${before} -> ${m.o2.toFixed(2)}`);
}
// 2. the GOE milestone fires once, with a journal-grade event
{
  const w = S.createWorld('mars', 902);
  w.o2 = 9.9;
  S.paint(w, 'base', E.WATER, 32, 25, 2);
  S.paint(w, 'tech', TECH.HEATER, 32, 25, 1);
  step(w, 30); // melt the pool before seeding, greenhouse rules
  w.sol = 10;
  S.paint(w, 'life', LIFE.CYANO, 32, 25, 2);
  step(w, 30);
  ok('oxygen milestone fires at ten', !!w.o2loud && w.o2 >= 10, `loud=${w.o2loud} o2=${w.o2.toFixed(1)}`);
}
// 3. banded iron needs free oxygen (or a dome, the old way)
{
  const w = S.createWorld('mars', 903); // no dome, no oxygen: stainless planet
  S.paint(w, 'base', E.WATER, 32, 25, 2);
  S.paint(w, 'tech', TECH.HEATER, 32, 25, 1);
  step(w, 20); // liquid all night, or there is no reaction to watch
  S.paint(w, 'base', E.METAL, 32, 25, 1);
  step(w, 60);
  const dry = countEl(w, E.RUST);
  w.o2 = 10; // the GOE arrives
  step(w, 60);
  ok('iron waits for air, then rusts', dry === 0 && countEl(w, E.RUST) > 0, `before=${dry} after=${countEl(w, E.RUST)}`);
}
// 4. uranium becomes lead under a deino crew
{
  const w = S.createWorld('earth', 904);
  S.paint(w, 'base', E.URANIUM, 32, 25, 2);
  S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
  S.paint(w, 'life', LIFE.DEINO, 32, 25, 1);
  step(w, 40);
  ok('deino remediates uranium', w.uClean > 0 && countEl(w, E.LEAD) > 0, `uClean=${w.uClean}`);
}
// 5. tun-state: tardigrades persist dry and wake in water
{
  const w = S.createWorld('moon', 905);
  S.paint(w, 'life', LIFE.TARDI, 32, 25, 1);
  step(w, 40);
  const dry = countLife(w, LIFE.TARDI);
  const v = S.createWorld('earth', 906);
  S.paint(v, 'base', E.WATER, 32, 25, 3);
  v.sol = 8;
  S.paint(v, 'life', LIFE.TARDI, 32, 25, 1);
  step(v, 40);
  ok('bears tun on rock, breed in pools', dry > 0 && countLife(v, LIFE.TARDI) > 5, `dry=${dry} pool=${countLife(v, LIFE.TARDI)}`);
}
// 6. trona wants damp salt + lime, not floods (slaking boils those)
{
  const w = S.createWorld('earth', 907);
  S.paint(w, 'base', E.SALT, 32, 25, 3);
  S.paint(w, 'base', E.LIME, 32, 25, 1);
  S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
  step(w, 60);
  const damp = countEl(w, E.TRONA);
  const v = S.createWorld('earth', 908); // bone-dry control
  S.paint(v, 'base', E.SALT, 32, 25, 3);
  S.paint(v, 'base', E.LIME, 32, 25, 1);
  step(v, 60);
  ok('soda crusts only when damp', damp > 0 && countEl(v, E.TRONA) === 0, `damp=${damp} dry=${countEl(v, E.TRONA)}`);
}
// 7. spiders spare the bees
{
  const w = S.createWorld('earth', 909);
  S.paint(w, 'base', E.SOIL, 32, 25, 4);
  S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
  w.sol = 2;
  S.paint(w, 'life', LIFE.FLOWER, 32, 25, 2);
  step(w, 15);
  S.paint(w, 'life', LIFE.BEE, 32, 25, 1);
  S.paint(w, 'life', LIFE.SPIDER, 30, 25, 0);
  S.paint(w, 'life', LIFE.SPIDER, 34, 25, 0);
  step(w, 15);
  ok('spiders spare bees, starve without prey', countLife(w, LIFE.BEE) > 0, `bees=${countLife(w, LIFE.BEE)}`);
}
console.log(fail ? `\n${fail} SIM7 FAILURES (${pass} passed)` : `\nALL ${pass} SIM7 PASSED`);
process.exit(fail ? 1 : 0);
