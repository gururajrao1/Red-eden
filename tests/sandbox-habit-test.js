/* Habitability proof: every lifeform survives a proper home, the inspector's
   live checklist agrees with reality there, and it diagnoses honestly where
   things cannot live. No more silent mysterious deaths.
   Run: node tests/sandbox-habit-test.js   (from the evolution/ root) */
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
const countLife = (w, id) => { let n = 0; for (let i = 0; i < w.life.length; i++) if (w.life[i] === id) n++; return n; };
const alive = (worldId, seed, build, L, ticks) => {
  const w = S.createWorld(worldId, seed);
  build(w);
  step(w, ticks);
  return [w, countLife(w, L)];
};
// Part A: thirteen proper homes, thirteen survivals
{
  let [, n] = alive('earth', 701, w => {
    S.paint(w, 'base', E.WATER, 32, 25, 3);
    S.paint(w, 'tech', TECH.DOME, 32, 25, 1);
    S.paint(w, 'life', LIFE.GERMS, 32, 25, 2);
  }, LIFE.GERMS, 100);
  ok('germs keep a domed pool', n > 0, 'germs=' + n);
}
{
  let [, n] = alive('earth', 702, w => {
    S.paint(w, 'base', E.SOIL, 32, 25, 4);
    S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
    S.paint(w, 'life', LIFE.MOSS, 32, 25, 2);
  }, LIFE.MOSS, 100);
  ok('moss keeps an irrigated bed', n > 0, 'moss=' + n);
}
{
  let [, n] = alive('earth', 703, w => {
    S.paint(w, 'base', E.SOIL, 32, 25, 4);
    S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
    S.paint(w, 'life', LIFE.GRASS, 32, 25, 2);
  }, LIFE.GRASS, 100);
  ok('grass keeps an irrigated bed', n > 0, 'grass=' + n);
}
{
  let [, n] = alive('earth', 704, w => {
    S.paint(w, 'base', E.WATER, 32, 25, 3);
    w.sol = 8;
    S.paint(w, 'life', LIFE.ALGAE, 32, 25, 2);
  }, LIFE.ALGAE, 20);
  ok('algae keeps daylit water', n > 0, 'algae=' + n);
}
{
  let [, n] = alive('earth', 705, w => {
    S.paint(w, 'base', E.WOOD, 32, 25, 3);
    S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
    S.paint(w, 'life', LIFE.FUNGUS, 32, 25, 2);
  }, LIFE.FUNGUS, 100);
  ok('fungus keeps damp timber', n > 0, 'fungus=' + n);
}
{
  let [, n] = alive('earth', 706, w => {
    S.paint(w, 'base', E.ROCK, 32, 25, 4);
    S.paint(w, 'life', LIFE.LICHEN, 32, 25, 3);
  }, LIFE.LICHEN, 100);
  ok('lichen keeps bare rock', n > 0, 'lichen=' + n);
}
{
  let [, n] = alive('earth', 707, w => {
    S.paint(w, 'base', E.SOIL, 32, 25, 5);
    S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
    S.paint(w, 'life', LIFE.GRASS, 32, 25, 4);
    for (let k = 0; k < 10; k++) S.stepWorld(w);
    S.paint(w, 'life', LIFE.LOCUSTS, 32, 25, 1);
  }, LIFE.LOCUSTS, 4);
  ok('locusts swarm a ripe meadow (boom before the bust)', n >= 8, 'locusts=' + n);
}
{
  let [, n] = alive('earth', 708, w => {
    for (let x = 28; x <= 36; x++) { S.paint(w, 'base', E.ROCK, x, 21, 0); S.paint(w, 'base', E.ROCK, x, 29, 0); }
    for (let y = 21; y <= 29; y++) { S.paint(w, 'base', E.ROCK, 28, y, 0); S.paint(w, 'base', E.ROCK, 36, y, 0); }
    S.paint(w, 'base', E.WATER, 32, 25, 3);
    w.sol = 2;
    S.paint(w, 'life', LIFE.CORAL, 32, 25, 2);
  }, LIFE.CORAL, 15);
  ok('coral keeps a dawn lagoon', n > 0, 'coral=' + n);
}
{
  let [, n] = alive('mars', 709, w => {
    S.paint(w, 'base', E.SAND, 32, 25, 3);
    S.paint(w, 'tech', TECH.HEATER, 32, 25, 0);
    S.paint(w, 'life', LIFE.CACTUS, 32, 25, 2);
  }, LIFE.CACTUS, 30);
  ok('cactus keeps a heated dune', n > 0, 'cactus=' + n);
}
{
  const w = S.createWorld('europa', 710);
  S.paint(w, 'tech', TECH.HEATER, 32, 25, 1); // one heater makes slush; five hold a pool
  step(w, 100);
  S.paint(w, 'life', LIFE.SPONGE, 32, 25, 2);
  step(w, 30);
  ok('sponge keeps a heated pool', countLife(w, LIFE.SPONGE) > 0, 'sponge=' + countLife(w, LIFE.SPONGE));
}
{
  let [, n] = alive('earth', 711, w => {
    S.paint(w, 'base', E.SOIL, 32, 25, 3);
    S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
    S.paint(w, 'tech', TECH.SHADE, 34, 25, 0);
    S.paint(w, 'life', LIFE.FERN, 32, 25, 2);
  }, LIFE.FERN, 60);
  ok('fern keeps a shaded bed', n > 0, 'fern=' + n);
}
{
  let [, n] = alive('earth', 712, w => {
    S.paint(w, 'base', E.SOIL, 32, 25, 3);
    S.paint(w, 'life', LIFE.WORMS, 32, 25, 2);
  }, LIFE.WORMS, 30);
  ok('worms keep plain soil', n > 0, 'worms=' + n);
}
{
  let [, n] = alive('earth', 713, w => {
    S.paint(w, 'base', E.WOOD, 32, 25, 3);
    S.paint(w, 'life', LIFE.TERMITES, 32, 25, 2);
  }, LIFE.TERMITES, 30);
  ok('termites keep timber', n > 0, 'termites=' + n);
}
{
  let [, n] = alive('earth', 723, w => {
    S.paint(w, 'base', E.WATER, 32, 25, 3); w.sol = 2;
    S.paint(w, 'life', LIFE.ALGAE, 32, 25, 2);
    S.paint(w, 'life', LIFE.FISH, 32, 25, 1);
  }, LIFE.FISH, 20);
  ok('fish keep a stocked pool', n > 0, 'fish=' + n);
}
{
  let [, n] = alive('earth', 724, w => {
    S.paint(w, 'base', E.SOIL, 32, 25, 5);
    S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
    S.paint(w, 'life', LIFE.TREE, 32, 25, 1);
  }, LIFE.TREE, 60);
  ok('trees hold a watered bed', n > 0, 'trees=' + n);
}
{
  let [, n] = alive('earth', 725, w => {
    S.paint(w, 'base', E.SOIL, 32, 25, 4);
    S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
    S.paint(w, 'life', LIFE.GERMS, 32, 25, 3);
    S.paint(w, 'life', LIFE.VIRUS, 32, 25, 0);
  }, LIFE.VIRUS, 6);
  ok('virus peaks over a germ bed (boom)', n > 5, 'virus=' + n);
}
{
  let [, n] = alive('titan', 730, w => {
    S.paint(w, 'base', E.SOIL, 32, 25, 4);
    S.paint(w, 'tech', TECH.DOME, 32, 25, 0);
    S.paint(w, 'tech', TECH.HEATER, 30, 25, 0); // one heater loses to −180° ambient; two hold the bed
    S.paint(w, 'tech', TECH.HEATER, 34, 25, 0);
    S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
    S.paint(w, 'life', LIFE.MOSS, 32, 25, 2);
  }, LIFE.MOSS, 100);
  ok('moss keeps a Titan hothouse', n > 0, 'moss=' + n);
}
{
  let [, n] = alive('earth', 732, w => {
    S.paint(w, 'base', E.SOIL, 32, 25, 4);
    S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
    w.sol = 2;
    S.paint(w, 'life', LIFE.FLOWER, 32, 25, 2);
  }, LIFE.FLOWER, 100);
  ok('flowers hold a watered bed through nights', n > 0, 'flowers=' + n);
}
{
  let [, n] = alive('earth', 733, w => {
    S.paint(w, 'base', E.WATER, 32, 25, 3);
    w.sol = 8;
    S.paint(w, 'life', LIFE.KELP, 32, 25, 2);
  }, LIFE.KELP, 60);
  ok('kelp holds a daylit pool', n > 0, 'kelp=' + n);
}
{
  const w = S.createWorld('earth', 734);
  S.paint(w, 'base', E.WOOD, 32, 25, 3);
  S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
  S.paint(w, 'tech', TECH.SHADE, 30, 25, 0); // shade for day dark, heater against night frost
  S.paint(w, 'tech', TECH.HEATER, 34, 25, 0);
  S.paint(w, 'life', LIFE.FUNGUS, 32, 25, 2);
  step(w, 20); // let the rot take hold before fruiting
  S.paint(w, 'life', LIFE.MUSHROOM, 32, 25, 2);
  step(w, 60);
  ok('mushrooms fruit from shaded rot', countLife(w, LIFE.MUSHROOM) > 0, 'mushrooms=' + countLife(w, LIFE.MUSHROOM));
}
{
  let [, n] = alive('earth', 735, w => {
    S.paint(w, 'base', E.SOIL, 32, 25, 4);
    S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
    w.sol = 2;
    S.paint(w, 'life', LIFE.FLOWER, 32, 25, 2);
    for (let k = 0; k < 20; k++) S.stepWorld(w);
    S.paint(w, 'life', LIFE.BEE, 32, 25, 1);
  }, LIFE.BEE, 40);
  ok('bees work a blooming bed', n > 0, 'bees=' + n);
}
{
  const w = S.createWorld('venus', 731); // 460° sterilises everything, by measurement
  const mild = S.habitability(w, 32, 25, LIFE.MOSS).find(([k]) => k === 'mild');
  ok('venus reads lethal for moss', mild && mild[1] === false, JSON.stringify(mild));
  const tip = S.habitExplain(S.habitability(w, 32, 25, LIFE.GERMS), 'Germs');
  ok('venus warns germs off', typeof tip === 'string' && tip.length > 8, tip);
}
// Part B: the checklist agrees with reality on a good tile
{
  const w = S.createWorld('earth', 714);
  S.paint(w, 'base', E.SOIL, 32, 25, 4);
  S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
  S.paint(w, 'life', LIFE.GRASS, 32, 25, 2);
  step(w, 5);
  const bad = S.habitability(w, 32, 25, LIFE.GRASS).filter(([, v]) => !v).map(([k]) => k);
  ok('checklist all-green on a good bed', bad.length === 0, 'failing: ' + bad.join(','));
}
// Part C: honest diagnoses where things cannot live
{
  const w = S.createWorld('earth', 715);
  S.paint(w, 'base', E.SOIL, 32, 25, 2); // dry dirt, no water anywhere near
  const damp = S.habitability(w, 32, 25, LIFE.GRASS).find(([k]) => k === 'damp');
  ok('dry dirt reads dry for grass', damp && damp[1] === false, JSON.stringify(damp));
}
{
  const w = S.createWorld('earth', 716);
  S.paint(w, 'base', E.WATER, 32, 25, 2);
  w.sol = 45; // deep night
  const day = S.habitability(w, 32, 25, LIFE.CORAL).find(([k]) => k === 'daylight');
  ok('night reads dark for coral', day && day[1] === false, JSON.stringify(day));
}
{
  const w = S.createWorld('moon', 717); // night cold, no heater
  const mild = S.habitability(w, 32, 25, LIFE.MOSS).find(([k]) => k === 'mild');
  ok('frozen night reads cold for moss', mild && mild[1] === false, JSON.stringify(mild));
}
{
  const w = S.createWorld('earth', 718);
  S.paint(w, 'base', E.SOIL, 32, 25, 2); // no timber anywhere near
  const timber = S.habitability(w, 32, 25, LIFE.TERMITES).find(([k]) => k === 'timber');
  ok('timberless dirt reads bare for termites', timber && timber[1] === false, JSON.stringify(timber));
}
{
  const w = S.createWorld('earth', 719);
  S.paint(w, 'base', E.SOIL, 32, 25, 2);
  w.sol = 15; // open noon, no shade cloth
  const shade = S.habitability(w, 32, 25, LIFE.FERN).find(([k]) => k === 'shade');
  ok('open noon reads exposed for fern', shade && shade[1] === false, JSON.stringify(shade));
}
{
  const w = S.createWorld('earth', 736);
  S.paint(w, 'base', E.SOIL, 32, 25, 3);
  S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
  step(w, 5);
  w.sol = 45; // deep night: perennials persist, so no gate may fail
  const bad = S.habitability(w, 32, 25, LIFE.FLOWER).filter(([, v]) => !v).map(([k]) => k);
  ok('cold night reads viable for flowers', bad.length === 0, 'failing: ' + bad.join(','));
}
// Part E: planting advice names the fix, or stays silent when viable
{
  const w = S.createWorld('europa', 720);
  const tip = S.habitExplain(S.habitability(w, 32, 25, LIFE.SPONGE), 'Sponge');
  ok('sponge on europa ice warns about water', /open water/.test(tip || ''), tip);
}
{
  const w = S.createWorld('moon', 721);
  const tip = S.habitExplain(S.habitability(w, 32, 25, LIFE.GRASS), 'Grass');
  ok('grass on the moon warns first failure', typeof tip === 'string' && tip.length > 8, tip);
}
{
  const w = S.createWorld('earth', 722);
  S.paint(w, 'base', E.SOIL, 32, 25, 4);
  S.paint(w, 'tech', TECH.SPRINKLER, 32, 25, 0);
  step(w, 5);
  ok('good bed gives no warning', S.habitExplain(S.habitability(w, 32, 25, LIFE.GRASS), 'Grass') === null, 'null');
}
// Part D: every lifeform has its needs line for the picker panel
{
  const src = fs.readFileSync(__dirname + '/../app/sandbox.js', 'utf8');
  const m = src.match(/const NEEDS = \{[^}]*\};/);
  const needs = eval('(' + m[0].replace('const NEEDS =', '').replace(/;$/, '') + ')');
  ok('picker names needs for all 22', Object.keys(needs).length === 22, Object.keys(needs).length);
}
console.log(fail ? `\n${fail} HABIT FAILURES (${pass} passed)` : `\nALL ${pass} HABITATS HONEST`);
process.exit(fail ? 1 : 0);
