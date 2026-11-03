/* RED EDEN Sandbox UI: palette, painting, world switching, inspector,
   problems, particles, sounds. Sim lives in simsandbox.js (pure, tested). */
'use strict';
const $ = id => document.getElementById(id);
const TS = 12; // px per cell; grid 64x40 -> 768x480

const PALETTE = [
  { group: 'Ground' },
  { kind: 'base', id: 1, name: 'Regolith', c: '#9a8a7a', sci: 'Ground-up rock blanket. On the Moon it insulates: steady temps inches down.' },
  { kind: 'base', id: 2, name: 'Rock', c: '#5a4a44', sci: 'The yard\u2019s bones. Only acid argues with it.' },
  { kind: 'base', id: 3, name: 'Sand', c: '#d8b25c', sci: 'Falls and flows — in slow motion where gravity is weak. Compare Moon vs Earth.' },
  { kind: 'base', id: 4, name: 'Soil', c: '#7a4d26', sci: 'Life-ready ground: buffers acid, holds water, hosts moss and grass.' },
  { kind: 'base', id: 5, name: 'Ice', c: '#bfe8ff', sci: 'Frozen water. Melts above 0°C — brines cheat lower. Moon ice hides in shadow.' },
  { kind: 'base', id: 6, name: 'Salt', c: '#e8e0d0', sci: 'Perchlorate: Mars poison. Dissolves into brine; germs can learn to eat it.' },
  { kind: 'base', id: 28, name: 'Clay', c: '#c07a45', sci: 'Raw earth: bake it past 400° — fire or lava — and it fires into brick. Pottery is humanity\u2019s first chemistry.' },
  { kind: 'base', id: 34, name: 'Sulfur', c: '#c8a028', sci: 'Burns easily — and hot wet sulfur breathes SO2, turning nearby water to acid rain. Volcano lesson.' },
  { kind: 'base', id: 35, name: 'Fertilizer', c: '#d8c890', sci: 'Plant food: moss, grass and fungus root in it and spread faster. Dissolves in water.' },
  { kind: 'base', id: 37, name: 'Pumice', c: '#a8a49c', sci: 'Frozen froth: porous volcanic rock that floats on water. Real pumice rafts cross oceans.' },
  { kind: 'base', id: 38, name: 'Lead', c: '#6a7280', sci: 'Dense and acid-proof: line spill channels with it. Heavy, soft, faintly sweet — do not lick.' },
  { kind: 'base', id: 39, name: 'Dry ice', c: '#c0d8e4', sci: 'Frozen CO₂: skips melting, breathes straight back into gas. Mars wears polar caps of it.' },
  { kind: 'base', id: 41, name: 'Gravel', c: '#94805e', sci: 'Blast rubble and riverbed: what explosions and erosion leave behind. Falls and piles.' },
  { kind: 'base', id: 42, name: 'Peat', c: '#55502e', sci: 'Bog fuel: waterlogged soil gone peaty. Burns — bogs have burned for months.' },
  { kind: 'base', id: 52, name: 'Granite', c: '#9c8894', sci: 'Continental rock: shrugs off TNT and acid both. Monuments are made of this.' },
  { kind: 'base', id: 53, name: 'Limestone', c: '#a4bcc8', sci: 'Reef rock and chalk cliffs: corals lay it down, kilns burn it into quicklime, acid fizzes it.' },
  { kind: 'base', id: 50, name: 'Dust', c: '#c89888', sci: 'Moon dust is razor glass; Mars dust buries rovers. Wet it and it settles into clay.' },
  { kind: 'base', id: 68, name: 'Vent', c: '#2a2428', sci: 'Alkaline vent: holds 90° in any ice, lays white carbonate chimneys. Lost City — life may have begun at one.' },
  { kind: 'base', id: 69, name: 'Basalt', c: '#5c5650', sci: 'Lava cooled on dry land: tough volcanic stone. Shrugs off TNT and anchors vent chimneys.' },
  { kind: 'base', id: 70, name: 'Permafrost', c: '#6a7a72', sci: 'Soil locked in ice: deep cold freezes bare ground. Thaw it and it releases its water.' },
  { kind: 'base', id: 76, name: 'Mud', c: '#5a6a3a', sci: 'Marsh stage: wet soil goes muddy, mud goes peaty, dry mud sets back. Bake it for adobe brick.' },
  { kind: 'base', id: 72, name: 'Compost', c: '#7a6a52', sci: 'Rich rot: fungus turns some dead wood to compost instead of soil. Wet it and it melts into loam.' },
  { kind: 'base', id: 77, name: 'Sinter', c: '#c8c4b4', sci: 'Geyserite terraces: hot vent water lays silica on sand. Yellowstone grows this.' },
  { kind: 'base', id: 78, name: 'Tuff', c: '#5e4a6e', sci: 'Lithified ash: buried ash compacts into violet tuff. Pompeii is buried in it.' },
  { group: 'Liquids & fire' },
  { kind: 'base', id: 7, name: 'Water', c: '#1d5f8a', sci: 'The boss molecule. On airless noon worlds it flashes straight to steam.' },
  { kind: 'base', id: 8, name: 'Brine', c: '#2d7a5a', sci: 'Salty water liquid down to −30°C. Life\u2019s antifreeze — and germ food.' },
  { kind: 'base', id: 9, name: 'Acid', c: '#b0ff28', sci: 'Dissolves rock and dirt with a fizz. Soil neutralises it — bury spills in dirt.' },
  { kind: 'base', id: 10, name: 'Lava', c: '#ff5a00', sci: 'Quenches to rock in water, torches life, creeps downhill. Handle hot.' },
  { kind: 'base', id: 11, name: 'Steam', c: '#cfd8dc', sci: 'Rises, cools, rains or snows back. The fast lane of the water cycle.' },
  { kind: 'base', id: 13, name: 'Fire', c: '#ff8800', sci: 'Needs fuel + heat + AIR. Burns on Earth, snuffs out on the Moon, works inside domes.' },
  { kind: 'base', id: 14, name: 'Wood', c: '#4e3018', sci: 'Fuel. Plant a forest, strike a match, learn the fire triangle.' },
  { kind: 'base', id: 15, name: 'Oil', c: '#2a2030', sci: 'Floats on water, burns hot and long. Spills spread downhill.' },
  { kind: 'base', id: 16, name: 'Ash', c: '#77716a', sci: 'What fire leaves. Wet it and it sweetens into soil — potash, the old fertiliser.' },
  { kind: 'base', id: 17, name: 'Cloud', c: '#dfe7ea', sci: 'Drifting vapour. Cold turns it back to rain — seed clouds over fields.' },
  { kind: 'base', id: 18, name: 'Snow', c: '#f4fbff', sci: 'Slow-falling water savings account. Melts above 0°C.' },
  { kind: 'base', id: 32, name: 'Cryo', c: '#7fd4ff', sci: 'Liquid nitrogen, −196°C: flash-freezes water on touch, then boils away in seconds. Do not touch.' },
  { kind: 'base', id: 45, name: 'Mercury', c: '#9098a0', sci: 'Liquid metal: sinks through water, conducts heat like copper, poisons whatever it touches.' },
  { kind: 'base', id: 46, name: 'Foam', c: '#b8e8a8', sci: 'Firefighting blanket: smothers flames on contact, floats on water, drains away in minutes.' },
  { kind: 'base', id: 47, name: 'Cement', c: '#b8a894', sci: 'Powder + time = concrete: pour it, wait 40 sols, build blast walls.' },
  { kind: 'base', id: 48, name: 'Sawdust', c: '#8a5c30', sci: 'Milled timber: catches fire fast; termites chew wood back into it.' },
  { kind: 'base', id: 49, name: 'Coal', c: '#1a1a1c', sci: 'Fossil sunshine: needs real heat to catch, then burns long and hot.' },
  { kind: 'base', id: 51, name: 'Hail', c: '#7aa8c8', sci: 'Ice that falls in summer: melts into spring water on warm ground.' },
  { kind: 'base', id: 73, name: 'Slush', c: '#5a98b8', sci: 'Half-melt: ice stages through slush on the way to water, and refreezes at night.' },
  { kind: 'base', id: 74, name: 'Ember', c: '#2a1408', sci: 'Banked coals: fires die back to embers on fuel beds. They hold 450° and rekindle — or drown.' },
  { kind: 'base', id: 75, name: 'Phosphorus', c: '#e8e4a8', sci: 'Spontaneous fire: ignites near 30°C in air, stockpiles safe in vacuum. Matches are made of this.' },
  { group: 'Air & boom' },
  { kind: 'base', id: 23, name: 'Hydrogen', c: '#e8b0ff', sci: 'Rises fast, explodes with fire — burnt gas becomes water. The Hindenburg lesson.' },
  { kind: 'base', id: 24, name: 'Oxygen', c: '#9fd8ff', sci: 'Painted air. Lets fire and grass survive where planets offer no atmosphere.' },
  { kind: 'base', id: 25, name: 'Methane', c: '#c8d8a0', sci: 'Mars burps this mysteriously (Curiosity). Flammable — handle away from sparks.' },
  { kind: 'base', id: 30, name: 'Gunpowder', c: '#5a5a5e', sci: 'Saltpetre + charcoal + sulphur: sparks turn it into a small bomb, and it chains. Respect it.' },
  { kind: 'base', id: 31, name: 'Helium', c: '#d8f4ff', sci: 'Rises fast, burns never — the anti-hydrogen. Inert gas: balloons, MRI machines, coolant.' },
  { kind: 'base', id: 36, name: 'CO2', c: '#d0ccc2', sci: 'Heavy air: sinks, pools in pits, smothers flames. This is most of what Mars breathes.' },
  { kind: 'base', id: 43, name: 'Nitrogen', c: '#a8a4d8', sci: '78% of Earth air: an inert blanket that smothers flames like CO₂.' },
  { kind: 'base', id: 44, name: 'Chlorine', c: '#d8ff80', sci: 'Gas warfare and pool cleaner in one: kills germs, dissolves into bleach in water.' },
  { kind: 'base', id: 22, name: 'TNT', c: '#cc2222', sci: 'Detonates on heat, fire or lava — and chains to neighbours. Landscaping tool.' },
  { kind: 'base', id: 26, name: 'Sun', c: '#fff3a0', sci: 'A pinned star: 1500°, ignites fuel for squares around. Do not hug.' },
  { group: 'Solids' },
  { kind: 'base', id: 19, name: 'Glass', c: '#bfe8e8', sci: 'Bake sand past 800° and it vitrifies. Acid cannot touch glass.' },
  { kind: 'base', id: 20, name: 'Metal', c: '#a8b0b8', sci: 'Carries heat three times faster than rock. Rusts in water + air — like Mars itself.' },
  { kind: 'base', id: 21, name: 'Rust', c: '#8a3a1a', sci: 'Oxidised metal. Mars is red for exactly this reason.' },
  { kind: 'base', id: 27, name: 'Concrete', c: '#8d8d94', sci: 'Poured stone: shrugs off TNT next door, but acid still eats it. Build blast walls.' },
  { kind: 'base', id: 29, name: 'Brick', c: '#9a3a28', sci: 'Fired clay masonry: acid-proof. Build spill channels with it.' },
  { kind: 'base', id: 40, name: 'Sandstone', c: '#c8a878', sci: 'Lithified beach: wet sand settled into stone. Canyon walls are made of this.' },
  { kind: 'base', id: 33, name: 'Obsidian', c: '#3a4552', sci: 'Volcanic glass: lava quenched fast against ice. Acid-proof, but blasts shatter it.' },
  { kind: 'base', id: 54, name: 'Lime', c: '#cfc8b4', sci: 'Quicklime: limestone calcined. Add water and it slakes violently hot — Rome ran on this.' },
  { kind: 'base', id: 55, name: 'Charcoal', c: '#45453e', sci: 'Half-burnt wood: fuel, brine filter, and half the gunpowder recipe.' },
  { kind: 'base', id: 56, name: 'Copper', c: '#b06628', sci: 'First metal: smelt it from green ore in a kiln. Conducts heat; acid etches it.' },
  { kind: 'base', id: 57, name: 'Uranium', c: '#6a8a3a', sci: 'Warm to the touch, always: hard radiation kills nearby life. Handle with robots.' },
  { kind: 'base', id: 58, name: 'Paper', c: '#ded2b8', sci: 'Pressed plant: burns fast, acid eats it, termites love it.' },
  { kind: 'base', id: 59, name: 'Saltpetre', c: '#9cb8a4', sci: 'Niter: feeds plants like fertilizer — and with charcoal becomes gunpowder.' },
  { kind: 'base', id: 60, name: 'Chalk', c: '#f0f0ea', sci: 'Writeable limestone: fizzes in acid, calcines in a kiln. Cliffs of Dover approved.' },
  { kind: 'base', id: 61, name: 'Quartz', c: '#d8e0e8', sci: 'Crystal sand: fires into glass easier than sand. Watches tick on this.' },
  { kind: 'base', id: 62, name: 'Copper ore', c: '#6e4f3e', sci: 'Green rock, red future: smelt it in a kiln for copper — the Chalcolithic in one tile.' },
  { kind: 'base', id: 63, name: 'Wax', c: '#e8c848', sci: 'Melts before it burns: phase change first, fuel second. Bees knew.' },
  { kind: 'base', id: 64, name: 'Amber', c: '#c07818', sci: 'Fossil resin: burns, shrugs off acid, outlives dinosaurs.' },
  { kind: 'base', id: 65, name: 'Seed', c: '#3a2a18', sci: 'A grass in waiting: drops on wet soil and sprouts. Agriculture in one tile.' },
  { kind: 'base', id: 66, name: 'Rubber', c: '#2e2e38', sci: 'Heat insulator: wrap kilns in it. Burns if you insist.' },
  { kind: 'base', id: 67, name: 'Bone', c: '#a8906c', sci: 'Slow phosphorus: buried bone feeds soil for seasons. Burnt bone is just ash.' },
  { kind: 'base', id: 71, name: 'Steel', c: '#7a90a8', sci: 'Bloomery steel: smelt metal with coal past 400°. Rust-proof, blast-proof, acid-proof.' },
  { group: 'Energy' },
  { kind: 'temp', id: 1, name: 'Heat ray', c: '#ff2222', sci: 'Cook any spot +150°. Demonstrates conduction: watch warmth crawl through rock.' },
  { kind: 'temp', id: -1, name: 'Cool ray', c: '#2288ff', sci: 'Chill any spot −150°. Freeze lakes mid-summer, feel heat flow back.' },
  { group: 'Life' },
  { kind: 'life', id: 1, name: 'Germs', c: '#A3E635', sci: 'Hardiest life: needs damp, mild temps, UV shelter. Eats brine; evolves.' },
  { kind: 'life', id: 2, name: 'Moss', c: '#3fae4a', sci: 'Pioneer plant: spreads over wet ground, rides out noon if sopping, needs heat at night.' },
  { kind: 'life', id: 3, name: 'Grass', c: '#57d465', sci: 'Needs real air, soil, water, mild temps. Earth: easy. Elsewhere: domes or death.' },
  { kind: 'life', id: 4, name: 'Algae', c: '#4ae08a', sci: 'Grows in sunlit water, spreads on its own. Earth\u2019s first oxygen came from things like this.' },
  { kind: 'life', id: 5, name: 'Fungus', c: '#c8b060', sci: 'Decomposer: spreads over damp dead wood and ash, needs no light, fears UV. Nature\u2019s recycler.' },
  { kind: 'life', id: 6, name: 'Lichen', c: '#9ccb8a', sci: 'Pioneer: a fungus plus an alga in one body, colonising bare rock in the light. First green on dead worlds.' },
  { kind: 'life', id: 7, name: 'Locusts', c: '#4a8a2a', sci: 'The swarm: strips meadows bare, then starves without prey. Boom and bust, the predator cycle.' },
  { kind: 'life', id: 8, name: 'Coral', c: '#ff6a8a', sci: 'Reef-builder: warm lit shallows only; heat and acid bleach it, limestone grows below.' },
  { kind: 'life', id: 9, name: 'Cactus', c: '#2a7a3a', sci: 'Desert succulent: needs heat, never water, fears frost. Carries its own canteen.' },
  { kind: 'life', id: 10, name: 'Sponge', c: '#b84818', sci: 'Living filter: drinks foam and silt, keeps pools clear.' },
  { kind: 'life', id: 11, name: 'Fern', c: '#3a8a5a', sci: 'Shade plant: grows under cloth or at night — coal forests were built of these.' },
  { kind: 'life', id: 12, name: 'Worms', c: '#b86a5a', sci: 'Soil engineers: burrow and cast — every tunnel is fertilizer.' },
  { kind: 'life', id: 13, name: 'Termites', c: '#e8e0c0', sci: 'Wood-eaters: chew timber to sawdust, starve without it. Recyclers with teeth.' },
  { group: 'Tech' },
  { kind: 'tech', id: 1, name: 'Heater', c: '#FFB000', sci: 'Holds +20°C nearby through any night. Survival in a box.' },
  { kind: 'tech', id: 2, name: 'Dome', c: '#2DD4BF', sci: 'Sealed greenhouse: blocks UV, traps heat, carries its own air.' },
  { kind: 'tech', id: 3, name: 'Sprinkler', c: '#38bdf8', sci: 'Irrigation: keeps a disc of ground soaked. Ferns and moss approve.' },
  { kind: 'tech', id: 4, name: 'Shade', c: '#57534e', sci: 'Shade cloth: bleeds ~13° off noon heat. Ferns grow under it.' },
  { kind: 'tech', id: 5, name: 'Kiln', c: '#c2410c', sci: 'Pottery kiln: holds ~500° — fires clay, calcines lime, smelts copper ore. Not sand.' },
  { kind: 'tech', id: 6, name: 'Scarecrow', c: '#a16207', sci: 'The old straw man: clears locusts six squares around. No poison needed.' },
  { group: 'Tools' },
  { kind: 'erase', id: 0, name: 'Eraser', c: '#444444', sci: 'Vaporise a spot. No science, just satisfaction.' },
];
const TINT = { // world-tinted ground
  earth: { 1: '#7a5a3a', 3: '#c89858' },
  moon: { 1: '#8a8a92', 3: '#b8b8c0' },
  mars: { 1: '#a14a26', 3: '#c87a3a' },
  europa: { 1: '#9fb2b8', 3: '#d8e4e8' },
  hadean: { 1: '#4a3438', 3: '#5a4a3a' },
};
const ENV_BLURB = {
  earth: 'EARTH — the control. O₂ air, mild sun, stable water. Learn the tools here. (Problems: Meadow, Acid spill, Kiln, Compost, Swarm, Quicklime, Straw guardian, Reef, Web of life.)',
  moon: 'MOON — vacuum, +120/−130°C swings (Diviner), fierce UV, shadow ice (LCROSS). Heaters + domes or nothing lives. (Problems: Ice harvest, Night greenhouse, Heavy air, Glass house.)',
  mars: 'MARS — thin CO₂, equatorial summer site, UV 0.55, perchlorate patches (Phoenix). Brines persist; eaters evolve. (Problems: De-poison, Bloom, Dome bloom, First footprints.)',
  europa: 'EUROPA — ice crust, salty chaos brines, Jupiter radiation. Meltwater is life’s only door. (Problems: Meltwater, Brine garden, Warm pool, White smoker.)',
  hadean: 'HADEAN EARTH — lava vents, sulfur skies, no oxygen. Brew acid, garden heat. (Problems: Acid pond, Hot garden, Glass shore, Shade garden, Primordial soup, Genesis.)',
};
// progression: research points buy ranks; ranks unlock worlds. Materials stay free forever.
const QUEST_RP = { E1: 100, E2: 100, M1: 100, M2: 100, R1: 100, R2: 100,
  E3: 150, M3: 150, R3: 150, U1: 150, U2: 150, H1: 150, H2: 150, E5: 150,
  E6: 150, E7: 150, E8: 150, U3: 150, U4: 150, H3: 150,
  H4: 250, E9: 250, H5: 150, H6: 250,
  E4: 250, M4: 250, R4: 250 };
const RANKS = [{ rp: 0, name: 'Undergrad' }, { rp: 400, name: 'Grad student' }, { rp: 1000, name: 'Principal investigator' }];
const UNLOCK_RP = { europa: 400, hadean: 1000 };
function getRP() {
  try { return +(localStorage.getItem('sandbox_rp_total') || 0); } catch (e) { return 0; }
}
function claimedQuests() {
  try { return JSON.parse(localStorage.getItem('sandbox_rp_claimed') || '[]'); } catch (e) { return []; }
}
function addRP(n, why) {
  let total = getRP() + n;
  try { localStorage.setItem('sandbox_rp_total', total); } catch (e) {}
  const before = rankFor(total - n), after = rankFor(total);
  say(`+${n} RP — ${why} (total ${total})`);
  if (after.name !== before.name) {
    say(`Promotion: ${after.name}! ${after.name === 'Grad student' ? 'Europa unlocks.' : 'Hadean Earth unlocks.'}`);
    beep(523, 0.1); beep(659, 0.1, 'square', 0.03, 0.1); beep(784, 0.16, 'square', 0.03, 0.2);
  }
  return total;
}
function rankFor(rp) {
  let r = RANKS[0];
  for (const k of RANKS) if (rp >= k.rp) r = k;
  return r;
}
function isUnlocked(id) {
  if (!UNLOCK_RP[id]) return true;
  return getRP() >= UNLOCK_RP[id];
}

let world = createWorld('mars', (Math.random() * 1e9) | 0);
let tool = PALETTE[1], brush = 2, paused = false, speed = 1, started = false;
let particles = [], cursor = null, painting = false, muted = false, AC = null;
const canvas = $('sandbox'), ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

function beep(f, d, type, v, when) {
  if (muted) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'square'; o.frequency.value = f; g.gain.value = v || 0.025;
    o.connect(g); g.connect(AC.destination);
    const t = AC.currentTime + (when || 0);
    o.start(t); o.stop(t + d);
  } catch (e) {}
}
const say = m => { $('ticker').textContent = m; };
// a voice per reaction family: water sings high, fire growls low, life chimes,
// chemistry fizzes, earth thumps, and genesis gets its rising arpeggio
const SFX = {
  steam: [[880, .06, 'sine', .02]], rain: [[1100, .05, 'sine', .015]],
  frost: [[1320, .06, 'sine', .018]], melt: [[440, .08, 'triangle', .02]],
  dissolve: [[700, .06, 'triangle', .02]], filter: [[760, .06, 'sine', .018]],
  burst: [[220, .12, 'sawtooth', .03], [440, .1, 'square', .02, .05]],
  ignite: [[180, .1, 'sawtooth', .03]], scorch: [[140, .12, 'sawtooth', .03]],
  boom: [[90, .3, 'square', .04], [60, .35, 'sawtooth', .03, .05]],
  fizz: [[1200, .05, 'square', .015], [1500, .05, 'square', .015, .04]],
  hiss: [[1400, .08, 'sawtooth', .015]], sour: [[500, .06, 'square', .018], [380, .08, 'square', .018, .05]],
  clean: [[660, .07, 'sine', .02], [880, .07, 'sine', .02, .06]],
  rust: [[300, .07, 'sawtooth', .02]], glaze: [[990, .08, 'sine', .02]],
  snuff: [[500, .08, 'sine', .02], [350, .1, 'sine', .02, .05]],
  smelt: [[350, .1, 'square', .025], [520, .1, 'square', .02, .06]],
  smoker: [[300, .1, 'triangle', .025], [450, .12, 'triangle', .02, .07]],
  cool: [[330, .08, 'triangle', .025]], mud: [[200, .07, 'triangle', .022]],
  bake: [[240, .09, 'triangle', .025]], set: [[280, .08, 'triangle', .025]],
  cure: [[260, .09, 'triangle', .025]], mix: [[400, .05, 'square', .018]],
  reef: [[600, .08, 'sine', .02], [800, .1, 'sine', .02, .06]],
  cast: [[340, .07, 'triangle', .022]],
  sprout: [[520, .07, 'sine', .02], [780, .09, 'sine', .02, .06]],
  feed: [[520, .06, 'sine', .02]], perish: [[260, .1, 'sine', .02]],
  wither: [[420, .12, 'sine', .018], [300, .14, 'sine', .018, .08]],
  rot: [[180, .1, 'triangle', .022]],
  nibble: [[600, .04, 'square', .015], [750, .04, 'square', .015, .03]],
  flee: [[900, .05, 'square', .015], [700, .05, 'square', .015, .04], [500, .06, 'square', .015, .08]],
  gnaw: [[250, .05, 'sawtooth', .02], [200, .05, 'sawtooth', .02, .04]],
  sublime: [[990, .05, 'sine', .015], [1320, .06, 'sine', .015, .04]],
  genesis: [[523, .12, 'sine', .03], [659, .12, 'sine', .03, .1], [784, .2, 'sine', .03, .2]],
};
function playSfx(kind) {
  const notes = SFX[kind];
  if (!notes) return;
  for (const [f, d, type, v, when] of notes) beep(f, d, type, v, when);
}
function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

let pcat = 'Ground'; // active picker category; items stay addressable when hidden
function buildPalette() {
  const nav = $('palette');
  nav.innerHTML = '';
  const tabs = document.createElement('div');
  tabs.className = 'tabs';
  [...new Set(PALETTE.filter(p => p.group).map(p => p.group))].forEach(c => {
    const t = document.createElement('button');
    t.className = 'tab' + (c === pcat ? ' on' : '');
    t.textContent = c;
    t.onclick = () => { pcat = c; beep(520, 0.05); buildPalette(); };
    tabs.appendChild(t);
  });
  nav.appendChild(tabs);
  let cur = null;
  const q = (($('pfilter') && $('pfilter').value) || '').toLowerCase();
  PALETTE.forEach(p => {
    if (p.group) { cur = p.group; return; }
    const b = document.createElement('button');
    b.className = 'el' + (p === tool ? ' sel' : '');
    if (q ? !p.name.toLowerCase().includes(q) : cur !== pcat) b.style.display = 'none';
    b.innerHTML = `<span class="sw" style="background:${p.c}"></span><span><b>${p.name}</b><small>${p.kind}</small></span>`;
    b.title = p.sci;
    b.onclick = () => { tool = p; beep(520, 0.05); showTool(p); buildPalette(); };
    nav.appendChild(b);
  });
}

function paintAt(ev) {
  const r = canvas.getBoundingClientRect();
  const x = ((ev.clientX - r.left) / r.width * GW) | 0;
  const y = ((ev.clientY - r.top) / r.height * GH) | 0;
  cursor = { x, y };
  if (!inGb(x, y)) return;
  const msg = paint(world, tool.kind, tool.id, x, y, brush);
  if (msg) say(msg);
}
const inGb = (x, y) => x >= 0 && y >= 0 && x < GW && y < GH;
canvas.addEventListener('pointerdown', ev => {
  painting = true; canvas.setPointerCapture(ev.pointerId); paintAt(ev); beep(500, 0.05);
});
canvas.addEventListener('pointermove', ev => {
  const r = canvas.getBoundingClientRect();
  cursor = { x: ((ev.clientX - r.left) / r.width * GW) | 0,
             y: ((ev.clientY - r.top) / r.height * GH) | 0 };
  if (painting) paintAt(ev);
  inspect(cursor.x, cursor.y);
});
canvas.addEventListener('pointerup', () => { painting = false; });
canvas.addEventListener('pointerleave', () => { cursor = null; painting = false; });

const ELNAME = ['empty', 'regolith', 'rock', 'sand', 'soil', 'ice', 'salt (perchlorate)',
  'water', 'brine', 'acid', 'lava', 'steam', 'smoke', 'fire', 'wood', 'oil', 'ash', 'cloud', 'snow',
  'glass', 'metal', 'rust', 'TNT', 'hydrogen', 'oxygen', 'methane', 'sun',
  'concrete', 'clay', 'brick', 'gunpowder', 'helium', 'cryo', 'obsidian',
  'sulfur', 'fertilizer', 'CO2', 'pumice', 'lead',
  'dry ice', 'sandstone', 'gravel', 'peat',
  'nitrogen', 'chlorine', 'mercury', 'foam', 'cement', 'sawdust', 'coal',
  'dust', 'hail', 'granite', 'limestone', 'lime', 'charcoal', 'copper',
  'uranium', 'paper', 'saltpetre', 'chalk', 'quartz', 'copper ore', 'wax',
  'amber', 'seed', 'rubber', 'bone',
  'vent', 'basalt', 'permafrost', 'steel', 'compost', 'slush',
  'ember', 'phosphorus', 'mud', 'sinter', 'tuff'];
const LIFENAME = ['no life', 'germs', 'moss', 'grass', 'algae', 'fungus', 'lichen', 'locusts',
  'coral', 'cactus', 'sponge', 'fern', 'worms', 'termites'];
function inspect(x, y) {
  if (!inGb(x, y)) return;
  const i = gidx(x, y);
  const t = Math.round(world.pt[i]);
  let html = `<b>${ELNAME[world.el[i]]}</b> · ${t}°C · wet ${(world.wet[i] * 100) | 0}%`;
  if (world.life[i]) html += ` · <b>${LIFENAME[world.life[i]]}</b> (${world.lifeAmt[i] | 0})`;
  if (world.tech[i] === 1) html += ' · <b>heater</b>';
  if (world.tech[i] === 2) html += ' · <b>dome</b>';
  if (world.tech[i] === 3) html += ' · <b>sprinkler</b>';
  if (world.tech[i] === 4) html += ' · <b>shade</b>';
  if (world.tech[i] === 5) html += ' · <b>kiln</b>';
  if (world.tech[i] === 6) html += ' · <b>scarecrow</b>';
  const meta = [...PALETTE].reverse().find(p =>
    (p.kind === 'base' && p.id === world.el[i]) ||
    (p.kind === 'life' && p.id === world.life[i]));
  html += `<br><span class="sci">${meta ? meta.sci : 'Bare vacuum-ready ground.'}</span>`;
  $('inspect').innerHTML = html;
}

const BASEC = { 0: '#060403', 1: '#9a8a7a', 2: '#4a3430', 3: '#d8b25c', 4: '#7a4d26',
  5: '#bfe8ff', 6: '#e8e0d0', 7: '#1d5f8a', 8: '#2d7a5a', 9: '#7fae00', 10: '#ff5a00',
  11: '#9aa5ab', 12: '#555049', 13: '#ff8800', 14: '#4e3018', 15: '#241c2e',
  16: '#77716a', 17: '#dfe7ea', 18: '#f4fbff', 19: '#9fc8c8', 20: '#a8b0b8',
  21: '#8a3a1a', 22: '#cc2222', 23: '#e8b0ff', 24: '#9fd8ff', 25: '#c8d8a0',
  26: '#fff3a0', 27: '#8d8d94', 28: '#c07a45', 29: '#9a3a28', 30: '#5a5a5e',
  31: '#d8f4ff', 32: '#7fd4ff', 33: '#3a4552', 34: '#c8a028', 35: '#d8c890',
  36: '#d0ccc2', 37: '#a8a49c', 38: '#6a7280', 39: '#c0d8e4', 40: '#c8a878',
  41: '#94805e', 42: '#55502e', 43: '#a8a4d8', 44: '#d8ff80', 45: '#9098a0',
  46: '#b8e8a8', 47: '#b8a894', 48: '#8a5c30', 49: '#1a1a1c', 50: '#c89888',
  51: '#7aa8c8', 52: '#9c8894', 53: '#a4bcc8', 54: '#cfc8b4', 55: '#45453e',
  56: '#b06628', 57: '#6a8a3a', 58: '#ded2b8', 59: '#9cb8a4', 60: '#f0f0ea',
  61: '#d8e0e8', 62: '#6e4f3e', 63: '#e8c848', 64: '#c07818', 65: '#3a2a18',
  66: '#2e2e38', 67: '#a8906c', 68: '#2a2428',
  69: '#5c5650', 70: '#6a7a72', 71: '#7a90a8', 72: '#7a6a52', 73: '#5a98b8',
  74: '#2a1408', 75: '#e8e4a8', 76: '#5a6a3a', 77: '#c8c4b4', 78: '#5e4a6e' };

let view = 0; // 0 normal, 1 heat vision
/* Single-blit renderer: every tile texture below writes into one full-canvas
   pixel buffer (opaque R0 / blended RA, same conditions and colours as the
   old fillRect code), then one putImageData lands it. Tint, particles,
   dome arcs and cursor stay canvas calls after the blit. */
const HC_COLD = [4, 26, 90], HC_ICE = [10, 42, 138], HC_MID = [20, 20, 20],
  HC_WARM = [161, 74, 0], HC_HOT = [221, 34, 0], HC_MAX = [255, 233, 160];
function heatRGB(t) {
  return t < -50 ? HC_COLD : t < 0 ? HC_ICE : t < 30 ? HC_MID : t < 100 ? HC_WARM : t < 400 ? HC_HOT : HC_MAX;
}
const WHITE = [255, 255, 255], BLACK = [0, 0, 0];
const RGBC = {};
function rgb(h) {
  let c = RGBC[h];
  if (!c) { const n = parseInt(h.slice(1), 16); c = RGBC[h] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  return c;
}
let imgBuf = null; // reused full-canvas buffer: no per-frame allocation
function R0(x0, y0, w, h, c) { // opaque pixel rect
  const d = imgBuf.data, W = imgBuf.width, H = imgBuf.height;
  const xa = Math.max(0, x0 | 0), ya = Math.max(0, y0 | 0);
  const xb = Math.min(W, xa + (w | 0)), yb = Math.min(H, ya + (h | 0));
  for (let y = ya; y < yb; y++) {
    let o = (y * W + xa) * 4;
    for (let x = xa; x < xb; x++, o += 4) { d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255; }
  }
}
function RA(x0, y0, w, h, c, a) { // alpha-blended pixel rect, canvas-rgba maths
  const d = imgBuf.data, W = imgBuf.width, H = imgBuf.height;
  const xa = Math.max(0, x0 | 0), ya = Math.max(0, y0 | 0);
  const xb = Math.min(W, xa + (w | 0)), yb = Math.min(H, ya + (h | 0));
  const b = 1 - a;
  for (let y = ya; y < yb; y++) {
    let o = (y * W + xa) * 4;
    for (let x = xa; x < xb; x++, o += 4) {
      d[o] = c[0] * a + d[o] * b; d[o + 1] = c[1] * a + d[o + 1] * b; d[o + 2] = c[2] * a + d[o + 2] * b;
    }
  }
}
function draw() {
  const { T, day, dl } = worldTemp(world);
  const tint = TINT[world.id] || {};
  const W = GW * TS, H = GH * TS;
  if (!imgBuf || imgBuf.width !== W || imgBuf.height !== H) imgBuf = ctx.createImageData(W, H);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const i = gidx(x, y), e = world.el[i], px = x * TS, py = y * TS;
    let c = view === 1 ? heatRGB(world.pt[i]) : rgb(tint[e] || BASEC[e]);
    if (e === 1 || e === 3 || e === 4 || e === 28 || e === 34) {
      const v = ((hash2(x, y) * 16) | 0) - 8, b = rgb(tint[e] || BASEC[e]);
      const cl = q => Math.max(0, Math.min(255, q + v)) | 0;
      c = [cl(b[0]), cl(b[1]), cl(b[2])];
    }
    R0(px, py, TS, TS, c);
    if ((e === 4 || e === 1) && world.wet[i] > 0.35) {
      RA(px, py, TS, TS, [15, 30, 60], 0.4 * world.wet[i]);
    }
    if (e === 6) { // salt glint
      if (hash2(x + 3, y) > 0.6) RA(px + 2, py + 2, 3, 2, WHITE, 0.5);
    }
    if (e === 7) { // water shimmer
      if ((world.sol + x + y) % 2) RA(px, py + ((world.sol + x) % 2 ? 2 : 8), TS, 2, WHITE, 0.22);
      else RA(px, py + ((world.sol + x) % 2 ? 2 : 8), TS, 2, BLACK, 0.18);
    }
    if (e === 9 && (world.sol + x * 2 + y) % 3 === 0) { // acid fizz
      R0(px + 3, py + 3, 2, 2, rgb('#eaffb0'));
    }
    if (e === 10) { // lava glow pulse
      const p = 0.5 + 0.5 * Math.sin(world.sol * 0.8 + x + y);
      RA(px + 1, py + 1, TS - 2, TS - 2, [255, 220, 80], 0.35 * p);
    }
    if (e === 5 && (x + y + (world.sol >> 2)) % 2 === 0) {
      R0(px + 4, py + 4, 2, 2, WHITE);
    }
    if (e === 13) { // fire flicker
      const p = hash2(x + world.sol, y * 3 + 1);
      R0(px + 2, py + 2, TS - 4, TS - 4, rgb(p > 0.66 ? '#ffdd55' : (p > 0.33 ? '#ff8800' : '#dd2200')));
      R0(px + 4, py + 7, 4, 3, rgb('#fff8d0'));
    }
    if (e === 14) { // timber planks: dark boards, light seams
      R0(px + 2, py + 1, 2, TS - 2, rgb('#a5763a'));
      R0(px + 8, py + 1, 2, TS - 2, rgb('#a5763a'));
      RA(px + 2, py + 5 + ((x * 3 + y) % 4), TS - 4, 1, BLACK, 0.4);
    }
    if (e === 15) { // oil sheen
      RA(px, py + 2 + ((world.sol >> 3) % 6), TS, 2, [150, 80, 200], 0.28);
    }
    if (e === 17) { // cloud puff
      RA(px + 2, py + 3, TS - 4, 5, WHITE, 0.5);
    }
    if (e === 18 && (x + y) % 2 === 0) { // snow glint
      R0(px + 5, py + 5, 2, 2, WHITE);
    }
    if (e === 19) { // glass shine
      RA(px + 2, py + 2, 8, 2, WHITE, 0.6);
    }
    if (e === 20) { // metal sheen
      RA(px + 2, py + 2 + ((x + y) % 6), TS - 4, 2, WHITE, 0.35);
    }
    if (e === 22) { // TNT band
      R0(px + 1, py + 5, TS - 2, 3, rgb('#7a1010'));
      R0(px + 5, py + 5, 2, 3, rgb('#ffd0d0'));
    }
    if (e === 26) { // sun corona flicker
      const p = hash2(x * 3 + world.sol, y * 5);
      R0(px + 1, py + 1, TS - 2, TS - 2, rgb(p > 0.5 ? '#fff9d0' : '#ffe970'));
      R0(px + 4, py + 4, 4, 4, WHITE);
    }
    if (e === 27 && hash2(x * 7, y * 3) > 0.55) { // concrete aggregate
      R0(px + 3, py + 4, 3, 2, rgb('#6a6a72'));
      R0(px + 7, py + 8, 2, 2, rgb('#6a6a72'));
    }
    if (e === 29) { // brick courses
      const bc = rgb('#d8b090');
      R0(px + 1, py + 5, TS - 2, 1, bc);
      R0(px + 1, py + 10, TS - 2, 1, bc);
      R0(px + 5 + ((y % 2) * 3), py + 1, 1, TS - 2, bc);
    }
    if (e === 30 && hash2(x * 3, y * 7) > 0.5) { // saltpetre glint in powder
      R0(px + 4, py + 4, 2, 2, rgb('#8a8478'));
    }
    if (e === 32) { // cryo shimmer + fume
      RA(px + 2, py + ((world.sol + x) % 2 ? 3 : 7), TS - 4, 2, WHITE, 0.5);
    }
    if (e === 33) { // obsidian edge-gleam
      RA(px + 2, py + 8, 8, 1, [190, 220, 255], 0.55);
      RA(px + 8, py + 2, 1, 6, [190, 220, 255], 0.55);
    }
    if (e === 35 && hash2(x * 9, y * 4) > 0.5) { // fertiliser grains
      const fg = rgb('#a89868');
      R0(px + 3, py + 5, 2, 2, fg);
      R0(px + 8, py + 3, 2, 2, fg);
    }
    if (e === 36) { // CO2 pools low: dense band at the foot
      R0(px + 2, py + 8, TS - 4, 3, rgb('#b0aa9c'));
    }
    if (e === 37 && hash2(x * 4, y * 9) > 0.45) { // pumice pores
      const pp = rgb('#5a564f');
      R0(px + 3, py + 3, 2, 2, pp);
      R0(px + 7, py + 7, 3, 2, pp);
    }
    if (e === 38) { // lead: dull sheen, dark seams
      RA(px + 2, py + 3, TS - 4, 2, WHITE, 0.28);
      RA(px + 2, py + 8, TS - 4, 1, BLACK, 0.35);
    }
    if (e === 39 && hash2(x * 6, y * 2) > 0.35) { // dry-ice vapour wisps
      const dw = WHITE;
      RA(px + 3, py + 2, 6, 2, dw, 0.75);
      RA(px + 5, py + 8, 4, 2, dw, 0.75);
    }
    if (e === 40) { // sandstone strata
      const ss = rgb('#8a6a48');
      R0(px + 1, py + 4, TS - 2, 1, ss);
      R0(px + 1, py + 9, TS - 2, 1, ss);
    }
    if (e === 41 && hash2(x * 2, y * 8) > 0.4) { // gravel chunks
      const gc = rgb('#4a4238');
      R0(px + 2, py + 3, 3, 3, gc);
      R0(px + 7, py + 6, 3, 3, gc);
    }
    if (e === 42) { // peat fibre strokes
      const pf = rgb('#2a2016');
      R0(px + 2, py + 4, TS - 4, 1, pf);
      R0(px + 2, py + 8, TS - 6, 1, pf);
    }
    if (e === 23 || e === 24 || e === 25 || e === 31 || e === 43 || e === 44) { // gas wisps
      if (hash2(x, y + world.sol) > 0.5) RA(px + 3, py + 4, 6, 3, WHITE, 0.35);
    }
    if (e === 45 && hash2(x * 3, y * 7) > 0.5) { // mercury glint
      RA(px + 3, py + 3, 3, 2, WHITE, 0.8);
    }
    if (e === 46 && hash2(x * 7, y * 3) > 0.4) { // foam bubbles
      const fb = WHITE;
      RA(px + 2, py + 3, 2, 2, fb, 0.7);
      RA(px + 7, py + 7, 3, 2, fb, 0.7);
    }
    if (e === 48) { // sawdust streaks
      const sd = rgb('#6a4520');
      R0(px + 2, py + 5, TS - 4, 1, sd);
      R0(px + 3, py + 9, TS - 6, 1, sd);
    }
    if (e === 49 && hash2(x * 5, y * 5) > 0.6) { // coal glint
      R0(px + 4, py + 4, 2, 2, rgb('#5a5a60'));
    }
    if (e === 52) { // granite salt-and-pepper
      R0(px + 2, py + 3, 2, 2, rgb('#c4b4c2'));
      R0(px + 7, py + 7, 2, 2, rgb('#4a3a44'));
    }
    if (e === 53 && hash2(x * 3, y * 5) > 0.55) { // limestone shell flecks
      R0(px + 3, py + 4, 3, 2, rgb('#e4f0f4'));
    }
    if (e === 55 && hash2(x * 7, y * 7) > 0.6) { // charcoal cracks
      R0(px + 2, py + 6, TS - 4, 1, rgb('#1a1512'));
    }
    if (e === 56 && hash2(x * 3, y * 3) > 0.5) { // copper shine
      R0(px + 3, py + 3, 3, 2, rgb('#e8a858'));
    }
    if (e === 57 && ((world.sol >> 2) + x + y) % 2) { // uranium hot shimmer
      RA(px + 2, py + 2, 3, 3, [220, 255, 120], 0.5);
    }
    if (e === 58) { // paper ruling
      const pr = rgb('#8a7a5a');
      R0(px + 1, py + 4, TS - 2, 1, pr);
      R0(px + 1, py + 8, TS - 2, 1, pr);
    }
    if (e === 59 && hash2(x * 5, y * 3) > 0.5) { // saltpetre needles
      R0(px + 3, py + 2, 1, 4, WHITE);
      R0(px + 7, py + 6, 1, 4, WHITE);
    }
    if (e === 61 && hash2(x * 3, y * 7) > 0.5) { // quartz facet
      R0(px + 4, py + 3, 2, 3, WHITE);
    }
    if (e === 62 && hash2(x * 7, y * 5) > 0.5) { // copper-ore green flecks
      const co = rgb('#3a8a5a');
      R0(px + 3, py + 4, 3, 2, co);
      R0(px + 7, py + 8, 2, 2, co);
    }
    if (e === 64 && hash2(x * 5, y * 7) > 0.5) { // amber-trapped glow
      R0(px + 5, py + 5, 2, 2, rgb('#ffe89a'));
    }
    if (e === 65) { // seed dots
      const sd2 = rgb('#1a1008');
      R0(px + 3, py + 4, 2, 2, sd2);
      R0(px + 7, py + 7, 2, 2, sd2);
    }
    if (e === 68) { // vent: warm glowing throat in dark basalt
      R0(px + 4, py + 3, 4, 3, rgb('#ff7a20'));
      R0(px + 5, py + 7, 2, 3, rgb('#ffb060'));
    }
    if (e === 69 && hash2(x * 4, y * 9) > 0.45) { // basalt vesicles
      const bv = rgb('#2e2a26');
      R0(px + 3, py + 3, 2, 2, bv);
      R0(px + 7, py + 7, 3, 2, bv);
    }
    if (e === 70) { // permafrost ice veins
      const pv = rgb('#dfeef2');
      R0(px + 2, py + 5, TS - 4, 1, pv);
      R0(px + 6, py + 2, 1, TS - 4, pv);
    }
    if (e === 71) { // steel sheen
      RA(px + 2, py + 2 + ((x + y) % 6), TS - 4, 2, WHITE, 0.35);
    }
    if (e === 72 && hash2(x * 3, y * 7) > 0.5) { // compost lumps
      const cp = rgb('#4a3826');
      R0(px + 3, py + 5, 2, 2, cp);
      R0(px + 8, py + 3, 2, 2, cp);
    }
    if (e === 73 && hash2(x * 5, y * 3) > 0.5) { // slush: unmelted flecks
      R0(px + 3, py + 3, 3, 2, WHITE);
    }
    if (e === 74) { // ember: cracks still lit
      R0(px + 3, py + 2, 6, 1, rgb('#ff7a20'));
      R0(px + 2, py + 7, 8, 1, rgb('#ffb060'));
    }
    if (e === 75 && hash2(x * 7, y * 3) > 0.4) { // phosphorus waxy glow
      RA(px + 3, py + 3, 3, 2, [255, 248, 208], 0.8);
    }
    if (e === 76 && hash2(x * 3, y * 9) > 0.45) { // mud wet speckle
      R0(px + 3, py + 4, 2, 2, rgb('#3e4a28'));
    }
    if (e === 77) { // sinter terraces
      const st = rgb('#a8a494');
      R0(px + 1, py + 4, TS - 2, 1, st);
      R0(px + 1, py + 9, TS - 2, 1, st);
    }
    if (e === 78 && hash2(x * 6, y * 4) > 0.5) { // tuff lapilli
      R0(px + 4, py + 4, 2, 2, rgb('#4a3a58'));
    }
    const L = world.life[i];
    if (L === 1 && world.lifeAmt[i] > 0.5) {
      const n = Math.min(5, 1 + ((world.lifeAmt[i] / 12) | 0));
      const gc = rgb(((world.sol >> 2) + x + y) % 2 ? '#c8ff5a' : '#7fd41f');
      for (let d = 0; d < n; d++)
        R0(px + 2 + ((hash2(x * 5 + d, y) * 8) | 0), py + 2 + ((hash2(x, y * 5 + d) * 8) | 0), 2, 2, gc);
    } else if (L === 2) {
      const m2 = rgb('#1d5b26');
      R0(px + 2, py + 6, 4, 5, m2);
      R0(px + 7, py + 4, 4, 7, m2);
      R0(px + 3, py + 5, 2, 2, rgb('#57d465'));
    } else if (L === 3) {
      const g3 = rgb('#2f9e44');
      R0(px + 2, py + 2, 2, 9, g3);
      R0(px + 5, py + 4, 2, 7, g3);
      R0(px + 8, py + 1, 2, 10, g3);
      R0(px + 2, py + 2, 2, 2, rgb('#8ce665'));
    } else if (L === 4) { // algae bloom flecks
      const a4 = rgb('#4ae08a');
      R0(px + 2, py + 3, 3, 2, a4);
      R0(px + 7, py + 7, 3, 2, a4);
      R0(px + 5, py + 5, 2, 2, rgb('#1d7a4a'));
    } else if (L === 5) { // fungus: pale clustered dots on its host
      const f5 = rgb(((world.sol >> 2) + x + y) % 2 ? '#e8d88a' : '#b09a4a');
      R0(px + 3, py + 3, 2, 2, f5);
      R0(px + 7, py + 5, 2, 2, f5);
      R0(px + 5, py + 8, 2, 2, f5);
    } else if (L === 6) { // lichen: green crust patches
      const l6 = rgb('#9ccb8a');
      R0(px + 2, py + 4, 4, 3, l6);
      R0(px + 7, py + 7, 3, 2, l6);
    } else if (L === 7) { // locusts: hopping amber specks
      const l7 = rgb(((world.sol >> 1) + x + y) % 2 ? '#e09a30' : '#4a8a2a');
      R0(px + 3, py + 2, 2, 3, l7);
      R0(px + 7, py + 6, 2, 3, l7);
      R0(px + 3, py + 2, 2, 1, rgb('#2a1a08'));
    } else if (L === 8) { // coral: pink branching head
      const c8 = rgb('#ff6a8a');
      R0(px + 5, py + 6, 2, 5, c8);
      R0(px + 3, py + 4, 2, 3, c8);
      R0(px + 7, py + 3, 2, 4, c8);
      R0(px + 5, py + 6, 2, 2, rgb('#c83a5a'));
    } else if (L === 9) { // cactus: ribbed column + arms
      const c9 = rgb('#2a7a3a');
      R0(px + 5, py + 2, 3, 9, c9);
      R0(px + 2, py + 5, 2, 4, c9);
      R0(px + 6, py + 3, 1, 7, rgb('#7ac88a'));
    } else if (L === 10) { // sponge: porous orange blob
      R0(px + 3, py + 5, 7, 5, rgb('#b84818'));
      const s10 = rgb('#8a5a1a');
      R0(px + 4, py + 6, 1, 1, s10);
      R0(px + 7, py + 8, 1, 1, s10);
    } else if (L === 11) { // fern: arching fronds
      const f11 = rgb('#3a8a5a');
      R0(px + 2, py + 7, 3, 4, f11);
      R0(px + 5, py + 5, 3, 6, f11);
      R0(px + 8, py + 7, 3, 4, f11);
      R0(px + 5, py + 5, 3, 1, rgb('#7acc8a'));
    } else if (L === 12) { // worms: pink segments in the dirt
      const w12 = rgb('#b86a5a');
      R0(px + 2, py + 7, 4, 2, w12);
      R0(px + 6, py + 5, 4, 2, w12);
      R0(px + 5, py + 7, 1, 2, rgb('#8a4a3a'));
    } else if (L === 13) { // termites: pale marching dots
      const t13 = rgb('#e8e0c0');
      R0(px + 2, py + 6, 2, 2, t13);
      R0(px + 5, py + 4, 2, 2, t13);
      R0(px + 8, py + 7, 2, 2, t13);
    }
    if (world.tech[i] === 1) { // heater coil
      R0(px + 2, py + 4, TS - 4, TS - 8, rgb('#3a2a10'));
      R0(px + 3, py + 5 + ((world.sol >> 2) % 3), TS - 6, 2, rgb('#FFB000'));
    } else if (world.tech[i] === 2) {
      ctx.strokeStyle = 'rgba(45,212,191,.85)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px + TS / 2, py + TS - 1, TS / 2 - 1, Math.PI, 0);
      ctx.stroke();
    } else if (world.tech[i] === 3) { // sprinkler post + spray
      R0(px + 5, py + 5, 2, 7, rgb('#1a4a5a'));
      const sp3 = rgb('#38bdf8');
      R0(px + 2, py + 3, 2, 2, sp3);
      R0(px + 8, py + 3, 2, 2, sp3);
      R0(px + 5, py + 2, 2, 2, sp3);
    } else if (world.tech[i] === 4) { // shade-cloth canopy on posts
      const sh4 = rgb('#57534e');
      R0(px + 1, py + 3, TS - 2, 3, sh4);
      R0(px + 2, py + 6, 1, 6, sh4);
      R0(px + TS - 3, py + 6, 1, 6, sh4);
    } else if (world.tech[i] === 5) { // kiln: brick arch, hot mouth
      R0(px + 2, py + 3, TS - 4, 8, rgb('#7a2a10'));
      R0(px + 4, py + 7, TS - 8, 4, rgb('#ffb000'));
    } else if (world.tech[i] === 6) { // scarecrow: post, arms, head
      const sc6 = rgb('#5a3a1a');
      R0(px + 5, py + 3, 2, 9, sc6);
      R0(px + 2, py + 5, TS - 4, 1, sc6);
      R0(px + 4, py + 1, 4, 3, rgb('#d8a838'));
    }
  }
  ctx.putImageData(imgBuf, 0, 0); // the single blit: every tile above landed in the buffer
  // day/night tint: blue night, amber noon
  const night = 1 - dl;
  if (night > 0.05) {
    ctx.fillStyle = `rgba(8,10,40,${(0.45 * night).toFixed(2)})`;
    ctx.fillRect(0, 0, GW * TS, GH * TS);
  } else {
    ctx.fillStyle = 'rgba(255,170,60,.06)';
    ctx.fillRect(0, 0, GW * TS, GH * TS);
  }
  // particles
  particles = particles.filter(p => p.life > 0);
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy; p.vy -= 0.15; p.life--;
    ctx.globalAlpha = Math.max(0, p.life / 30);
    ctx.fillStyle = p.c;
    ctx.fillRect(p.x, p.y, p.s, p.s);
  }
  ctx.globalAlpha = 1;
  // brush cursor
  if (cursor && inGb(cursor.x, cursor.y)) {
    ctx.strokeStyle = '#FFB000';
    ctx.lineWidth = 2;
    ctx.strokeRect(cursor.x * TS - brush * TS, cursor.y * TS - brush * TS,
                   TS * (2 * brush + 1), TS * (2 * brush + 1));
  }
}
function puff(x, y, c, n, spd) {
  for (let k = 0; k < n; k++)
    particles.push({ x: x * TS + TS / 2, y: y * TS, vx: (Math.random() - 0.5) * spd,
                     vy: -Math.random() * spd, life: 20 + Math.random() * 20, c, s: 2 + Math.random() * 3 });
  if (particles.length > 600) particles.splice(0, particles.length - 600);
}

// trophic chains the yard can host; presence comes from the live census
const CHAINS = [
  { t: ['Soil', 'Grass', 'Locusts'], ok: c => c.soil > 0 && c.grass > 0 && c.locusts > 0 },
  { t: ['Soil', 'Moss', 'Locusts'], ok: c => c.soil > 0 && c.moss > 0 && c.locusts > 0 },
  { t: ['Wood', 'Fungus'], ok: c => c.wood > 0 && c.fungus > 0 },
  { t: ['Wood', 'Termites'], ok: c => c.wood > 0 && c.termites > 0 },
  { t: ['Water', 'Algae'], ok: c => c.water > 0 && c.algae > 0 },
  { t: ['Water', 'Sponge'], ok: c => c.water > 0 && c.sponge > 0 },
];
function ecoLine() {
  const c = world.counts || {};
  const held = CHAINS.filter(ch => { try { return ch.ok(c); } catch (e) { return false; } });
  const best = held.sort((a, b) => b.t.length - a.t.length)[0];
  const h = c.ecoH || 0;
  return `Shannon H ${h.toFixed(2)} · ${c.richness || 0} lifeforms · ${c.biomass || 0} tiles alive` +
    (best ? ` · longest chain ${best.t.length}: ${best.t.join('→')}` : ' · no food chain yet — soil feeds grass feeds locusts');
}
const PROG = { // live progress per problem; defensive: counts may not exist yet
  E1: (w, c) => `${c.grass || 0}/150 grass`,
  E2: (w, c) => `${c.acid || 0} acid left`,
  M1: (w, c) => `${c.water || 0} liquid now`,
  M2: (w, c) => `${c.moss || 0} moss now`,
  R1: (w, c) => `${c.germs || 0} germs · ${c.salt || 0} salt`,
  R2: (w, c) => `${c.moss || 0}/100 moss`,
  E3: (w, c) => `${c.brick || 0}/20 brick`,
  M3: (w, c) => `${c.co2 || 0}/50 CO₂`,
  R3: (w, c) => `${c.grass || 0}/60 grass`,
  E4: (w, c) => `${w.rot | 0}/25 rotted`,
  M4: (w, c) => `${c.glass || 0}/30 glass`,
  R4: (w, c) => `${c.lichen || 0}/70 lichen`,
  U1: (w, c) => `${c.water || 0}/25 water`,
  U2: (w, c) => `${c.moss || 0}/50 moss`,
  H1: (w, c) => `${c.acid || 0}/20 acid`,
  H2: (w, c) => `${c.germs || 0}/300 germs`,
  E5: (w, c) => `${c.locusts || 0}/50 locusts`,
  E6: (w, c) => `${c.lime || 0}/10 lime`,
  E7: (w, c) => `${c.locusts || 0}/30 locusts + scarecrow`,
  E8: (w, c) => `${c.coral || 0}/25 coral`,
  U3: (w, c) => `${c.water || 0}/20 water`,
  U4: (w, c) => `${c.limestone || 0}/12 limestone`,
  H3: (w, c) => `${c.glass || 0}/10 glass`,
  H4: (w, c) => `${c.fungus || 0}/50 fungus`,
  E9: (w, c) => `H ${(c.ecoH || 0).toFixed(2)}/1.40`,
  H5: (w, c) => `${c.water || 0}/70 water + vent`,
  H6: (w, c) => `${c.germs || 0}/100 germs`,
};
function refreshQuests() {
  const ol = $('questlist');
  ol.innerHTML = '';
  let nextMarked = false; // the first unsolved problem wears the star: beginners start there
  QUESTS.filter(q => q.world === world.id).forEach(q => {
    const done = !!world.quests[q.id];
    const isNext = !done && !nextMarked;
    if (isNext) nextMarked = true;
    const li = document.createElement('li');
    li.className = done ? 'done' : '';
    let best = '';
    try { best = localStorage.getItem('sandbox_best_' + q.id) || ''; } catch (e) {}
    const prog = done || !PROG[q.id] ? '' : ' — ' + PROG[q.id](world, world.counts || {});
    li.innerHTML = `<b>${isNext ? '★ NEXT — ' : ''}${q.id} · ${q.name}</b> — ${q.goal}` +
      `<div class="ref">${done ? 'DONE ✓ sol ' + world.quests[q.id] + (best ? ' · best ' + best : '') : q.guide + prog}</div>`;
    ol.appendChild(li);
  });
  try { $('eco').textContent = ecoLine(); } catch (e) {}
  const icon = worldTemp(world).day ? '☀' : '☾';
  $('clock').textContent = `${icon} sol ${world.sol} · ${Math.round(worldTemp(world).T)}°C · reducer ${(world.reducer * 100) | 0}%`;
  $('envblurb').textContent = ENV_BLURB[world.id];
  $('notes').innerHTML = NOTES[world.id].map(n => `· ${n}`).join('<br>');
  try {
    $('rp').textContent = getRP();
    $('rank').textContent = rankFor(getRP()).name;
    const next = Object.entries(UNLOCK_RP).find(([id, need]) => getRP() < need);
    $('unlocknext').textContent = next
      ? `${next[0]} unlocks at ${next[1]} RP — solve problems, log reactions`
      : 'All worlds unlocked. Principal investigator!';
  } catch (e) {}
  document.querySelectorAll('#envbar [data-world]').forEach(b => {
    const locked = !isUnlocked(b.dataset.world);
    // never truly disabled: a locked world must still answer a click with
    // its price and the way to earn it, or the lock is a dead end
    if (b.classList && b.classList.toggle) b.classList.toggle('locked', locked);
    b.textContent = (locked ? '🔒' : '') + b.dataset.world[0].toUpperCase() + b.dataset.world.slice(1);
    b.title = locked ? `Unlocks at ${UNLOCK_RP[b.dataset.world]} RP — click for the way in` : '';
  });
}

const NOTES = {
  earth: ['Water is stable here — this is the control experiment.',
    'Bury the acid spill in soil: dirt neutralises it. Brick channels work too.',
    'Grass spreads fast on wet soil. 150 wins the Meadow.',
    'Wood + fire + air: the triangle. Burn some, wet the ash into soil.',
    'Clay by the campfire fires into brick; fungus recycles damp dead wood.',
    'Hot wet sulfur makes acid rain — Kīlauea vog in a puddle.'],
  moon: ['Water boils at noon, freezes at night. Bank ice, melt at dawn.',
    'Heaters hold +20°C nearby; domes add air + UV cover. Moss needs both at night.',
    'Sand and steam move in slow motion — gravity is 1/6th.',
    'No air, no flame: fire snuffs out unless domed. Heat vision proves it.',
    'Pour CO₂ into a pit and it stays — heavy air smothers flames.'],
  mars: ['Salt + water = brine, liquid to −30°C. Germs detox brine into water.',
    'Grass dies in open CO₂ air — domes carry their own.',
    'Eaters evolve as they digest: watch the reducer % climb.',
    'Thin air starves open flames; lava + ice still bursts steam.',
    'Helium rises fast and never burns; concrete walls shrug off TNT; cryo freezes brine on touch.',
    'Fertilizer speeds the Bloom; pumice rafts float the floods.'],
  europa: ['Everything is ice: melt it with heaters, bank it as pools.',
    'Brine stays liquid far below zero — chaos blobs included.',
    'No dirt here, only ice: import soil before planting moss.',
    'Radiation stands in for Jupiter belts — domes still shield.'],
  hadean: ['No oxygen: fire needs painted O₂ or a dome to burn.',
    'Vents are free permanent heat — sulfur beside a vent sours water.',
    'Days run hot: germs love it, fungus hides under a roof.',
    'Lava cools to basalt in 40 sols; pour kilns fast.'],
};

/* Just-in-time science: one line per reaction kind, first seen -> field journal.
   (Gee: small info the moment it is usable; the journal + inspector are on-demand.) */
const SCIENCE = {
  steam: { t: 'Steam cycle', m: 'Hot water becomes vapour, rises, cools and rains back — the whole water cycle in a puddle.' },
  burst: { t: 'Quench blast', m: 'Lava + water flashes to steam instantly. Quench against ice and you get volcanic glass instead.' },
  fizz: { t: 'Acid fizz', m: 'That fizz is stone dissolving. Soil neutralises acid — bury spills in dirt.' },
  cool: { t: 'Basalt', m: 'Lava cooled into basalt rock. A fast quench against ice would have made obsidian.' },
  clean: { t: 'Brine-eaters', m: 'Germs ate brine and left fresh water — every meal evolves them (watch reducer %).' },
  ignite: { t: 'Fire triangle', m: 'Fuel + heat + air: the triangle is complete. Remove any one leg and flames die.' },
  boom: { t: 'Detonation', m: 'A shockwave that chains to nearby explosives. Concrete walls survive it — rock does not.' },
  glaze: { t: 'Vitrification', m: 'Sand past 800°C turns to glass — same physics as lightning fusing beach sand.' },
  rust: { t: 'Rust', m: 'Metal + water + air = rust. Mars is red with iron oxide — the same end state by a drier path.' },
  snuff: { t: 'Snuffed flame', m: 'No air, no flame — fire snuffs out in vacuum. Domes carry their own air.' },
  rain: { t: 'Condensation', m: 'Cold turned vapour back to rain. Seed clouds over fields and they water them.' },
  scorch: { t: 'Scorched', m: 'That life just scorched — nothing painted here survives past 150°C.' },
  wither: { t: 'Withered', m: 'Grass needs real air, soil, water and mild temps — domes carry their own air.' },
  dissolve: { t: 'Brine', m: 'Salt dissolved into brine — liquid down to −30°C. Life\u2019s antifreeze.' },
  mud: { t: 'Potash soil', m: 'Wet ash sweetens into soil — potash, the oldest fertiliser. Wet regolith works too.' },
  bake: { t: 'Fired brick', m: 'Clay baked past 400°C is now brick — pottery, humanity\u2019s first chemistry.' },
  frost: { t: 'Flash-freeze', m: 'Cryo froze that water solid. Liquid nitrogen boils at −196°C.' },
  sour: { t: 'Acid rain', m: 'Hot sulfur breathed out SO2 and the water turned to acid — volcanoes do exactly this.' },
  feed: { t: 'Fertilizer', m: 'Dissolved dinner for plants: moss, grass and fungus spread faster on fed ground.' },
  perish: { t: 'Perished', m: 'Something just died of cold, drying, or UV. Hover the yard: temperature and wetness tell you why.' },
  rot: { t: 'Compost', m: 'Fungus turned dead wood back into soil — decomposition closes the nutrient loop.' },
  sublime: { t: 'Sublimation', m: 'Dry ice skipped melting and breathed straight into gas — Mars polar caps do this seasonally.' },
  set: { t: 'Sandstone', m: 'Wet sand settled into stone — pressure and time, minus the eons.' },
  nibble: { t: 'Locusts', m: 'The swarm strips your meadow and starves without it — boom and bust, the predator cycle.' },
  sprout: { t: 'Germination', m: 'A seed on wet soil just became grass — agriculture in one tile.' },
  hiss: { t: 'Slaking', m: 'Quicklime + water burns hot enough to scald — Rome mixed mortar this way.' },
  melt: { t: 'Melting', m: 'Wax melts before it burns — phase change first, fuel second.' },
  smelt: { t: 'Smelting', m: 'Green ore + kiln heat = copper — the Chalcolithic in one tile.' },
  mix: { t: 'Gunpowder mix', m: 'Niter + charcoal: the gunpowder recipe. Add sulphur and sparks for history.' },
  cure: { t: 'Concrete cure', m: 'Cement set into concrete — hydration, not drying. Blast walls await.' },
  filter: { t: 'Living filter', m: 'A sponge — or charcoal — just cleaned the water. Filters drink silt and foam.' },
  cast: { t: 'Worm castings', m: 'A worm turned soil into fertilizer — every tunnel feeds the bed.' },
  reef: { t: 'Reef rock', m: 'Coral laid down limestone — reefs built whole continents this way.' },
  flee: { t: 'Scared off', m: 'The straw man did its job — locusts fled without a drop of poison.' },
  gnaw: { t: 'Termites', m: 'Wood-eaters chewed timber back to sawdust — recyclers with teeth.' },
  smoker: { t: 'White smoker', m: 'An alkaline vent laid carbonate — Lost City chimneys, where life may have begun.' },
  genesis: { t: 'Genesis', m: 'Life from no-life: a vent pool just seeded germs — warm water, minerals and time did it.' },
};
let journal = {}; // stealth assessment: evidence accumulates, never a quiz
try { journal = JSON.parse(localStorage.getItem('sandbox_journal_v1') || '{}'); } catch (e) { journal = {}; }
const sciLast = {};
function noteScience(kind) {
  const S = SCIENCE[kind];
  if (!S) return false;
  const first = !journal[kind];
  if (first) {
    journal[kind] = { sol: world.sol, world: world.id };
    try { localStorage.setItem('sandbox_journal_v1', JSON.stringify(journal)); } catch (e) {}
    say(`Logged in field journal: ${S.t} — ${S.m}`);
    beep(520, 0.09); beep(780, 0.12, 'square', 0.03, 0.09);
    refreshJournal();
    return true;
  } else if (world.sol - (sciLast[kind] || -99) > 25) {
    sciLast[kind] = world.sol;
    say(S.m);
  }
  return false;
}
function awardQuestRP(fresh) {
  if (!fresh.length) return;
  let claimed = claimedQuests();
  let changed = false;
  for (const id of fresh) {
    if (claimed.includes(id)) continue;
    claimed.push(id); changed = true;
    addRP(QUEST_RP[id] || 100, `problem ${id} solved`);
  }
  if (changed) try { localStorage.setItem('sandbox_rp_claimed', JSON.stringify(claimed)); } catch (e) {}
}
function refreshJournal() {
  const ol = $('journal');
  const keys = Object.keys(SCIENCE).filter(k => journal[k]);
  $('jcount').textContent = `${keys.length}/${Object.keys(SCIENCE).length}`;
  ol.innerHTML = '';
  keys.forEach(k => {
    const li = document.createElement('li');
    li.innerHTML = `<b>${SCIENCE[k].t}</b> — ${SCIENCE[k].m}` +
      `<div class="ref">sol ${journal[k].sol} · ${journal[k].world}</div>`;
    ol.appendChild(li);
  });
  const left = Object.keys(SCIENCE).length - keys.length;
  const hint = document.createElement('div');
  hint.className = 'ref';
  hint.textContent = left ? `${left} reactions still undiscovered — experiment!` : 'Every known reaction logged. Field scientist!';
  ol.appendChild(hint);
}
function showTool(p) {
  $('inspect').innerHTML = `<b>${p.name}</b> · ${p.kind}` +
    `<br><span class="sci">${p.sci}</span>`;
}
// save slots: the whole yard (matter, life, heat, sol, quest state) survives reloads
function packWorld(w) {
  return { id: w.id, sol: w.sol, reducer: w.reducer, quests: w.quests, rot: w.rot | 0,
    m1done: !!w.m1done, m2done: !!w.m2done, dawnWin: w.dawnWin | 0, wasNight: !!w.wasNight,
    hist: (w.hist || []).slice(-300),
    el: Array.from(w.el), life: Array.from(w.life), lifeAmt: Array.from(w.lifeAmt),
    tech: Array.from(w.tech), wet: Array.from(w.wet), pt: Array.from(w.pt) };
}
function unpackWorld(pack) {
  const w = createWorld(pack.id, 1);
  w.sol = pack.sol | 0; w.reducer = pack.reducer || 0;
  w.quests = pack.quests || {}; w.rot = pack.rot | 0;
  w.m1done = !!pack.m1done; w.m2done = !!pack.m2done;
  w.dawnWin = pack.dawnWin | 0; w.wasNight = pack.wasNight !== false;
  w.hist = Array.isArray(pack.hist) ? pack.hist : [];
  w.el.set(pack.el); w.life.set(pack.life); w.lifeAmt.set(pack.lifeAmt);
  w.tech.set(pack.tech); w.wet.set(pack.wet); w.pt.set(pack.pt);
  stepWorld(w); // one honest tick: counts and live quests rebuild from matter
  return w;
}
const slotKey = n => n === 'auto' ? 'sandbox_auto' : 'sandbox_save_' + n;
function saveSlot(n) {
  try {
    localStorage.setItem(slotKey(n), JSON.stringify(packWorld(world)));
    if (n !== 'auto') say(`Saved ${world.id} sol ${world.sol} to slot ${n}.`);
  } catch (e) { say('Save failed — storage is full or blocked.'); }
}
function loadSlot(n) {
  let pack = null;
  try { pack = JSON.parse(localStorage.getItem(slotKey(n))); } catch (e) {}
  if (!pack || !pack.el || !pack.pt) { say(n === 'auto' ? 'No stashed yard yet.' : `Slot ${n} is empty — save something first.`); return; }
  world = unpackWorld(pack); particles = [];
  say(`Loaded ${n === 'auto' ? 'stashed yard' : 'slot ' + n}: ${world.id} sol ${world.sol}.`);
  refreshQuests();
}
// time-lapse in a file: the yard census as CSV (the ABM's evolution_metrics, grown up)
function censusCSV() {
  const c = world.counts || {};
  const lines = ['metric,value'];
  for (const [k, v] of Object.entries(c)) lines.push(`${k},${v}`);
  lines.push(`sol,${world.sol}`, `world,${world.id}`, `rp,${getRP()}`, `eco,${ecoLine()}`);
  return lines.join('\n');
}
$('btn-csv').onclick = () => {
  try {
    const blob = new Blob([censusCSV()], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sandbox-${world.id}-sol${world.sol}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    say('Census downloaded — graph it, share it, prove your ecosystem.');
  } catch (e) { say('Download blocked here — the census is still live above.'); }
};
// share codes: the whole yard as one pastable string (same bytes as a save slot)
function shareEncode() {
  return btoa(unescape(encodeURIComponent(JSON.stringify(packWorld(world)))));
}
function shareDecode(code) {
  const pack = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
  if (!pack || !pack.el || !pack.pt) throw new Error('bad code');
  return pack;
}
$('btn-share').onclick = () => {
  try {
    const box = $('sharecode');
    box.value = shareEncode();
    box.select();
    say('Yard code ready — send it to a friend; Load rebuilds your exact yard on theirs.');
  } catch (e) { say('Sharing failed here — slots still work.'); }
};
$('btn-loadcode').onclick = () => {
  try {
    world = unpackWorld(shareDecode($('sharecode').value));
    particles = [];
    say(`Loaded shared yard: ${world.id} sol ${world.sol}. Same matter, new scientist.`);
    refreshQuests();
  } catch (e) { say('That code did not parse — check for missing characters.'); }
};
// weekly challenge: one shared seed per world per ISO week, same yard for everyone
function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - day + 3);
  const first = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  return `${t.getUTCFullYear()}-W${1 + Math.round((t - first) / 6048e5)}`;
}
function challengeSeed(worldId, dateStr) {
  const s = `${dateStr}|${worldId}|sandbox`;
  let h = 7;
  for (let k = 0; k < s.length; k++) h = (Math.imul(h, 31) + s.charCodeAt(k)) | 0;
  return h >>> 0;
}
function showChallenge() {
  try { $('chseed').textContent = isoWeek(new Date()) + ' · ' + world.id; } catch (e) {}
}
$('btn-challenge').onclick = () => {
  if (!isUnlocked(world.id)) { say('Unlock this world first — challenges honour progression.'); return; }
  const week = isoWeek(new Date());
  saveSlot('auto');
  world = createWorld(world.id, challengeSeed(world.id, week));
  particles = [];
  say(`Weekly challenge ${week}: everyone plays this exact ${world.id}. Best sol per problem still counts.`);
  showChallenge();
  refreshQuests();
};
showChallenge();
function drawSpark() {
  const c = $('spark'), g = c.getContext('2d');
  g.fillStyle = '#0a0806'; g.fillRect(0, 0, c.width, c.height);
  const h = world.hist;
  if (!h || h.length < 2) return;
  const series = [['g', '#A3E635', 60], ['m', '#3fae4a', 200], ['gr', '#57d465', 200]];
  for (const [k, col, max] of series) {
    g.strokeStyle = col; g.lineWidth = 1; g.beginPath();
    h.forEach((p, i) => {
      const x = (i / 299) * c.width;
      const y = c.height - 2 - Math.min(1, (p[k] || 0) / max) * (c.height - 4);
      if (i) g.lineTo(x, y); else g.moveTo(x, y);
    });
    g.stroke();
  }
}

let acc = 0, last = performance.now();
function frame(now) {
  try {
    const dt = Math.min(120, now - last);
    last = now;
    if (started && !paused) {
      acc += dt * speed;
      while (acc >= 300) { acc -= 300; tick(); }
    }
    draw();
  } finally {
    requestAnimationFrame(frame);
  }
}
function tick() {
  stepWorld(world);
  for (const [kind, x, y] of world.ev) {
    if (kind === 'steam') puff(x, y, '#cfd8dc', 2, 1);
    else if (kind === 'burst') puff(x, y, '#ffffff', 6, 2.5);
    else if (kind === 'fizz') puff(x, y, '#b0ff28', 2, 1);
    else if (kind === 'cool') puff(x, y, '#888888', 3, 1);
    else if (kind === 'clean') puff(x, y, '#A3E635', 2, 1);
    else if (kind === 'ignite') puff(x, y, '#ff8800', 3, 1.5);
    else if (kind === 'boom') { puff(x, y, '#ffffff', 14, 4); puff(x, y, '#ff8800', 10, 3); }
    else if (kind === 'glaze') puff(x, y, '#bfe8e8', 2, 1);
    else if (kind === 'bake') puff(x, y, '#c86a4a', 3, 1);
    else if (kind === 'frost') puff(x, y, '#dff4ff', 2, 1);
    else if (kind === 'rust') puff(x, y, '#8a3a1a', 2, 0.5);
    else if (kind === 'rain') puff(x, y, '#7fb8dd', 1, 0.5);
    else if (kind === 'scorch') puff(x, y, '#552200', 2, 1);
    else if (kind === 'sprout') puff(x, y, '#57d465', 2, 1);
    else if (kind === 'hiss') puff(x, y, '#ffffff', 3, 1);
    else if (kind === 'melt') puff(x, y, '#e8c848', 2, 1);
    else if (kind === 'smelt') puff(x, y, '#e8a858', 3, 1.5);
    else if (kind === 'mix') puff(x, y, '#5a5a5e', 2, 1);
    else if (kind === 'cure') puff(x, y, '#8d8d94', 2, 1);
    else if (kind === 'filter') puff(x, y, '#7fd4ff', 2, 1);
    else if (kind === 'cast') puff(x, y, '#d8c890', 2, 1);
    else if (kind === 'reef') puff(x, y, '#ff6a8a', 3, 1.5);
    else if (kind === 'flee') puff(x, y, '#e09a30', 2, 1);
    else if (kind === 'gnaw') puff(x, y, '#9c6838', 2, 1);
    else if (kind === 'smoker') puff(x, y, '#ff7a20', 3, 1.5);
    else if (kind === 'genesis') { puff(x, y, '#A3E635', 6, 2); puff(x, y, '#ffffff', 4, 1.5); }
    playSfx(kind);
    if (noteScience(kind)) addRP(10, 'new reaction logged');
  }
  drawSpark();
  const fresh = checkQuestsUI();
  awardQuestRP(fresh);
  if (fresh.length) {
    beep(660, 0.1); beep(880, 0.14, 'square', 0.03, 0.1);
    const q = QUESTS.find(q => q.id === fresh[fresh.length - 1]);
    say(`Problem solved: ${q.name}! ${q.guide}`);
    try {
      const k = 'sandbox_best_' + q.id;
      const b = +(localStorage.getItem(k) || 1e9);
      if (world.sol < b) localStorage.setItem(k, world.sol);
    } catch (e) {}
  }
  refreshQuests();
}
function checkQuestsUI() {
  // quests are marked inside stepWorld->checkQuests; here we just detect news
  const seen = checkQuestsUI.seen || (checkQuestsUI.seen = new Set());
  const fresh = [];
  for (const q of QUESTS) {
    if (world.quests[q.id] && !seen.has(q.id)) { seen.add(q.id); fresh.push(q.id); }
  }
  checkQuestsUI.seenWorld = checkQuestsUI.seenWorld || world.id;
  if (checkQuestsUI.seenWorld !== world.id) {
    checkQuestsUI.seen = new Set(); checkQuestsUI.seenWorld = world.id;
  }
  return fresh;
}

document.querySelectorAll('#envbar [data-world]').forEach(b => {
  b.onclick = () => {
    if (!isUnlocked(b.dataset.world)) {
      const need = UNLOCK_RP[b.dataset.world], have = getRP();
      const next = QUESTS.find(q => isUnlocked(q.world) && !claimedQuests().includes(q.id));
      say(`${WORLDS[b.dataset.world].name} unlocks at ${need} RP (you have ${have}).` +
        (next ? ` Next problem: ${next.name} (${WORLDS[next.world].name}) — ${next.goal}, +${QUEST_RP[next.id] || 100} RP.`
          : ' Log new reactions in the journal, +10 RP each.'));
      return;
    }
    document.querySelectorAll('#envbar [data-world]').forEach(o => o.classList.remove('on'));
    b.classList.add('on');
    saveSlot('auto'); // switching worlds never destroys work silently
    world = createWorld(b.dataset.world, (Math.random() * 1e9) | 0);
    particles = [];
    say(ENV_BLURB[b.dataset.world] + ' (Previous yard stashed — Load it back from Auto.)');
    refreshQuests();
    beep(440, 0.08);
  };
});
$('btn-pause').onclick = () => {
  paused = !paused;
  $('btn-pause').textContent = paused ? '▶' : 'II';
};
$('btn-speed').onclick = ev => {
  speed = speed === 1 ? 3 : 1;
  ev.target.textContent = speed + '×';
};
function setBrush(n) { // 0 = single tile, free stepping both ways
  brush = Math.max(0, Math.min(4, n));
  $('btn-brush').textContent = '●'.repeat(brush) + '○'.repeat(4 - brush);
  say(`Pointer ${brush === 0 ? 'single tile' : 'radius ' + brush} — paint detail or broad strokes.`);
}
$('btn-brush').onclick = () => setBrush(brush + 1);
$('btn-brush-dec').onclick = () => setBrush(brush - 1);
setBrush(2);
$('btn-view').onclick = ev => {
  view = (view + 1) % 2;
  ev.target.style.borderColor = view ? '#FFB000' : '';
  ev.target.style.color = view ? '#FFB000' : '';
  say(view ? 'Heat vision: blue frozen → black mild → orange hot → white furnace.' : 'Normal vision.');
};
document.querySelectorAll('#saverow [data-sv]').forEach(b => {
  b.onclick = () => saveSlot(+b.dataset.sv);
});
document.querySelectorAll('#saverow [data-ld]').forEach(b => {
  b.onclick = () => loadSlot(+b.dataset.ld);
});
window.addEventListener('keydown', ev => {
  if (ev.key === ' ') { ev.preventDefault(); $('btn-pause').click(); }
  if (ev.key === 'f' || ev.key === 'F') $('btn-speed').click();
  if (ev.key === '[') $('btn-brush-dec').click();
  if (ev.key === ']') $('btn-brush').click();
  if (ev.key >= '1' && ev.key <= '9') { // category hotkeys match the tab order
    const cats = [...new Set(PALETTE.filter(p => p.group).map(p => p.group))];
    const c = cats[+ev.key - 1];
    if (c) { pcat = c; buildPalette(); }
  }
});
$('btn-step').onclick = () => { if (paused) tick(); else say('Pause first — then step tick by tick.'); };
$('btn-mute').onclick = ev => {
  muted = !muted;
  ev.target.textContent = muted ? 'sfx off' : 'sfx on';
};
try { const f = $('pfilter'); if (f) f.addEventListener('input', buildPalette); } catch (e) {}
$('btn-start').onclick = () => {
  $('startOverlay').hidden = true; started = true;
  say('Paint something. Try ice next to soil — then flip to the Moon and do it again.');
  beep(440, 0.1);
};
started = true; // sandbox paints from the first click; the intro is just a cover
$('startOverlay').hidden = false;

buildPalette(); refreshQuests(); refreshJournal();
requestAnimationFrame(frame);
