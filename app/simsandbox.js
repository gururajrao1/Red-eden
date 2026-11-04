/* RED EDEN Sandbox core — Sandboxels-style falling-sand Mars/Earth/Moon lab.
   Layers per cell: base element + life overlay + tech overlay + moisture.
   Pure logic, no DOM: node harness requires() this file.
   Research notes live in app/papers.js (Worlds section) and /tmp/game/sandbox-spec.md. */
'use strict';

// base elements
const E = { EMPTY: 0, REGOLITH: 1, ROCK: 2, SAND: 3, SOIL: 4, ICE: 5, SALT: 6,
            WATER: 7, BRINE: 8, ACID: 9, LAVA: 10, STEAM: 11, SMOKE: 12,
            FIRE: 13, WOOD: 14, OIL: 15, ASH: 16, CLOUD: 17, SNOW: 18,
            GLASS: 19, METAL: 20, RUST: 21, TNT: 22, HYDROGEN: 23, OXYGEN: 24,
            METHANE: 25, SUN: 26, CONCRETE: 27, CLAY: 28, BRICK: 29,
            GUNPOWDER: 30, HELIUM: 31, CRYO: 32, OBSIDIAN: 33,
            SULFUR: 34, FERTILIZER: 35, CO2: 36, PUMICE: 37, LEAD: 38,
            DRYICE: 39, SANDSTONE: 40, GRAVEL: 41, PEAT: 42,
            NITROGEN: 43, CHLORINE: 44, MERCURY: 45, FOAM: 46, CEMENT: 47,
            SAWDUST: 48, COAL: 49, DUST: 50, HAIL: 51, GRANITE: 52,
            LIMESTONE: 53, LIME: 54, CHARCOAL: 55, COPPER: 56, URANIUM: 57,
            PAPER: 58, SALTPETRE: 59, CHALK: 60, QUARTZ: 61, COPPERORE: 62,
            WAX: 63, AMBER: 64, SEED: 65, RUBBER: 66, BONE: 67, VENT: 68,
            BASALT: 69, PERMAFROST: 70, STEEL: 71, COMPOST: 72, SLUSH: 73,
            EMBER: 74, PHOSPHORUS: 75, MUD: 76, SINTER: 77, TUFF: 78,
            WALL: 79, VOID: 80, CLONE: 81, BATTERY: 82, WIRE: 83, DIAMOND: 84,
            GOLD: 85, MARBLE: 86, SUGAR: 87, MEAT: 88,
            SHALE: 89, SAP: 90, FOSSIL: 91,
            HONEY: 92, GUANO: 93, TRONA: 94 };
const LIFE = { NONE: 0, GERMS: 1, MOSS: 2, GRASS: 3, ALGAE: 4, FUNGUS: 5, LICHEN: 6, LOCUSTS: 7,
  CORAL: 8, CACTUS: 9, SPONGE: 10, FERN: 11, WORMS: 12, TERMITES: 13,
  VIRUS: 14, FISH: 15, BIRD: 16, ANT: 17, TREE: 18,
  MUSHROOM: 19, KELP: 20, FLOWER: 21, BEE: 22,
  CLOVER: 23, SPIDER: 24, SHRIMP: 25, ARCHAEA: 26, CYANO: 27, STROM: 28, TARDI: 29, DEINO: 30 };
const TECH = { NONE: 0, HEATER: 1, DOME: 2, SPRINKLER: 3, SHADE: 4, KILN: 5, SCARECROW: 6 };
const POWDER = new Set([E.SAND, E.SALT, E.ASH, E.SNOW, E.CLAY, E.GUNPOWDER, E.SULFUR, E.FERTILIZER, E.PUMICE, E.GRAVEL,
  E.SAWDUST, E.COAL, E.DUST, E.HAIL, E.SALTPETRE, E.LIME, E.SEED, E.COMPOST, E.PHOSPHORUS, E.SUGAR, E.HONEY, E.GUANO]);
const LIQUID = new Set([E.WATER, E.BRINE, E.ACID, E.LAVA, E.OIL, E.CRYO, E.MERCURY, E.FOAM, E.CEMENT]);
const GAS = new Set([E.STEAM, E.SMOKE, E.CLOUD, E.HYDROGEN, E.OXYGEN, E.METHANE, E.HELIUM, E.CO2, E.NITROGEN, E.CHLORINE]);
// thermal conductivity per element (metal fast, gases slow)
function condOf(e) {
  if (e === E.WIRE) return 0.7; // wire is a heat pipe: heater warmth runs down it
  if (e === E.METAL || e === E.STEEL || e === E.GOLD) return 0.6;
  if (e === E.DIAMOND) return 0.5;
  if (e === E.LEAD) return 0.5;
  if (e === E.MERCURY || e === E.COPPER) return 0.6;
  if (e === E.RUBBER || e === E.WAX || e === E.AMBER) return 0.005; // insulators hold heat out
  if (e === E.WATER || e === E.BRINE || e === E.RUST) return 0.3;
  if (e === E.VENT) return 0.3; // basalt chimney conducts like wet rock
  if (e === E.GLASS) return 0.25;
  if (e === E.ICE || e === E.SNOW) return 0.35;
  if (e === E.WOOD) return 0.08;
  if (e === E.OIL) return 0.15;
  if (e === E.STEAM || e === E.SMOKE || e === E.CLOUD ||
      e === E.HYDROGEN || e === E.OXYGEN || e === E.METHANE || e === E.HELIUM || e === E.CO2 ||
      e === E.NITROGEN || e === E.CHLORINE) return 0.05;
  return 0.2;
}
// breathable air here? planetary O2, sealed dome, or a painted oxygen pocket
function airAt(w, x, y) {
  if (w.Wd.o2) return true;
  if (isDome(w, x, y)) return true;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy || !inG(x + dx, y + dy)) continue;
    if (w.el[gidx(x + dx, y + dy)] === E.OXYGEN) return true;
  }
  return false;
}
function explode(w, x, y, r) {
  const queue = [[x, y, r]], seen = new Set([y * GW + x]);
  while (queue.length) {
    const [cx, cy, cr] = queue.pop();
    for (let dy = -cr; dy <= cr; dy++) for (let dx = -cr; dx <= cr; dx++) {
      if (dx * dx + dy * dy > cr * cr || !inG(cx + dx, cy + dy)) continue;
      const j = gidx(cx + dx, cy + dy), n = w.el[j];
      if (n === E.TNT && !seen.has(j)) {
        seen.add(j);
        w.el[j] = E.FIRE; w.wet[j] = 0; // the fuse catches — chain continues
        queue.push([cx + dx, cy + dy, 6]);
        continue;
      }
      if (n === E.ROCK || n === E.LAVA || n === E.CONCRETE || n === E.GRANITE || n === E.BASALT || n === E.STEEL || n === E.WALL || n === E.DIAMOND || n === E.VOID) continue; // blast-proof
      if (n === E.WOOD || n === E.OIL || n === E.EMBER) {
        w.el[j] = E.FIRE; w.wet[j] = 0; // stoking embers wakes them back to flame
      } else if (n === E.HYDROGEN || n === E.METHANE) {
        w.el[j] = E.STEAM; w.wet[j] = 0; // burnt gas becomes water vapour
      } else if (n !== E.FIRE) {
        const rr = w.rng(); // demolition leaves rubble behind
        w.el[j] = rr < 0.45 ? E.SMOKE : (rr < 0.6 ? E.GRAVEL : E.EMPTY);
      }
      w.pt[j] = Math.max(w.pt[j], 500);
      w.life[j] = 0; w.lifeAmt[j] = 0;
    }
  }
  w.ev.push(['boom', x, y]);
}

const WORLDS = {
  earth: { name: 'Earth', g: 1.0, o2: 1, dayT: 20, nightT: 10, cycle: 60,
           uv: 0.05, blurb: 'The control world: thick air, mild sun, liquid water.' },
  moon: { name: 'Moon', g: 0.16, o2: 0, dayT: 120, nightT: -130, cycle: 90,
          uv: 0.9, blurb: 'Vacuum, 250° swings, fierce sun. Ice hides in shadow.' },
  mars: { name: 'Mars', g: 0.38, o2: 0, dayT: 12, nightT: -70, cycle: 70,
          uv: 0.55, blurb: 'Thin air, poison soil; warm equatorial summer site. Brines persist.' },
  europa: { name: 'Europa', g: 0.13, o2: 0, dayT: -100, nightT: -160, cycle: 80,
          uv: 0.4, blurb: 'Ice crust over a salty ocean; Jupiter radiation instead of sunburn.' },
  hadean: { name: 'Hadean Earth', g: 1.0, o2: 0, dayT: 55, nightT: 25, cycle: 60,
          uv: 0.9, blurb: 'Young Earth: lava vents, sulfur skies, no oxygen — fire needs a pocket of air.' },
  titan: { name: 'Titan', g: 0.14, o2: 0, dayT: -180, nightT: -183, cycle: 90,
          uv: 0.05, blurb: 'Orange haze, methane seas, -180° ice bedrock. Thick air, no oxygen, almost no seasons.' },
  io: { name: 'Io', g: 0.18, o2: 0, dayT: -100, nightT: -140, cycle: 80,
          uv: 0.5, blurb: 'Tidal foundry: Jupiter kneads the crust into endless lava lakes under sulfur frost.' },
  archaean: { name: 'Archaean', g: 1.0, o2: 0, dayT: 30, nightT: 10, cycle: 60, uv: 0.3,
          blurb: 'Young Earth: warm shallow seas, methane haze, no oxygen and no ozone. The GOE happens here first.' },
  venus: { name: 'Venus', g: 0.9, o2: 0, dayT: 460, nightT: 440, cycle: 120,
          uv: 0.3, blurb: 'Runaway greenhouse: 460° basalt plains, sulfur skies, volcanic glass. A kiln with weather.' },
  enceladus: { name: 'Enceladus', g: 0.11, o2: 0, dayT: -180, nightT: -200, cycle: 90,
          uv: 0.3, blurb: 'Plumed ice moon: tiger-stripe vents spray a salty ocean through the south ice.' },
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GW = 64, GH = 40, GN = GW * GH;
const gidx = (x, y) => y * GW + x;
const inG = (x, y) => x >= 0 && y >= 0 && x < GW && y < GH;

function blob(rng, arr, W, H, cx, cy, rad, val) {
  for (let y = Math.max(0, cy - rad); y <= Math.min(H - 1, cy + rad); y++)
    for (let x = Math.max(0, cx - rad); x <= Math.min(W - 1, cx + rad); x++) {
      if (Math.hypot(x - cx, y - cy) <= rad && rng() < 0.85) arr[y * W + x] = val;
    }
}

function createWorld(worldId, seed) {
  const Wd = WORLDS[worldId] || WORLDS.earth;
  const rng = mulberry32(seed || 1);
  const w = { id: worldId, Wd, rng, sol: 0, reducer: 0.1, o2: Wd.o2 ? 100 : 0, o2loud: false, uClean: 0, erupt: 0,
    el: new Uint8Array(GN), life: new Uint8Array(GN), lifeAmt: new Float32Array(GN),
    tech: new Uint8Array(GN), wet: new Float32Array(GN), age: new Float32Array(GN), heat: new Float32Array(GN), hist: [], rot: 0,
    pt: new Float32Array(GN),
    ev: [], quests: {}, m1run: 0, wasNight: true };
  w.el.fill(worldId === 'europa' || worldId === 'titan' || worldId === 'enceladus' ? E.ICE :
    (worldId === 'earth' ? E.SOIL : ((worldId === 'venus' || worldId === 'io') ? E.BASALT : E.REGOLITH)));
  for (let k = 0; k < 10; k++)
    blob(rng, w.el, GW, GH, (rng() * GW) | 0, (rng() * GH) | 0, 1 + ((rng() * 3) | 0), E.ROCK);
  if (worldId === 'earth') {
    blob(rng, w.el, GW, GH, 14, 26, 6, E.WATER);       // lake
    blob(rng, w.el, GW, GH, 50, 10, 4, E.ACID);        // the spill (problem E2)
    // lake wets its shores
    for (let i = 0; i < GN; i++) if (w.el[i] === E.WATER) w.wet[i] = 1;
  } else if (worldId === 'moon') {
    blob(rng, w.el, GW, GH, 8, 8, 5, E.ICE);           // shadow-crater ice
    blob(rng, w.el, GW, GH, 52, 30, 3, E.ICE);
  } else if (worldId === 'europa') {
    for (let k = 0; k < 6; k++)
      blob(rng, w.el, GW, GH, (rng() * GW) | 0, (rng() * GH) | 0, 1 + ((rng() * 2) | 0), E.ROCK);
    for (let k = 0; k < 4; k++) // chaos-lick brines + salts in the ice shell
      blob(rng, w.el, GW, GH, 6 + ((rng() * (GW - 12)) | 0), 6 + ((rng() * (GH - 12)) | 0), 3, E.BRINE);
    for (let k = 0; k < 3; k++)
      blob(rng, w.el, GW, GH, 6 + ((rng() * (GW - 12)) | 0), 6 + ((rng() * (GH - 12)) | 0), 2, E.SALT);
  } else if (worldId === 'hadean') {
    for (let k = 0; k < 3; k++) // lava vents breathing through the crust
      blob(rng, w.el, GW, GH, 10 + ((rng() * (GW - 20)) | 0), 20 + ((rng() * (GH - 26)) | 0), 3, E.LAVA);
    for (let k = 0; k < 3; k++)
      blob(rng, w.el, GW, GH, 6 + ((rng() * (GW - 12)) | 0), 6 + ((rng() * (GH - 12)) | 0), 3, E.SULFUR);
    blob(rng, w.el, GW, GH, 14, 26, 4, E.WATER);       // one stubborn crater lake
  } else if (worldId === 'titan') {
    // hydrocarbon seas (oil stands in for liquid methane) + organic dunes on ice bedrock
    for (let k = 0; k < 3; k++)
      blob(rng, w.el, GW, GH, 8 + ((rng() * (GW - 16)) | 0), 8 + ((rng() * (GH - 16)) | 0), 4, E.OIL);
    for (let k = 0; k < 3; k++)
      blob(rng, w.el, GW, GH, 6 + ((rng() * (GW - 12)) | 0), 6 + ((rng() * (GH - 12)) | 0), 3, E.SAND);
  } else if (worldId === 'venus') {
    // volcanic lowlands: lava fields, sulfur frost, tessera granite, basalt sand
    for (let k = 0; k < 3; k++)
      blob(rng, w.el, GW, GH, 10 + ((rng() * (GW - 20)) | 0), 18 + ((rng() * (GH - 24)) | 0), 3, E.LAVA);
    for (let k = 0; k < 4; k++)
      blob(rng, w.el, GW, GH, 6 + ((rng() * (GW - 12)) | 0), 6 + ((rng() * (GH - 12)) | 0), 3, E.SULFUR);
    for (let k = 0; k < 2; k++)
      blob(rng, w.el, GW, GH, 6 + ((rng() * (GW - 12)) | 0), 6 + ((rng() * (GH - 12)) | 0), 2, E.GRANITE);
    for (let k = 0; k < 3; k++)
      blob(rng, w.el, GW, GH, 6 + ((rng() * (GW - 12)) | 0), 6 + ((rng() * (GH - 12)) | 0), 3, E.SAND);
  } else if (worldId === 'io') {
    // tidal foundry: lava lakes in sulfur frost on basalt
    for (let k = 0; k < 4; k++)
      blob(rng, w.el, GW, GH, 10 + ((rng() * (GW - 20)) | 0), 18 + ((rng() * (GH - 24)) | 0), 3, E.LAVA);
    for (let k = 0; k < 5; k++)
      blob(rng, w.el, GW, GH, 6 + ((rng() * (GW - 12)) | 0), 6 + ((rng() * (GH - 12)) | 0), 3, E.SULFUR);
    for (let k = 0; k < 3; k++)
      blob(rng, w.el, GW, GH, 6 + ((rng() * (GW - 12)) | 0), 6 + ((rng() * (GH - 12)) | 0), 3, E.SAND);
  } else if (worldId === 'archaean') {
    // young Earth: warm shallow seas on basalt, sandbars, a couple of alkaline vents
    for (let k = 0; k < 4; k++)
      blob(rng, w.el, GW, GH, 8 + ((rng() * (GW - 16)) | 0), 14 + ((rng() * (GH - 20)) | 0), 4, E.WATER);
    for (let k = 0; k < 4; k++)
      blob(rng, w.el, GW, GH, 6 + ((rng() * (GW - 12)) | 0), 6 + ((rng() * (GH - 12)) | 0), 3, E.SAND);
    for (let k = 0; k < 2; k++)
      blob(rng, w.el, GW, GH, 14 + ((rng() * (GW - 28)) | 0), 16 + ((rng() * (GH - 24)) | 0), 1, E.VENT);
  } else if (worldId === 'enceladus') {
    // tiger stripes: a row of vents across the south ice, brine pockets, salty spray
    for (let k = 0; k < 4; k++)
      blob(rng, w.el, GW, GH, 12 + k * 14, 32, 1, E.VENT);
    for (let k = 0; k < 3; k++) // ocean leaking upward: brine lenes under the stripes
      blob(rng, w.el, GW, GH, 10 + ((rng() * (GW - 20)) | 0), 26 + ((rng() * 8) | 0), 2, E.BRINE);
    for (let k = 0; k < 4; k++) // plume fallout: salt + snow dusting the ice
      blob(rng, w.el, GW, GH, 6 + ((rng() * (GW - 12)) | 0), 6 + ((rng() * (GH - 12)) | 0), 2, E.SALT);
    for (let k = 0; k < 3; k++)
      blob(rng, w.el, GW, GH, 6 + ((rng() * (GW - 12)) | 0), 6 + ((rng() * (GH - 12)) | 0), 2, E.SNOW);
  } else {
    for (let k = 0; k < 5; k++)
      blob(rng, w.el, GW, GH, 6 + ((rng() * (GW - 12)) | 0), 6 + ((rng() * (GH - 12)) | 0), 3, E.SALT);
    blob(rng, w.el, GW, GH, 56, 6, 5, E.ICE);          // polar-ish ice
  }
  w.pt.fill(worldTemp(w).T); // every pixel starts at ambient
  return w;
}

function worldTemp(w) {
  const f = (w.sol % w.Wd.cycle) / w.Wd.cycle;
  const dl = Math.pow(Math.max(0, Math.sin(2 * Math.PI * f)), 0.6);
  return { T: w.Wd.nightT + (w.Wd.dayT - w.Wd.nightT) * dl, day: dl > 0.25, dl };
}
function isDome(w, x, y) {
  for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
    if (dx * dx + dy * dy > 16) continue;
    const nx = x + dx, ny = y + dy;
    if (inG(nx, ny) && w.tech[gidx(nx, ny)] === TECH.DOME) return true;
  }
  return false;
}

// paint any layer; returns message or null. Pure.
function paint(w, kind, id, cx, cy, r) {
  let changed = false;
  for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
    if (!inG(x, y) || Math.hypot(x - cx, y - cy) > r + 0.4) continue;
    const i = gidx(x, y);
    if (kind === 'base') {
      if (id === E.EMPTY || w.el[i] !== E.ROCK || id === E.ROCK) { w.el[i] = id; w.age[i] = 0; changed = true; }
      if (id === E.WATER || id === E.BRINE) w.wet[i] = 1;
      if (id === E.EMPTY) { w.life[i] = 0; w.lifeAmt[i] = 0; w.tech[i] = 0; }
    } else if (kind === 'life') {
      if (id === LIFE.LICHEN && (w.el[i] === E.ROCK || w.el[i] === E.REGOLITH)) {
        w.life[i] = id; w.lifeAmt[i] = 6; changed = true; // pioneers seed bare rock
      } else if (id !== LIFE.LICHEN && w.el[i] !== E.LAVA && w.el[i] !== E.ACID && w.el[i] !== E.EMPTY &&
          w.el[i] !== E.STEAM && w.el[i] !== E.SMOKE && w.el[i] !== E.ROCK &&
          w.el[i] !== E.FIRE) {
        w.life[i] = id; w.lifeAmt[i] = id === LIFE.GERMS ? 12 : 6; changed = true;
      }
    } else if (kind === 'tech') {
      if (w.el[i] !== E.LAVA) { w.tech[i] = id; changed = true; }
    } else if (kind === 'temp') {
      w.pt[i] += id * 150; changed = true; // heat (+1) or cool (−1) tool
    } else if (kind === 'erase') {
      w.el[i] = 0; w.life[i] = 0; w.lifeAmt[i] = 0; w.tech[i] = 0; w.wet[i] = 0; w.age[i] = 0; changed = true;
    }
  }
  return changed ? null : 'Nothing to place there.';
}

function swapCells(w, i, j) {
  for (const k of ['el', 'life', 'lifeAmt', 'wet', 'age', 'pt']) {
    const t = w[k][i]; w[k][i] = w[k][j]; w[k][j] = t;
  }
}
// fertiliser within reach? plants spread faster on fed ground
function fedAt(w, x, y) {
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy || !inG(x + dx, y + dy)) continue;
    if (w.el[gidx(x + dx, y + dy)] === E.FERTILIZER) return true;
    if (w.el[gidx(x + dx, y + dy)] === E.SALTPETRE) return true; // niter feeds too
  }
  return false;
}
// soil a seed can root in sits directly underneath
function belowSeedSoil(w, x, y) {
  if (y + 1 >= GH) return false;
  const b = w.el[gidx(x, y + 1)];
  return b === E.SOIL || b === E.FERTILIZER || b === E.CLAY || b === E.PEAT || b === E.MUD;
}
// any TECH id within radius r?
function techNear(w, x, y, id, r) {
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (dx * dx + dy * dy > r * r) continue;
    if (!inG(x + dx, y + dy)) continue;
    if (w.tech[gidx(x + dx, y + dy)] === id) return true;
  }
  return false;
}
// any pixel in the 8-neighbourhood (self included) hotter than thr?
function hotNbr(w, x, y, thr) {
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!inG(x + dx, y + dy)) continue;
    if (w.pt[gidx(x + dx, y + dy)] > thr) return true;
  }
  return false;
}
// neighbour-element predicate for the life loop (which lives outside hotNbr's scope)
function hasNbrW(w, x, y, pred) {
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy || !inG(x + dx, y + dy)) continue;
    if (pred(w.el[gidx(x + dx, y + dy)])) return true;
  }
  return false;
}
// chimney substrate: a tile anchored to solid ground — bedrock, ice, older
// carbonate, or the vent mouth itself (Lost City spires stack on each other)
function anchoredToStone(w, x, y) {
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy || !inG(x + dx, y + dy)) continue;
    const n = w.el[gidx(x + dx, y + dy)];
    if (n === E.ROCK || n === E.ICE || n === E.REGOLITH || n === E.SAND || n === E.SANDSTONE ||
        n === E.LIMESTONE || n === E.VENT || n === E.BASALT || n === E.SINTER || n === E.TUFF) return true;
  }
  return false;
}
// overburden: sediment or stone piled directly above — burial pressure for
// coal-to-diamond, mud-to-shale, bone-to-fossil, and it starves fire of air
function buriedBy(w, x, y) {
  if (y <= 0) return false;
  const n = w.el[gidx(x, y - 1)];
  return n === E.ROCK || n === E.BASALT || n === E.GRANITE || n === E.SAND ||
    n === E.SOIL || n === E.SANDSTONE || n === E.LIMESTONE || n === E.MARBLE;
}

// habitability checklist: the deterministic survival gates for each lifeform,
// in the same terms as the rules below (chance-based UV/predation excluded).
// The inspector reads this live, so a death is always explainable on hover.
// Returns [[label, ok]]; labels stay short for the readout line.
function habitability(w, x, y, L) {
  const i = gidx(x, y), e = w.el[i], t = w.pt[i], wet = Math.min(1, w.wet[i]);
  const { dl } = worldTemp(w);
  const soil = (e === E.SOIL || e === E.FERTILIZER);
  const sea = (e === E.WATER || e === E.BRINE);
  switch (L) {
    case LIFE.GERMS: return [['damp', wet >= 0.2], ['mild', t >= -30 && t <= 60 + 60 * wet]];
    case LIFE.MOSS: return [['mild', t >= -20 && t <= 45 + 80 * wet]];
    case LIFE.GRASS: return [['soil', soil], ['air', airAt(w, x, y)], ['damp', wet >= 0.35], ['mild', t >= 0 && t <= 40]];
    case LIFE.ALGAE: return [['water', sea], ['daylight', dl >= 0.25], ['mild', t >= -5 && t <= 45]];
    case LIFE.FUNGUS: return [['host', e === E.WOOD || e === E.ASH || soil], ['damp', wet >= 0.4], ['mild', t >= -10 && t <= 45]];
    case LIFE.LICHEN: return [['rock', e === E.ROCK || e === E.REGOLITH], ['mild', t >= -80 && t <= 50]];
    case LIFE.LOCUSTS: {
      let prey = false;
      for (let dy = -1; dy <= 1 && !prey; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        const L2 = w.life[gidx(x + dx, y + dy)];
        if (L2 === LIFE.GRASS || L2 === LIFE.MOSS) { prey = true; break; }
      }
      return [['mild', t >= 0 && t <= 45], ['prey', prey],
        ['unguarded', !techNear(w, x, y, TECH.SCARECROW, 6)]];
    }
    case LIFE.CORAL: return [['sea', sea], ['daylight', dl >= 0.25], ['mild', t >= 5 && t <= 35],
      ['clean', !hasNbrW(w, x, y, n => n === E.ACID || n === E.CHLORINE)]];
    case LIFE.CACTUS: return [['ground', e === E.SAND || e === E.SOIL || e === E.REGOLITH], ['warm', t >= 0 && t <= 60]];
    case LIFE.SPONGE: return [['water', sea], ['mild', t >= -5 && t <= 40]];
    case LIFE.FERN: return [['soil', soil], ['shade', techNear(w, x, y, TECH.SHADE, 5) || dl < 0.3],
      ['damp', wet >= 0.4], ['mild', t >= 0 && t <= 35]];
    case LIFE.WORMS: return [['soil', soil], ['mild', t >= 0 && t <= 40]];
    case LIFE.TERMITES: {
      let timber = (e === E.WOOD || e === E.PAPER);
      if (!timber) {
        for (let dy = -1; dy <= 1 && !timber; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          const n = w.el[gidx(x + dx, y + dy)];
          if (n === E.WOOD || n === E.PAPER) { timber = true; break; }
        }
      }
      return [['timber', timber], ['mild', t >= 5 && t <= 45]];
    }
    case LIFE.VIRUS: {
      let germsNear = false;
      for (let dy = -1; dy <= 1 && !germsNear; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        if (w.life[gidx(x + dx, y + dy)] === LIFE.GERMS) { germsNear = true; break; }
      }
      return [['germs', germsNear], ['mild', t >= -10 && t <= 45]];
    }
    case LIFE.FISH: {
      let algaeNear = false;
      for (let dy = -1; dy <= 1 && !algaeNear; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        if (w.life[gidx(x + dx, y + dy)] === LIFE.ALGAE) { algaeNear = true; break; }
      }
      return [['water', sea], ['algae', algaeNear], ['mild', t >= 0 && t <= 35]];
    }
    case LIFE.BIRD: {
      let gameNear = false;
      for (let dy = -1; dy <= 1 && !gameNear; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        if (w.life[gidx(x + dx, y + dy)] === LIFE.LOCUSTS) { gameNear = true; break; }
      }
      return [['air', airAt(w, x, y)], ['locusts', gameNear], ['mild', t >= 0 && t <= 40]];
    }
    case LIFE.ANT: {
      let forageNear = false;
      for (let dy = -1; dy <= 1 && !forageNear; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        const n = w.el[gidx(x + dx, y + dy)];
        if (n === E.SUGAR || n === E.MEAT || n === E.SEED) { forageNear = true; break; }
      }
      return [['soil', soil], ['forage', forageNear], ['mild', t >= 5 && t <= 40]];
    }
    case LIFE.TREE: return [['soil', soil], ['damp', wet >= 0.3], ['mild', t >= 0 && t <= 35]];
    case LIFE.MUSHROOM: {
      const mhost = (e === E.WOOD || e === E.ASH || e === E.SOIL || e === E.FERTILIZER || e === E.COMPOST);
      let rotNear = false;
      for (let dy = -1; dy <= 1 && !rotNear; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        if (w.life[gidx(x + dx, y + dy)] === LIFE.FUNGUS) { rotNear = true; break; }
      }
      return [['host', mhost], ['rot', rotNear], ['damp', wet >= 0.4], ['shade', techNear(w, x, y, TECH.SHADE, 5) || dl < 0.3], ['mild', t >= 0 && t <= 35]];
    }
    case LIFE.KELP: return [['sea', sea], ['mild', t >= 0 && t <= 30]];
    case LIFE.FLOWER: return [['soil', soil], ['damp', wet >= 0.3]]; // perennial: cold only pauses the bloom
    case LIFE.CLOVER: return [['soil', soil], ['air', airAt(w, x, y)], ['damp', wet >= 0.35], ['mild', t >= 0 && t <= 40]];
    case LIFE.SPIDER: {
      let preyNear = false;
      for (let dy = -1; dy <= 1 && !preyNear; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        const pj = w.life[gidx(x + dx, y + dy)];
        if (pj === LIFE.ANT || pj === LIFE.LOCUSTS) { preyNear = true; break; }
      }
      const sground = (e === E.SOIL || e === E.FERTILIZER || e === E.SAND);
      return [['ground', sground], ['game', preyNear], ['mild', t >= 0 && t <= 40]];
    }
    case LIFE.SHRIMP: {
      let feedNear = false;
      for (let dy = -1; dy <= 1 && !feedNear; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        if (w.life[gidx(x + dx, y + dy)] === LIFE.ALGAE) { feedNear = true; break; }
      }
      return [['brine', e === E.BRINE], ['algae', feedNear], ['mild', t >= 0 && t <= 35]];
    }
    case LIFE.ARCHAEA: return [['sea', sea], ['hot', t >= 40 && t <= 110]];
    case LIFE.CYANO: return [['sea', sea], ['daylight', dl >= 0.25], ['mild', t >= -5 && t <= 45]];
    case LIFE.STROM: {
      let buildNear = false;
      for (let dy = -1; dy <= 1 && !buildNear; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        const bj = w.life[gidx(x + dx, y + dy)];
        if (bj === LIFE.CYANO || bj === LIFE.ALGAE) { buildNear = true; break; }
      }
      return [['sea', sea], ['daylight', dl >= 0.25], ['builders', buildNear]];
    }
    case LIFE.TARDI: return [['furnace', e !== E.LAVA && e !== E.ACID && e !== E.FIRE]];
    case LIFE.DEINO: return [['damp', wet >= 0.2], ['bake', t <= 60]];
    case LIFE.BEE: {
      let bloomNear = false;
      for (let dy = -1; dy <= 1 && !bloomNear; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        if (w.life[gidx(x + dx, y + dy)] === LIFE.FLOWER) { bloomNear = true; break; }
      }
      return [['bloom', bloomNear], ['mild', t >= 0 && t <= 40]];
    }
    default: return [];
  }
}
// one-line planting advice: first failing check -> plain-language fix, or null when viable.
// Used by the paint warning (and tested in tests/sandbox-habit-test.js).
function habitExplain(checks, name) {
  const HINT = {
    soil: 'needs soil - paint soil first', air: 'needs air - dome it or stay on Earth',
    damp: 'too dry - add water or a sprinkler', water: 'needs open water, not ice or slush - melt a pool',
    sea: 'needs open water - melt a pool with heaters', mild: 'too hot or cold - heaters, domes or shade',
    warm: 'too cold - add heat', daylight: 'needs daylight - plant by day, out of shade',
    host: 'needs damp dead wood, ash or soil', rock: 'needs bare rock or regolith',
    prey: 'needs grass or moss nearby to eat', unguarded: 'a scarecrow stands nearby - they will flee',
    clean: 'acid or chlorine nearby - move away', ground: 'needs sand, soil or regolith',
    shade: 'needs shade cloth or night - noon burns it', timber: 'needs wood or paper nearby',
    germs: 'needs live germs nearby to hijack', algae: 'needs algae to graze',
    locusts: 'needs locusts to hunt', forage: 'needs sugar, meat or seeds nearby',
    bloom: 'needs flowers to work', rot: 'needs fungus rot nearby',
    game: 'needs ants or locusts to hunt', brine: 'needs brine too salty for fish - salt a pool',
    hot: 'needs hot-spring water 40° and up - Hadean pools by day',
    builders: 'needs cyano or algae beside it', furnace: 'only lava, acid and fire kill it',
    bake: 'too hot - cool it below 60°'
  };
  for (const [k, v] of checks) if (!v) return `${name}: ${HINT[k] || ('fails ' + k)}.`;
  return null;
}

function stepWorld(w) {
  const R = w.rng, { T, day, dl } = worldTemp(w);
  w.sol++;
  w.ev.length = 0;
  const g = w.Wd.g;
  // per-pixel heat: conduct (conductivity-weighted), relax to ambient.
  // heaters thermostat their neighbourhood toward +20° (floor only).
  const pOld = Float32Array.from(w.pt);
  const pAt = (x, y) => (x < 0 || y < 0 || x >= GW || y >= GH) ? T : pOld[y * GW + x];
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const i = gidx(x, y), e = w.el[i], cA = condOf(e);
    let flux = 0;
    flux += (pAt(x - 1, y) - w.pt[i]) * (cA + condOf(w.el[y * GW + Math.max(0, x - 1)]));
    flux += (pAt(x + 1, y) - w.pt[i]) * (cA + condOf(w.el[y * GW + Math.min(GW - 1, x + 1)]));
    flux += (pAt(x, y - 1) - w.pt[i]) * (cA + condOf(w.el[Math.max(0, y - 1) * GW + x]));
    flux += (pAt(x, y + 1) - w.pt[i]) * (cA + condOf(w.el[Math.min(GH - 1, y + 1) * GW + x]));
    w.pt[i] += flux * 0.125 + (T - w.pt[i]) * 0.15;
    if (e === E.LAVA) w.pt[i] = 1000;
    else if (e === E.SUN) w.pt[i] = 1500;
    else if (e === E.FIRE) w.pt[i] = Math.max(w.pt[i], 600);
    else if (e === E.CRYO) w.pt[i] += (-180 - w.pt[i]) * 0.2; // LN2 cold finger
    else if (e === E.DRYICE) w.pt[i] += (-80 - w.pt[i]) * 0.1; // dry-ice chill
  }
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const i = gidx(x, y);
    if (w.tech[i] === TECH.HEATER) {
      for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
        const d = Math.hypot(dx, dy);
        if (d > 6 || !inG(x + dx, y + dy)) continue;
        const j = gidx(x + dx, y + dy);
        // full +20 floor out to r4 (~50 tiles): one heater shelters a 40-moss dawn census;
        // two still pay on bigger beds. Overlapping heaters never stack (floor, not bonus).
        const f = d <= 4 ? 20 : 20 * (1 - (d - 4) / 2);
        if (w.pt[j] < f) w.pt[j] += (f - w.pt[j]) * 0.5;
      }
    } else if (w.tech[i] === TECH.DOME) {
      const cap = T + 14;
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        if (dx * dx + dy * dy > 16 || !inG(x + dx, y + dy)) continue;
        const j = gidx(x + dx, y + dy); // thermostatted: overlapping domes cannot stack
        if (w.pt[j] < cap) w.pt[j] = Math.min(cap, w.pt[j] + 1.8);
      }
    } else if (w.tech[i] === TECH.SPRINKLER) {
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        if (dx * dx + dy * dy > 9 || !inG(x + dx, y + dy)) continue;
        w.wet[gidx(x + dx, y + dy)] = 1; // irrigation keeps the disc soaked
      }
    } else if (w.tech[i] === TECH.KILN) {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        if (dx * dx + dy * dy > 16 || !inG(x + dx, y + dy)) continue;
        const j = gidx(x + dx, y + dy); // pottery kiln: holds ~500°, fires clay not sand
        if (w.pt[j] < 500) w.pt[j] += (500 - w.pt[j]) * 0.8;
      }
    } else if (w.tech[i] === TECH.SHADE) {
      const floor = T - 14;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        if (dx * dx + dy * dy > 9 || !inG(x + dx, y + dy)) continue;
        const j = gidx(x + dx, y + dy); // floored like the dome is capped: shades cannot stack
        if (w.pt[j] > floor) w.pt[j] = Math.max(floor, w.pt[j] - 2.0);
      }
    }
  }
  const tempAt = i => w.pt[i];
  const moved = new Uint8Array(GN);
  // movement: gases up, liquids/powders down (gravity-scaled)
  for (let y = 0; y < GH; y++) {
    const yy = y;
    for (let xi = 0; xi < GW; xi++) {
      const x = (yy % 2) ? xi : GW - 1 - xi;
      const i = gidx(x, y), e = w.el[i];
      if (moved[i] || (e !== E.HELIUM && e !== E.HAIL && R() > g + 0.25)) continue; // helium drifts up; hail never lingers
      const below = y + 1 < GH ? i + GW : -1;
      const above = y - 1 >= 0 ? i - GW : -1;
      const canInto = j => j >= 0 && (w.el[j] === E.EMPTY || w.el[j] === E.STEAM || w.el[j] === E.SMOKE);
      if (e === E.CO2) {
        // heavy gas: sinks and pools instead of rising
        if (below >= 0 && canInto(below)) { swapCells(w, i, below); moved[below] = 1; }
        else if (R() < 0.5) {
          const d = R() < 0.5 ? 1 : -1;
          for (const dd of [d, -d, 2 * d, -2 * d]) {
            const nx = x + dd;
            if (inG(nx, y) && canInto(gidx(nx, y))) {
              swapCells(w, i, gidx(nx, y)); moved[gidx(nx, y)] = 1; break;
            }
          }
        }
      }
      else if (GAS.has(e) || e === E.FIRE) {
        // helium drifts twice: the walker follows its own swap upward
        let ci = i, cx = x, cy = y;
        const steps = (e === E.HELIUM) ? 2 : 1;
        for (let a = 0; a < steps; a++) {
          if (w.el[ci] !== e) break; // already drifted off this tick
          const ab = cy - 1 >= 0 ? ci - GW : -1;
          if (ab >= 0 && canInto(ab)) { swapCells(w, ci, ab); moved[ab] = 1; ci = ab; cy--; }
          else if (R() < 0.3) {
            const s = cx + (R() < 0.5 ? 1 : -1);
            if (inG(s, cy) && canInto(gidx(s, cy))) {
              swapCells(w, ci, gidx(s, cy)); moved[gidx(s, cy)] = 1; ci = gidx(s, cy); cx = s;
            }
          }
        }
        if (w.el[i] === E.SMOKE && R() < 0.02) w.el[i] = E.EMPTY;
      } else if (POWDER.has(e)) {
        const pumiceWet = e === E.PUMICE &&
          (w.el[below] === E.WATER || w.el[below] === E.BRINE || w.el[below] === E.ACID);
        if (e === E.PUMICE && above >= 0 &&
            (w.el[above] === E.WATER || w.el[above] === E.BRINE || w.el[above] === E.ACID)) {
          swapCells(w, i, above); moved[above] = 1; // porous rock rises through liquid
        }
        else if (below >= 0 && (w.el[below] === E.EMPTY || w.el[below] === E.STEAM || w.el[below] === E.SMOKE || LIQUID.has(w.el[below])) && !pumiceWet) {
          swapCells(w, i, below); moved[below] = 1; // (floating pumice rests: it does not sink)
        } else if (below >= 0) {
          const d = R() < 0.5 ? 1 : -1;
          for (const dd of [d, -d]) {
            const nx = x + dd;
            if (inG(nx, y + 1) && canInto(gidx(nx, y + 1))) {
              swapCells(w, i, gidx(nx, y + 1)); moved[gidx(nx, y + 1)] = 1; break;
            }
          }
        }
      } else if (LIQUID.has(e)) {
        if (e === E.OIL && above >= 0 &&
            (w.el[above] === E.WATER || w.el[above] === E.BRINE || w.el[above] === E.ACID)) {
          swapCells(w, i, above); moved[above] = 1; // oil floats
        }
        else if (e === E.MERCURY && below >= 0 && LIQUID.has(w.el[below]) && w.el[below] !== E.LAVA) {
          swapCells(w, i, below); moved[below] = 1; // quicksilver sinks through lighter liquids
        }
        else if (e === E.FOAM && below >= 0 &&
            (w.el[below] === E.WATER || w.el[below] === E.BRINE || w.el[below] === E.ACID)) {
          if (R() < 0.5) { // rides the surface: spreads sideways, never sinks
            const d = R() < 0.5 ? 1 : -1;
            for (const dd of [d, -d, 2 * d, -2 * d]) {
              const nx = x + dd;
              if (inG(nx, y) && canInto(gidx(nx, y))) {
                swapCells(w, i, gidx(nx, y)); moved[gidx(nx, y)] = 1; break;
              }
            }
          }
        }
        else if (e === E.LAVA && R() < 0.7) { /* lava creeps: skip */ }
        else if (below >= 0 && canInto(below)) { swapCells(w, i, below); moved[below] = 1; }
        else {
          const d = R() < 0.5 ? 1 : -1;
          for (const dd of [d, -d, 2 * d, -2 * d]) {
            const nx = x + dd;
            if (inG(nx, y) && canInto(gidx(nx, y))) {
              swapCells(w, i, gidx(nx, y)); moved[gidx(nx, y)] = 1; break;
            }
          }
        }
      }
    }
  }
  // phase changes + contact reactions
  const hasNbr = (x, y, pred) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy || !inG(x + dx, y + dy)) continue;
      if (pred(w.el[gidx(x + dx, y + dy)])) return true;
    }
    return false;
  };
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const i = gidx(x, y), e = w.el[i], t = tempAt(i);
    if (e === E.ICE && t > 0 && R() < 0.6) { w.el[i] = E.SLUSH; } // melt stages through slush
    else if (e === E.SLUSH && t > 6) { w.el[i] = E.WATER; w.wet[i] = 1; }
    else if (e === E.SLUSH && t < 0) { w.el[i] = E.ICE; } // refrozen rims
    else if (e === E.WATER && t < 0) w.el[i] = E.ICE;
    else if (e === E.WATER && (t > 100 || (w.Wd.o2 === 0 && t > 60))) {
      w.el[i] = E.STEAM; w.ev.push(['steam', x, y]); // vacuum: water boils at local heat
    }
    else if (e === E.BRINE && t < -30) w.el[i] = E.ICE;
    else if (e === E.BRINE && t > 100) { w.el[i] = E.STEAM; w.ev.push(['steam', x, y]); }
    else if (e === E.STEAM && t < 0) w.el[i] = E.ICE;         // deposition
    else if (e === E.STEAM && t < 95 && R() < 0.1) { w.el[i] = E.WATER; w.wet[i] = 1; }
    else if (e === E.CLOUD && t < 5 && R() < 0.05) { w.el[i] = E.WATER; w.wet[i] = 1; w.ev.push(['rain', x, y]); }
    else if (e === E.SNOW && t > 0) { w.el[i] = E.WATER; w.wet[i] = 1; }
    else if (e === E.ASH && hasNbr(x, y, n => n === E.WATER) && R() < 0.2) {
      w.el[i] = E.SOIL; w.ev.push(['mud', x, y]); // potash: ash sweetens soil
    }
    else if (e === E.COMPOST && hasNbr(x, y, n => n === E.WATER) && R() < 0.15) {
      w.el[i] = E.SOIL; w.ev.push(['mud', x, y]); // finished compost melts into loam
    }
    else if (e === E.ASH && R() < 0.003) {
      let buried = 0;
      for (const [ox, oy] of [[0, 1], [0, -1], [1, 0], [-1, 0]])
        if (inG(x + ox, y + oy) && w.el[gidx(x + ox, y + oy)] === E.ASH) buried++;
      if (buried >= 2) { w.el[i] = E.TUFF; w.ev.push(['set', x, y]); } // burial lithifies ash
    }
    else if (e === E.SAND && (t > 600 || hotNbr(w, x, y, 600))) {
      w.el[i] = E.GLASS; w.ev.push(['glaze', x, y]); // fluxes in dirty sand melt it before pure crystal
    }
    else if (e === E.SAND && hasNbr(x, y, n => n === E.VENT) &&
             hasNbr(x, y, n => n === E.WATER || n === E.BRINE) && R() < 0.008) {
      w.el[i] = E.SINTER; w.ev.push(['smoker', x, y]); // vent-proximal sand lays silica first
    }
    else if (e === E.SAND && hasNbr(x, y, n => n === E.WATER) && R() < 0.005) {
      w.el[i] = E.SANDSTONE; w.ev.push(['set', x, y]); // sediment lithifies, minus the eons
    }
    else if (e === E.SOIL && hasNbr(x, y, n => n === E.WATER) && R() < 0.02) {
      w.el[i] = E.MUD; // soil + standing water: the marsh stage (ambient, like peat: no ticker)
    }
    else if (e === E.SOIL && hasNbr(x, y, n => n === E.WATER) && R() < 0.004) {
      w.el[i] = E.PEAT; // waterlogged soil goes boggy — and bogs burn
    }
    else if (e === E.MUD && hasNbr(x, y, n => n === E.WATER || n === E.BRINE) && R() < 0.008) {
      w.el[i] = E.PEAT; // a marsh kept wet goes boggy — succession, not teleport
    }
    else if (e === E.MUD && !hasNbr(x, y, n => n === E.WATER || n === E.BRINE) && !buriedBy(w, x, y) && R() < 0.1) {
      w.el[i] = E.SOIL; // sun-dried mud sets back to dirt (buried mud cannot dry)
    }
    else if (e === E.MUD && (t > 400 || hotNbr(w, x, y, 400))) {
      w.el[i] = E.BRICK; w.ev.push(['bake', x, y]); // adobe: baked mud is masonry
    }
    else if (e === E.SOIL && t < -40 && !w.life[i] && R() < 0.02) {
      w.el[i] = E.PERMAFROST; // deep cold locks bare soil in ice (life-covered beds are spared)
    }
    else if (e === E.PERMAFROST && t > 0) {
      w.el[i] = E.SOIL; w.wet[i] = 1; // thaw releases the water it held
    }
    else if (e === E.DRYICE) {
      if (R() < 0.02) { w.el[i] = E.CO2; w.ev.push(['sublime', x, y]); } // skips melting entirely
    }
    else if (e === E.LIMESTONE && hasNbr(x, y, n => n === E.LAVA)) {
      w.el[i] = E.MARBLE; w.ev.push(['transmute', x, y]); // contact metamorphism: lava bakes reef rock to marble
    }
    else if ((e === E.LIMESTONE || e === E.CHALK) && (t > 450 || hotNbr(w, x, y, 450))) {
      w.el[i] = E.LIME; // calcination: a kiln just reaches carbonate heat
    }
    else if (e === E.LIME && hasNbr(x, y, n => n === E.WATER || n === E.BRINE)) {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        w.pt[gidx(x + dx, y + dy)] += 40; // slaking runs hot
      }
      w.ev.push(['hiss', x, y]);
      if (R() < 0.15) w.el[i] = E.EMPTY; // spent into the solution
    }
    else if (e === E.QUARTZ && (t > 800 || hotNbr(w, x, y, 800))) {
      w.el[i] = E.GLASS; w.ev.push(['glaze', x, y]); // pure crystal needs full heat — no fluxes to help
    }
    else if (e === E.WAX && t > 60) {
      w.el[i] = E.OIL; w.ev.push(['melt', x, y]); // phase change before burning
    }
    else if (e === E.COPPERORE && (t > 450 || hotNbr(w, x, y, 450))) {
      w.el[i] = R() < 0.15 ? E.GOLD : E.COPPER; w.ev.push(['smelt', x, y]); // bonanza ore runs gold
    }
    else if (e === E.METAL && hasNbr(x, y, n => n === E.COAL || n === E.CHARCOAL) &&
             (t > 400 || hotNbr(w, x, y, 400)) && R() < 0.2) {
      w.el[i] = E.STEEL; w.ev.push(['smelt', x, y]); // bloomery steel: iron + carbon + kiln heat
    }
    else if (e === E.PHOSPHORUS && airAt(w, x, y) && (t > 30 || hotNbr(w, x, y, 100)) && R() < 0.05) {
      w.el[i] = E.FIRE; w.wet[i] = 0; w.ev.push(['ignite', x, y]); // white phosphorus: ~30C in air.
      // lava contact alone never lights it (no air = no combustion): vacuum stockpiles hold white-hot.
    }
    else if (e === E.SEED && belowSeedSoil(w, x, y) && w.wet[i] > 0.5 && R() < 0.1) {
      w.el[i] = E.SOIL; w.life[i] = LIFE.GRASS; w.lifeAmt[i] = 6; // germination
      w.ev.push(['sprout', x, y]);
    }
    else if (e === E.BONE && hasNbr(x, y, n => n === E.SOIL) && R() < 0.005) {
      w.el[i] = E.FERTILIZER; // bone meal: slow phosphorus for the bed
    }
    else if (e === E.BONE && hotNbr(w, x, y, 500)) {
      w.el[i] = E.ASH; w.ev.push(['scorch', x, y]); // cremation
    }
    else if (e === E.MERCURY && w.life[i] && R() < 0.05) {
      w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); // quicksilver poisoning
    }
    else if (e === E.CHLORINE) {
      if (hasNbr(x, y, n => n === E.WATER || n === E.BRINE) && R() < 0.05) {
        w.el[i] = E.EMPTY; w.ev.push(['dissolve', x, y]); // dissolves into bleach
      } else if (R() < 0.03) { // disinfectant drift: life nearby pays
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          const j = gidx(x + dx, y + dy);
          if (w.life[j] && R() < 0.4) { w.life[j] = 0; w.lifeAmt[j] = 0; w.ev.push(['perish', x + dx, y + dy]); }
        }
      }
    }
    else if (e === E.CHARCOAL && hasNbr(x, y, n => n === E.CHLORINE) && R() < 0.1) {
      // activated carbon drinks chlorine gas (but never dissolved salt — germs own desalination now)
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        const j = gidx(x + dx, y + dy);
        if (w.el[j] === E.CHLORINE) { w.el[j] = E.EMPTY; w.ev.push(['filter', x + dx, y + dy]); break; }
      }
    }
    else if (e === E.SALTPETRE && hasNbr(x, y, n => n === E.CHARCOAL) && R() < 0.1) {
      w.el[i] = E.GUNPOWDER; w.ev.push(['mix', x, y]); // niter + carbon: the gunpowder recipe
    }
    else if (e === E.DUST && hasNbr(x, y, n => n === E.WATER) && R() < 0.01) {
      w.el[i] = E.CLAY; // silt settles into potter's earth
    }
    else if (e === E.HAIL && t > 5 && R() < 0.05) {
      w.el[i] = E.WATER; w.wet[i] = 1; // spring melt
    }
    else if (e === E.CEMENT) {
      w.age[i] += 1;
      if (w.age[i] > 40) { w.el[i] = E.CONCRETE; w.age[i] = 0; w.ev.push(['cure', x, y]); }
    }
    else if (e === E.COAL && hasNbr(x, y, n => n === E.LAVA) && R() < 0.5) {
      w.el[i] = E.DIAMOND; w.ev.push(['transmute', x, y]); // lava-kissed coal flashes to diamond or burns
    }
    else if (e === E.COAL && (t > 400 || hotNbr(w, x, y, 400)) && R() < 0.01 && buriedBy(w, x, y)) {
      w.el[i] = E.DIAMOND; w.ev.push(['transmute', x, y]); // burial + heat: overburden pressure, the honest half
    }
    else if (e === E.COAL && (t > 600 || hotNbr(w, x, y, 600)) && R() < 0.05) {
      w.el[i] = E.DIAMOND; w.ev.push(['transmute', x, y]); // white-hot coal rearranges into diamond
    }
    else if (e === E.COAL && (t > 300 || hotNbr(w, x, y, 300) ||
             hasNbr(x, y, n => n === E.FIRE || n === E.LAVA)) && !buriedBy(w, x, y)) {
      w.el[i] = E.FIRE; w.wet[i] = 0; w.ev.push(['ignite', x, y]); // buried coal is starved of air
    }
    else if (e === E.FOAM) {
      if (hasNbr(x, y, n => n === E.FIRE)) {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          const j = gidx(x + dx, y + dy);
          if (w.el[j] === E.FIRE && R() < 0.5) { w.el[j] = E.SMOKE; w.wet[j] = 0; w.ev.push(['snuff', x + dx, y + dy]); }
        }
      }
      if (R() < 0.01) w.el[i] = E.EMPTY; // foam drains away
    }
    else if (e === E.URANIUM) {
      w.pt[i] += (45 - w.pt[i]) * 0.1; // warm to the touch, always
      if (R() < 0.02) { // hard radiation: life nearby pays
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          const j = gidx(x + dx, y + dy);
          if (w.life[j] && R() < 0.5) { w.life[j] = 0; w.lifeAmt[j] = 0; w.ev.push(['perish', x + dx, y + dy]); }
        }
      }
    }
    else if (e === E.FERTILIZER && hasNbr(x, y, n => n === E.WATER || n === E.BRINE) && R() < 0.05) {
      w.el[i] = E.EMPTY; w.ev.push(['feed', x, y]); // dissolved dinner for nearby plants
    }
    else if (e === E.CLAY && (t > 400 || hotNbr(w, x, y, 400))) {
      w.el[i] = E.BRICK; w.ev.push(['bake', x, y]); // kiln: fire or lava fires clay
    }
    else if (e === E.GUNPOWDER && (t > 200 || hotNbr(w, x, y, 200) ||
             hasNbr(x, y, n => n === E.FIRE || n === E.LAVA))) {
      explode(w, x, y, 4); // sparks + powder: a small bomb, and it chains
    }
    else if (e === E.SULFUR && hasNbr(x, y, n => n === E.WATER || n === E.STEAM || n === E.CLOUD) &&
             (t > 200 || hotNbr(w, x, y, 200))) {
      // hot wet sulfur breathes SO2: neighbouring water turns to acid rain
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        const j = gidx(x + dx, y + dy), n = w.el[j];
        if ((n === E.WATER || n === E.STEAM) && R() < 0.4) {
          w.el[j] = E.ACID; w.ev.push(['sour', x + dx, y + dy]);
        }
      }
      if (R() < 0.2) w.el[i] = E.SMOKE; // the sulfur burns itself away
    }
    else if (e === E.FERTILIZER && hasNbr(x, y, n => n === E.WATER || n === E.BRINE) && R() < 0.05) {
      w.el[i] = E.EMPTY; w.ev.push(['feed', x, y]); // dissolved dinner for nearby plants
    }
    else if (e === E.CRYO) {
      w.age[i] += 1; // boil-off clock on its own layer: diffusion must not stall it
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        const j = gidx(x + dx, y + dy), n = w.el[j];
        if ((n === E.WATER || n === E.BRINE) && R() < 0.3) {
          w.el[j] = E.ICE; w.ev.push(['frost', x + dx, y + dy]);
        }
        else if (n === E.STEAM && R() < 0.3) { w.el[j] = E.SNOW; w.ev.push(['frost', x + dx, y + dy]); }
      }
      if (w.age[i] > 60) { w.el[i] = E.EMPTY; w.age[i] = 0; w.ev.push(['steam', x, y]); }
    }
    else if (e === E.METAL && hasNbr(x, y, n => n === E.WATER) &&
             (w.Wd.o2 || w.o2 >= 5 || isDome(w, x, y)) && R() < 0.01) {
      w.el[i] = E.RUST; w.ev.push(['rust', x, y]); // oxidation needs water + air (banded iron needs a GOE first)
    }
    else if (e === E.TNT && (t > 300 || hasNbr(x, y, n => n === E.FIRE || n === E.LAVA))) {
      explode(w, x, y, 8);
    }
    else if (e === E.FIRE) {
      w.wet[i] += 1; // reuse wet as burn clock
      const air = airAt(w, x, y);
      let co2n = 0; // a CO2 or nitrogen blanket smothers even in open air
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        const g = w.el[gidx(x + dx, y + dy)];
        if (g === E.CO2 || g === E.NITROGEN) co2n++;
      }
      if ((!air || co2n >= 3) && R() < 0.5) { w.el[i] = E.SMOKE; w.wet[i] = 0; w.ev.push(['snuff', x, y]); }
      else {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          const j = gidx(x + dx, y + dy), n = w.el[j];
          if ((n === E.HYDROGEN || n === E.METHANE) && air) {
            explode(w, x + dx, y + dy, 4); // gas blast (+ water from H2 fire)
            continue;
          }
          if (n === E.TNT) { explode(w, x + dx, y + dy, 8); continue; }
          if ((n === E.WOOD || n === E.OIL || n === E.SULFUR || n === E.PEAT || n === E.WAX ||
               n === E.PAPER || n === E.SAWDUST || n === E.RUBBER || n === E.CHARCOAL || n === E.COAL ||
               n === E.AMBER || n === E.PHOSPHORUS || n === E.SUGAR || n === E.MEAT || n === E.SAP ||
               n === E.SHALE) && air && R() < 0.3 && !hasNbr(x + dx, y + dy, m => m === E.FOAM)) {
            w.el[j] = E.FIRE; w.wet[j] = 0; w.ev.push(['ignite', x + dx, y + dy]); // foam-coated fuel will not catch
          }
        }
        if (w.wet[i] > 8 + R() * 6) {
          // burnout banks coals first: flames die back to embers (which rekindle or finish to ash),
          // so every fire leaves a smouldering aftermath instead of winking straight out
          w.el[i] = R() < 0.4 ? E.EMBER : (R() < 0.7 ? E.SMOKE : E.ASH);
          w.wet[i] = 0;
        }
      }
    }
    else if (e === E.EMBER) {
      w.pt[i] = Math.max(w.pt[i], 450); w.wet[i] += 1; // banked heat: coals hold kiln-ish warmth
      if (hasNbr(x, y, n => n === E.WATER || n === E.BRINE) && R() < 0.5) {
        w.el[i] = E.SMOKE; w.wet[i] = 0; w.ev.push(['snuff', x, y]); // drowned coals
      } else {
        const air = airAt(w, x, y);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          const j = gidx(x + dx, y + dy), n = w.el[j];
          if ((n === E.WOOD || n === E.OIL || n === E.PEAT || n === E.PAPER || n === E.SAWDUST ||
               n === E.COAL || n === E.CHARCOAL) && air && R() < 0.15) {
            w.el[j] = E.FIRE; w.wet[j] = 0; w.ev.push(['ignite', x + dx, y + dy]); // the bed rekindles
          }
        }
        if (w.wet[i] > 20 + R() * 10) { w.el[i] = E.ASH; w.wet[i] = 0; } // coals burn down silent
      }
    }
    else if (e === E.SALT && hasNbr(x, y, n => n === E.WATER)) {
      w.el[i] = E.BRINE; w.wet[i] = 1; w.ev.push(['dissolve', x, y]);
    }
    else if (e === E.SUGAR && hasNbr(x, y, n => n === E.WATER || n === E.BRINE) && R() < 0.1) {
      w.el[i] = E.EMPTY; // sweet water: dissolves silent, feeds whoever finds it first
    }
    else if (e === E.MEAT && R() < 0.005) {
      w.el[i] = E.SOIL; w.ev.push(['rot', x, y]); // carrion composts where it lies
    }
    else if (e === E.GUANO && w.wet[i] > 0.3 && R() < 0.02) {
      w.el[i] = E.FERTILIZER; w.ev.push(['rot', x, y]); // guano composts into fertiliser, minus the centuries
    }
    else if (e === E.MUD && buriedBy(w, x, y) && R() < 0.02) {
      w.el[i] = E.SHALE; w.ev.push(['set', x, y]); // burial lithifies mud into shale
    }
    else if (e === E.SALT && hasNbr(x, y, n => n === E.LIME) && w.wet[i] > 0.5 && R() < 0.03) {
      w.el[i] = E.TRONA; w.ev.push(['set', x, y]); // damp soda salts crust trona, Mono Lake to Don Juan Pond
    }
    else if (e === E.SHALE && (t > 400 || hotNbr(w, x, y, 400)) && R() < 0.1) {
      w.el[i] = E.OIL; w.wet[i] = 0; w.ev.push(['crack', x, y]); // retorting: heat cracks kerogen to oil
    }
    else if (e === E.BONE && buriedBy(w, x, y) && R() < 0.003) {
      w.el[i] = E.FOSSIL; w.ev.push(['set', x, y]); // mineralised in the dark, minus the eons
    }
    else if (e === E.SAP && R() < 0.002) {
      w.el[i] = E.AMBER; // resin fossilises where it falls
    }
    else if (e === E.SAP && hasNbr(x, y, n => n === E.WATER || n === E.BRINE) && R() < 0.1) {
      w.el[i] = E.EMPTY; // sweet sap dissolves silent
    }
    else if (e === E.WIRE && t > 600) {
      w.el[i] = E.COPPER; // overloaded wire melts back into a copper blob
    }
    else if (e === E.BATTERY) {
      w.pt[i] += (80 - w.pt[i]) * 0.3; // a power cell runs warm; wire carries it away
      if (hasNbr(x, y, n => n === E.WATER || n === E.BRINE || n === E.FOAM) && R() < 0.2) {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          const j = gidx(x + dx, y + dy);
          if ((w.el[j] === E.WATER || w.el[j] === E.BRINE || w.el[j] === E.FOAM) && R() < 0.5) {
            w.el[j] = E.STEAM; w.wet[j] = 0; w.ev.push(['zap', x + dx, y + dy]); break;
          }
        }
      } else if (hasNbr(x, y, n => n === E.WOOD || n === E.OIL || n === E.PAPER || n === E.SAWDUST ||
          n === E.COAL || n === E.SUGAR || n === E.MEAT) && R() < 0.05) {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          const j = gidx(x + dx, y + dy);
          if (w.el[j] === E.WOOD || w.el[j] === E.OIL || w.el[j] === E.PAPER || w.el[j] === E.SAWDUST ||
              w.el[j] === E.COAL || w.el[j] === E.SUGAR || w.el[j] === E.MEAT) {
            w.el[j] = E.FIRE; w.wet[j] = 0; w.ev.push(['zap', x + dx, y + dy]); break;
          }
        }
      } else if (hasNbr(x, y, n => n === E.FIRE || n === E.LAVA || n === E.SUN) && R() < 0.1) {
        explode(w, x, y, 3); w.ev.push(['zap', x, y]); // cooked cells vent with flame
      }
    }
    else if (e === E.VOID) {
      // unmatter: deletes neighbours, spares its fellow tools (wall, void, clone)
      let ate = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        const j = gidx(x + dx, y + dy), n = w.el[j];
        if (n === E.EMPTY || n === E.WALL || n === E.VOID || n === E.CLONE) continue;
        w.el[j] = E.EMPTY; w.life[j] = 0; w.lifeAmt[j] = 0; w.tech[j] = 0; w.wet[j] = 0; ate = true;
      }
      if (ate) w.ev.push(['unmake', x, y]);
    }
    else if (e === E.CLONE && R() < 0.5) {
      // duplicates whatever touches it into empty neighbours — Sandboxels' favourite accident
      let src = 0;
      const voids = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        const j = gidx(x + dx, y + dy), n = w.el[j];
        if (n === E.EMPTY) voids.push(j);
        else if (n !== E.CLONE && n !== E.VOID && !src && R() < 0.5) src = n;
      }
      if (src && voids.length) {
        const j = voids[(R() * voids.length) | 0];
        w.el[j] = src; w.age[j] = 0; w.wet[j] = (src === E.WATER || src === E.BRINE) ? 1 : 0;
      }
    }
    else if (e === E.ACID) {
      // eats rock/dirt/sand, neutralised by soil
      for (let dy = -1; dy <= 1 && w.el[i] === E.ACID; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        const j = gidx(x + dx, y + dy), n = w.el[j];
        if (n === E.SOIL && R() < 0.2) { w.el[i] = E.EMPTY; w.ev.push(['fizz', x, y]); break; }
        if ((n === E.LIMESTONE || n === E.CHALK || n === E.MARBLE) && R() < 0.3) {
          w.el[j] = E.EMPTY; // carbonates fizz hard in acid
          if (R() < 0.3) w.el[i] = E.SMOKE;
          w.ev.push(['fizz', x + dx, y + dy]);
        }
        if ((n === E.ROCK || n === E.REGOLITH || n === E.SAND || n === E.CONCRETE || n === E.PUMICE || n === E.SANDSTONE || n === E.GRAVEL || n === E.PAPER || n === E.BASALT) && R() < 0.1) {
          w.el[j] = E.EMPTY;
          if (R() < 0.3) w.el[i] = E.SMOKE;
          w.ev.push(['fizz', x + dx, y + dy]);
        }
        if (n === E.COPPER && R() < 0.05) {
          w.el[j] = E.EMPTY; w.ev.push(['fizz', x + dx, y + dy]); // etched away
        }
        if (n === E.STEEL && R() < 0.05) {
          w.el[j] = E.EMPTY; w.ev.push(['fizz', x + dx, y + dy]); // bloomery steel still fears acid
        }
      }
    }
    else if (e === E.LAVA) {
      let quenched = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        const j = gidx(x + dx, y + dy), n = w.el[j];
        if ((n === E.WATER || n === E.ICE || n === E.BRINE) && R() < 0.3) {
          w.el[j] = E.STEAM; quenched = true; w.ev.push(['burst', x + dx, y + dy]);
        }
        if ((n === E.WOOD || n === E.OIL || n === E.SULFUR || n === E.PEAT || n === E.HYDROGEN || n === E.METHANE ||
             n === E.WAX || n === E.PAPER || n === E.SAWDUST || n === E.RUBBER || n === E.CHARCOAL || n === E.AMBER ||
             n === E.SUGAR || n === E.MEAT || n === E.SAP || n === E.SHALE) && R() < 0.4) {
          w.el[j] = E.FIRE; w.wet[j] = 0; w.ev.push(['ignite', x + dx, y + dy]);
        }
      }
      w.wet[i] += 1; // reuse wet as cool-down clock
      if (quenched || (w.wet[i] > 40 && T < 200)) {
        // quenched fast against ice/snow -> volcanic glass, else basalt
        w.el[i] = hasNbr(x, y, n => n === E.ICE || n === E.SNOW) ? E.OBSIDIAN : E.BASALT;
        w.wet[i] = 0; w.ev.push(['cool', x, y]);
      }
      if (w.life[i]) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['scorch', x, y]); }
    }
    else if (e === E.BASALT && w.id === 'io' && hasNbr(x, y, n => n === E.LAVA) && R() < 0.002) {
      w.el[i] = E.LAVA; w.erupt++; w.ev.push(['burst', x, y]); // tidal flexing cracks the crust open
    }
    else if (e === E.VENT) {
      // alkaline vent, Lost-City style (40-90°C waters): warms its whole neighbourhood toward
      // 90° like a heater holds +20 — capped, so clustered vents cannot stack.
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        if (dx * dx + dy * dy > 16 || !inG(x + dx, y + dy)) continue;
        const j = gidx(x + dx, y + dy);
        if (w.pt[j] < 90) w.pt[j] += (90 - w.pt[j]) * 0.5;
      }
      // white smoker: vent fluid meeting pool water lays carbonate chimneys — Lost City
      // grows its spires INTO the water, anchored to the vent mouth and older stone.
      // bare rock/ice melts within ticks of the 90° throat, so mid-pool water anchored
      // to solid ground counts as substrate; a mature clump (14+ limestone nearby) rests,
      // so the pool core outlives the chimney and can still seed germs.
      if (hasNbr(x, y, n => n === E.WATER || n === E.BRINE) && R() < 0.01) {
        let grown = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          if (w.el[gidx(x + dx, y + dy)] === E.LIMESTONE) grown++;
        }
        if (grown < 14) {
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy), n = w.el[j];
            if (n === E.ROCK || n === E.ICE || n === E.REGOLITH || n === E.SAND || n === E.SANDSTONE ||
                ((n === E.WATER || n === E.BRINE) && anchoredToStone(w, x + dx, y + dy))) {
              w.el[j] = E.LIMESTONE; w.ev.push(['smoker', x + dx, y + dy]); break;
            }
          }
        }
      }
      // abiogenesis, Lost-City style: a vent pool seeds germs all by itself,
      // rarely — no lightning required, only warm water, minerals and time
      if (R() < 0.002) {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          const j = gidx(x + dx, y + dy);
          if ((w.el[j] === E.WATER || w.el[j] === E.BRINE) && !w.life[j]) {
            w.life[j] = LIFE.GERMS; w.lifeAmt[j] = 12; w.ev.push(['genesis', x + dx, y + dy]); break;
          }
        }
      }
    }
    else if (e === E.SUN) {
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        const j = gidx(x + dx, y + dy), n = w.el[j];
        if ((n === E.WOOD || n === E.OIL || n === E.SULFUR || n === E.HYDROGEN || n === E.METHANE || n === E.PHOSPHORUS) && R() < 0.3) {
          w.el[j] = E.FIRE; w.wet[j] = 0; w.ev.push(['ignite', x + dx, y + dy]);
        }
      }
      if (w.life[i]) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['scorch', x, y]); }
    }
    else if (e === E.REGOLITH && w.wet[i] > 0.7 && hasNbr(x, y, n => n === E.WATER) && R() < 0.1) {
      w.el[i] = E.SOIL; w.ev.push(['mud', x, y]);
    }
    // moisture: capillary spread + drying (vacuum dries faster)
    if (e === E.WATER || e === E.BRINE) w.wet[i] = 1;
    else if (e !== E.ROCK && e !== E.EMPTY && e !== E.LAVA) {
      w.wet[i] *= (w.Wd.o2 ? 0.999 : 0.995);
    }
  }
  // moisture diffusion (snapshot)
  const mOld = Float32Array.from(w.wet);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const i = gidx(x, y);
    if (w.el[i] === E.WATER || w.el[i] === E.BRINE || w.el[i] === E.ROCK || w.el[i] === E.EMPTY) continue;
    let s = 0, n = 0;
    if (x > 0) { s += mOld[i - 1]; n++; }
    if (x < GW - 1) { s += mOld[i + 1]; n++; }
    if (y > 0) { s += mOld[i - GW]; n++; }
    if (y < GH - 1) { s += mOld[i + GW]; n++; }
    w.wet[i] += (s / n - w.wet[i]) * 0.15;
  }
  stepLife(w, T, dl);
  checkQuests(w, day);
  // population history for the live chart (capped: a session is not a dataset)
  w.hist.push({ g: w.counts.germs, m: w.counts.moss, gr: w.counts.grass });
  if (w.hist.length > 300) w.hist.shift();
}

function stepLife(w, T, dl) {
  const R = w.rng;
  let germs = 0, germTiles = 0, moss = 0, grass = 0, algae = 0, fungus = 0, lichen = 0, locusts = 0, salt = 0, acid = 0, water = 0, detox = 0, brick = 0, co2 = 0, glass = 0, lime = 0, limestone = 0;
  let vent = 0, wood = 0, soil = 0, sugar = 0, meat = 0, gold = 0, marble = 0, diamond = 0, steel = 0;
  let coral = 0, cactus = 0, sponge = 0, fern = 0, worms = 0, termites = 0;
  let virus = 0, fish = 0, bird = 0, ant = 0, tree = 0;
  let mushroom = 0, kelp = 0, flower = 0, bee = 0, shale = 0, sap = 0, fossil = 0, oil = 0;
  let honey = 0, guano = 0, trona = 0, rust = 0, sulfur = 0, fertilizer = 0, lava = 0;
  let clover = 0, spider = 0, shrimp = 0, archaea = 0, cyano = 0, strom = 0, tardi = 0, deino = 0;
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const i = gidx(x, y), e = w.el[i], L = w.life[i];
    if (e === E.SALT) salt++;
    if (e === E.ACID) acid++;
    if (e === E.WATER) water++;
    if (e === E.BRICK) brick++;
    if (e === E.CO2) co2++;
    if (e === E.GLASS) glass++;
    if (e === E.LIME) lime++;
    if (e === E.LIMESTONE) limestone++;
    if (e === E.VENT) vent++;
    if (e === E.WOOD) wood++;
    if (e === E.SOIL) soil++;
    if (e === E.SUGAR) sugar++;
    if (e === E.MEAT) meat++;
    if (e === E.GOLD) gold++;
    if (e === E.MARBLE) marble++;
    if (e === E.DIAMOND) diamond++;
    if (e === E.STEEL) steel++;
    if (e === E.SHALE) shale++;
    if (e === E.SAP) sap++;
    if (e === E.FOSSIL) fossil++;
    if (e === E.OIL) oil++;
    if (e === E.HONEY) honey++;
    if (e === E.GUANO) guano++;
    if (e === E.TRONA) trona++;
    if (e === E.RUST) rust++;
    if (e === E.SULFUR) sulfur++;
    if (e === E.FERTILIZER) fertilizer++;
    if (e === E.LAVA) lava++;
    if (!L) continue;
    const dome = isDome(w, x, y);
    const t = w.pt[i];
    const uv = w.Wd.uv * (0.03 + 0.97 * dl) * (dome ? 0.05 : 1) * (1 - 0.5 * w.reducer);
    if (w.pt[i] > 150) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['scorch', x, y]); continue; }
    if (L === LIFE.GERMS) {
      // evaporative cooling: sopping germs ride out noon heat
      const tMax = 60 + 60 * Math.min(1, w.wet[i]);
      if (w.wet[i] < 0.2 || t < -30 || t > tMax || R() < uv * 0.4) {
        if (R() < 0.5) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      }
      w.lifeAmt[i] = Math.min(60, w.lifeAmt[i] + w.lifeAmt[i] * (fedAt(w, x, y) ? 0.3 : 0.2) * Math.min(1, w.wet[i]));
      germs += w.lifeAmt[i]; germTiles++;
      if (e === E.BRINE && w.lifeAmt[i] > 10 && R() < 0.1) {
        w.el[i] = E.WATER; detox += 1; w.ev.push(['clean', x, y]); // eaters purify brine
      }
    } else if (L === LIFE.MOSS) {
      // evaporative cooling: wet moss survives noon, needs heat at night
      const tMax = 45 + 80 * Math.min(1, w.wet[i]);
      if (t < -20 || t > tMax || R() < uv * 0.5) {
        if (R() < 0.4) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      }
      moss++;
      const fed = fedAt(w, x, y);
      if (w.wet[i] > 0.3 && w.lifeAmt[i] > 3 && R() < (fed ? 0.35 : 0.2)) {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          const j = gidx(x + dx, y + dy);
          if ((w.el[j] === E.SOIL || w.el[j] === E.REGOLITH || w.el[j] === E.FERTILIZER) && (w.wet[j] > 0.3 || fed) && !w.life[j] && R() < 0.3) {
            w.life[j] = LIFE.MOSS; w.lifeAmt[j] = 3;
          }
        }
      }
    } else if (L === LIFE.ALGAE) {
      if (w.el[i] !== E.WATER && w.el[i] !== E.BRINE) { w.life[i] = 0; w.lifeAmt[i] = 0; continue; }
      if (dl < 0.25 || t < -5 || t > 45) {
        if (R() < 0.4) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      }
      algae++;
      w.lifeAmt[i] = Math.min(40, w.lifeAmt[i] + w.lifeAmt[i] * 0.15);
      if (R() < (fedAt(w, x, y) ? 0.35 : 0.2)) {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          const j = gidx(x + dx, y + dy);
          if ((w.el[j] === E.WATER || w.el[j] === E.BRINE) && !w.life[j] && R() < 0.3) {
            w.life[j] = LIFE.ALGAE; w.lifeAmt[j] = 3;
          }
        }
      }
    } else if (L === LIFE.CYANO) {
      // oxygenator: pond scum with a planet-scale exhaust — the Great Oxidation in one tile
      // hardy pioneer: dozes through nights and frost, exhales only in warm daylight
      if (w.el[i] !== E.WATER && w.el[i] !== E.BRINE) { w.life[i] = 0; w.lifeAmt[i] = 0; continue; }
      if (dl < 0.25 || t < -5 || t > 45) {
        cyano++; // dormant: alive, waiting for dawn
      } else {
        cyano++;
        const was = w.o2;
        w.o2 = Math.min(100, w.o2 + 0.008);
        if (!w.o2loud && was < 10 && w.o2 >= 10) { w.o2loud = true; w.ev.push(['oxygen', x, y]); }
        w.lifeAmt[i] = Math.min(40, w.lifeAmt[i] + w.lifeAmt[i] * 0.12);
        if (R() < (fedAt(w, x, y) ? 0.3 : 0.18)) {
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy);
            if ((w.el[j] === E.WATER || w.el[j] === E.BRINE) && !w.life[j] && R() < 0.3) {
              w.life[j] = LIFE.CYANO; w.lifeAmt[j] = 3;
            }
          }
        }
      }
    } else if (L === LIFE.FUNGUS) {
      // decomposer: eats dead wood/ash/soil in the damp, fears UV, needs no light
      const host = (e === E.WOOD || e === E.ASH || e === E.SOIL || e === E.FERTILIZER);
      if (!host || w.wet[i] < 0.4 || t < -10 || t > 45 || R() < uv * 0.6) {
        if (R() < 0.5) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      }
      fungus++;
      if (e === E.WOOD && R() < 0.008) {
        w.el[i] = E.SOIL; w.rot++; w.ev.push(['rot', x, y]); // decomposition closes the loop
      } else if (e === E.WOOD && R() < 0.004) {
        w.el[i] = E.COMPOST; w.rot++; w.ev.push(['rot', x, y]); // richer rot: compost feeds beds
      }
      if (R() < (fedAt(w, x, y) ? 0.4 : 0.25)) {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          const j = gidx(x + dx, y + dy);
          if ((w.el[j] === E.WOOD || w.el[j] === E.ASH || w.el[j] === E.SOIL || w.el[j] === E.FERTILIZER) &&
              w.wet[j] > 0.4 && !w.life[j] && R() < 0.3) {
            w.life[j] = LIFE.FUNGUS; w.lifeAmt[j] = 3;
          }
        }
      }
    } else if (L === LIFE.LICHEN) {
      // pioneer: colonises bare rock in the light, slowly, shrugs at UV;
      // nights go dormant, Antarctic-style, instead of dying
      const host = (e === E.ROCK || e === E.REGOLITH);
      if (!host || t < -80 || t > 50 || R() < uv * 0.3) {
        if (R() < 0.3) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      }
      lichen++;
      if (dl >= 0.25 && R() < (fedAt(w, x, y) ? 0.2 : 0.12)) {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          const j = gidx(x + dx, y + dy);
          if ((w.el[j] === E.ROCK || w.el[j] === E.REGOLITH) && !w.life[j] && R() < 0.3) {
            w.life[j] = LIFE.LICHEN; w.lifeAmt[j] = 3;
          }
        }
      }
    } else if (L === LIFE.LOCUSTS) {
      // swarm: strips neighbouring grass/moss, starves without prey, flies by day
      if (e === E.WATER || e === E.BRINE || e === E.ACID || e === E.LAVA ||
          e === E.EMPTY || t < 0 || t > 45 || R() < uv * 0.4) {
        if (R() < 0.5) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      }
      if (techNear(w, x, y, TECH.SCARECROW, 6) && R() < 0.4) {
        w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['flee', x, y]); continue; // the old straw man still works
      }
      let prey = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        const L2 = w.life[gidx(x + dx, y + dy)];
        if (L2 === LIFE.GRASS || L2 === LIFE.MOSS) { prey = true; break; }
      }
      if (!prey) {
        if (R() < 0.5) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      } else {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          const j = gidx(x + dx, y + dy);
          if ((w.life[j] === LIFE.GRASS || w.life[j] === LIFE.MOSS) && R() < 0.3) {
            w.life[j] = LIFE.LOCUSTS; w.lifeAmt[j] = 3; // the front advances through the meadow
            w.ev.push(['nibble', x + dx, y + dy]); break;
          }
        }
      }
      locusts++;
      if (prey && dl >= 0.25 && R() < 0.25) {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          const j = gidx(x + dx, y + dy);
          if ((w.el[j] === E.SOIL || w.el[j] === E.REGOLITH) && !w.life[j] && R() < 0.3) {
            w.life[j] = LIFE.LOCUSTS; w.lifeAmt[j] = 3;
          }
        }
      }
    } else if (L === LIFE.CORAL) {
      // reef-builder: mild lit shallows; heat, dark or acid bleach it, limestone accretes below
      const sea = (e === E.WATER || e === E.BRINE);
      if (!sea || dl < 0.25 || t < 5 || t > 35 ||
          hasNbrW(w, x, y, n => n === E.ACID || n === E.CHLORINE)) {
        if (R() < 0.4) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      }
      coral++;
      w.lifeAmt[i] = Math.min(40, w.lifeAmt[i] + w.lifeAmt[i] * 0.12);
      if (R() < 0.25) {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          const j = gidx(x + dx, y + dy);
          if ((w.el[j] === E.WATER || w.el[j] === E.BRINE) && !w.life[j] && R() < 0.3) {
            w.life[j] = LIFE.CORAL; w.lifeAmt[j] = 3;
          }
        }
      }
      if (w.lifeAmt[i] >= 20 && y + 1 < GH) { // a mature head lays down reef rock
        const b = gidx(x, y + 1);
        if ((w.el[b] === E.ROCK || w.el[b] === E.SAND || w.el[b] === E.SANDSTONE || w.el[b] === E.LIMESTONE) && R() < 0.1) {
          w.el[b] = E.LIMESTONE; w.lifeAmt[i] = 10; w.ev.push(['reef', x, y + 1]);
        }
      }
    } else if (L === LIFE.CACTUS) {
      // desert succulent: heat-worshipper, drought-proof, frost-shy
      const dhost = (e === E.SAND || e === E.SOIL || e === E.REGOLITH);
      if (!dhost || t < 0 || t > 60 || R() < uv * 0.4) {
        if (R() < 0.4) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      }
      cactus++;
      if (R() < 0.12) { // carries its own water: needs no wet to colonise
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          const j = gidx(x + dx, y + dy);
          if ((w.el[j] === E.SAND || w.el[j] === E.SOIL || w.el[j] === E.REGOLITH) && !w.life[j] && R() < 0.3) {
            w.life[j] = LIFE.CACTUS; w.lifeAmt[j] = 3;
          }
        }
      }
    } else if (L === LIFE.SPONGE) {
      // living filter: drinks foam and silt, keeps the pool clear
      const spsea = (e === E.WATER || e === E.BRINE);
      if (!spsea || t < -5 || t > 40) {
        if (R() < 0.4) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      } else {
        sponge++;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          const j = gidx(x + dx, y + dy);
          if ((w.el[j] === E.FOAM || w.el[j] === E.DUST) && R() < 0.2) {
            w.el[j] = E.EMPTY; w.lifeAmt[i] = Math.min(40, w.lifeAmt[i] + 2); w.ev.push(['filter', x + dx, y + dy]); break;
          }
        }
        if (R() < 0.15) {
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy);
            if ((w.el[j] === E.WATER || w.el[j] === E.BRINE) && !w.life[j] && R() < 0.3) {
              w.life[j] = LIFE.SPONGE; w.lifeAmt[j] = 3;
            }
          }
        }
      }
    } else if (L === LIFE.FERN) {
      // shade plant: grows under cloth or at night, scorches in open noon
      const fhost = (e === E.SOIL || e === E.FERTILIZER);
      const sh = techNear(w, x, y, TECH.SHADE, 5) || dl < 0.3;
      if (!fhost || !sh || w.wet[i] < 0.4 || t < 0 || t > 35) {
        if (R() < 0.4) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      }
      fern++;
      if (R() < 0.3) {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          const j = gidx(x + dx, y + dy);
          if ((w.el[j] === E.SOIL || w.el[j] === E.FERTILIZER) && w.wet[j] > 0.4 && !w.life[j] && R() < 0.3) {
            w.life[j] = LIFE.FERN; w.lifeAmt[j] = 3;
          }
        }
      }
    } else if (L === LIFE.WORMS) {
      // soil engineers: burrow through the bed, castings fertilise behind them
      const whost = (e === E.SOIL || e === E.FERTILIZER);
      if (!whost || t < 0 || t > 40) {
        if (R() < 0.4) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      } else {
        worms++;
        if (R() < 0.3) { // burrow: shift the colony into neighbouring soil
          const opts = [];
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy);
            if ((w.el[j] === E.SOIL || w.el[j] === E.FERTILIZER) && !w.life[j]) opts.push(j);
          }
          if (opts.length) {
            const j = opts[(R() * opts.length) | 0];
            w.life[j] = LIFE.WORMS; w.lifeAmt[j] = w.lifeAmt[i];
            w.life[i] = 0; w.lifeAmt[i] = 0; continue;
          }
        }
        if (e === E.SOIL && R() < 0.06) { w.el[i] = E.FERTILIZER; w.ev.push(['cast', x, y]); }
      }
    } else if (L === LIFE.TERMITES) {
      // wood-eaters: chew timber to sawdust, starve without it, freeze easily
      const thost = (e === E.WOOD || e === E.PAPER || e === E.SOIL);
      let timber = (e === E.WOOD || e === E.PAPER);
      if (!timber) {
        for (let dy = -1; dy <= 1 && !timber; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          const n = w.el[gidx(x + dx, y + dy)];
          if (n === E.WOOD || n === E.PAPER) { timber = true; break; }
        }
      }
      if (!thost || !timber || t < 5 || t > 45) {
        if (R() < 0.4) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      } else {
        termites++;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          const j = gidx(x + dx, y + dy);
          if ((w.el[j] === E.WOOD || w.el[j] === E.PAPER) && R() < 0.3) {
            w.el[j] = E.SAWDUST; w.ev.push(['gnaw', x + dx, y + dy]); break;
          }
        }
        if (R() < 0.2) {
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy);
            if ((w.el[j] === E.WOOD || w.el[j] === E.PAPER || w.el[j] === E.SOIL) && !w.life[j] && R() < 0.3) {
              w.life[j] = LIFE.TERMITES; w.lifeAmt[j] = 3;
            }
          }
        }
      }
    } else if (L === LIFE.VIRUS) {
      // hijacker: converts neighbouring germs, dies in UV, heat or loneliness
      let germNear = false;
      for (let dy = -1; dy <= 1 && !germNear; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        if (w.life[gidx(x + dx, y + dy)] === LIFE.GERMS) { germNear = true; break; }
      }
      if (!germNear || t < -10 || t > 45 || R() < uv * 0.5) {
        if (R() < 0.3) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      } else {
        virus++;
        if (R() < 0.35) {
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy);
            if (w.life[j] === LIFE.GERMS && R() < 0.4) {
              w.life[j] = LIFE.VIRUS; w.lifeAmt[j] = 3; w.ev.push(['sicken', x + dx, y + dy]); break;
            }
          }
        }
      }
    } else if (L === LIFE.FISH) {
      // grazer: needs open water, mild temps, algae to eat and clean neighbours
      const fsea = (e === E.WATER || e === E.BRINE);
      let fed = false;
      for (let dy = -1; dy <= 1 && !fed; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        const j = gidx(x + dx, y + dy);
        if (w.life[j] === LIFE.ALGAE) {
          fed = true;
          if (R() < 0.3) { w.life[j] = 0; w.lifeAmt[j] = 0; w.lifeAmt[i] = Math.min(40, w.lifeAmt[i] + 4); w.ev.push(['hunt', x + dx, y + dy]); }
          break;
        }
      }
      if (!fsea || t < 0 || t > 35 || hasNbrW(w, x, y, n => n === E.ACID || n === E.CHLORINE)) {
        if (R() < 0.4) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      } else {
        fish++;
        if (!fed && R() < 0.05) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
        if (fed && R() < 0.2) {
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy);
            if ((w.el[j] === E.WATER || w.el[j] === E.BRINE) && !w.life[j] && R() < 0.3) {
              w.life[j] = LIFE.FISH; w.lifeAmt[j] = 3;
            }
          }
        }
      }
    } else if (L === LIFE.BIRD) {
      // osprey-kestrel: takes locusts and fish, gleans seeds, starves without game
      let game = false; // raptor eyes: game spotted three tiles out, struck adjacent
      for (let dy = -3; dy <= 3 && !game; dy++) for (let dx = -3; dx <= 3; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        const gj = gidx(x + dx, y + dy);
        if (w.life[gj] === LIFE.LOCUSTS || w.life[gj] === LIFE.FISH || w.el[gj] === E.SEED) { game = true; break; }
      }
      if (e === E.WATER || e === E.BRINE || e === E.LAVA || e === E.ACID || !airAt(w, x, y) || t < 0 || t > 40) {
        if (R() < 0.4) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      } else {
        bird++;
        if (game && R() < 0.4) {
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy);
            const prey = w.life[j];
            if ((prey === LIFE.LOCUSTS && R() < 0.5) || (prey === LIFE.FISH && R() < 0.15)) {
              w.life[j] = 0; w.lifeAmt[j] = 0; w.lifeAmt[i] = Math.min(40, w.lifeAmt[i] + 4); w.ev.push(['hunt', x + dx, y + dy]); break;
            }
          }
        }
        if (!game && R() < 0.08) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; } // warm blood buys time
        if (game && R() < 0.15) {
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy);
            if (w.el[j] !== E.WATER && w.el[j] !== E.BRINE && w.el[j] !== E.LAVA && w.el[j] !== E.ACID && !w.life[j] && R() < 0.3) {
              w.life[j] = LIFE.BIRD; w.lifeAmt[j] = 3;
            }
          }
        }
        if (R() < 0.08) { // colonies whitewash the cliffs: guano islands are fertiliser mines
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy);
            const nj = w.el[j];
            if ((nj === E.EMPTY || ((nj === E.ROCK || nj === E.SOIL) && !w.life[j])) && R() < 0.3) {
              w.el[j] = E.GUANO; w.ev.push(['feed', x + dx, y + dy]); break;
            }
          }
        }
      }
    } else if (L === LIFE.ANT) {
      // foragers: haul sugar, meat, seeds and honey home, nest in soil
      const ahost = (e === E.SOIL || e === E.FERTILIZER || e === E.SAND);
      let forage = false;
      for (let dy = -1; dy <= 1 && !forage; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        const n = w.el[gidx(x + dx, y + dy)];
        if (n === E.SUGAR || n === E.MEAT || n === E.SEED || n === E.HONEY) { forage = true; break; }
      }
      if (!ahost || t < 5 || t > 40) {
        if (R() < 0.4) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      } else {
        ant++;
        if (forage && R() < 0.4) {
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy), n = w.el[j];
            if ((n === E.SUGAR || n === E.MEAT || n === E.SEED || n === E.HONEY) && R() < 0.4) {
              w.el[j] = E.EMPTY; w.lifeAmt[i] = Math.min(40, w.lifeAmt[i] + 3); w.ev.push(['hunt', x + dx, y + dy]); break;
            }
          }
        }
        if (!forage && R() < 0.1) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
        if (R() < 0.15) {
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy);
            if ((w.el[j] === E.SOIL || w.el[j] === E.FERTILIZER || w.el[j] === E.SAND) && !w.life[j] && R() < 0.3) {
              w.life[j] = LIFE.ANT; w.lifeAmt[j] = 3;
            }
          }
        }
      }
    } else if (L === LIFE.TREE) {
      // forest giant: roots in damp soil, drops seeds, outlives the gardener
      const thost = (e === E.SOIL || e === E.FERTILIZER);
      if (!thost || w.wet[i] < 0.3 || t < 0 || t > 35) {
        if (R() < 0.3) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      } else {
        tree++;
        w.lifeAmt[i] = Math.min(60, w.lifeAmt[i] + 0.4);
        if (w.lifeAmt[i] >= 30 && R() < 0.02) { // old trees weep resin onto bare ground
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy), n = w.el[j];
            if (!w.life[j] && (n === E.SOIL || n === E.FERTILIZER || n === E.ROCK || n === E.REGOLITH ||
                n === E.SAND || n === E.WOOD) && R() < 0.3) { w.el[j] = E.SAP; w.age[j] = 0; break; }
          }
        }
        if (R() < 0.05) { // seed rain on bare damp soil
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy);
            if ((w.el[j] === E.SOIL || w.el[j] === E.FERTILIZER) && w.wet[j] > 0.3 && !w.life[j] && R() < 0.3) {
              w.el[j] = E.SEED; w.ev.push(['sprout', x + dx, y + dy]); break;
            }
          }
        }
        if (w.lifeAmt[i] >= 30 && R() < 0.05) { // saplings at the roots
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy);
            if ((w.el[j] === E.SOIL || w.el[j] === E.FERTILIZER) && !w.life[j] && R() < 0.3) {
              w.life[j] = LIFE.TREE; w.lifeAmt[j] = 3;
            }
          }
        }
      }
    } else if (L === LIFE.MUSHROOM) {
      // fruiting body: rises from damp rot where fungus already holds, fears daylight
      const mhost = (e === E.WOOD || e === E.ASH || e === E.SOIL || e === E.FERTILIZER || e === E.COMPOST);
      let rotNear = false;
      for (let dy = -1; dy <= 1 && !rotNear; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        if (w.life[gidx(x + dx, y + dy)] === LIFE.FUNGUS) { rotNear = true; break; }
      }
      const dark = techNear(w, x, y, TECH.SHADE, 5) || dl < 0.3; // shade cloth or night, like ferns
      if (!mhost || !rotNear || w.wet[i] < 0.4 || t < 0 || t > 35 || !dark) {
        if (R() < 0.3) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      } else {
        mushroom++;
        w.lifeAmt[i] = Math.min(30, w.lifeAmt[i] + 0.3);
        if (R() < 0.08) { // spore drop on nearby damp rot
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy), n = w.el[j];
            if ((n === E.WOOD || n === E.ASH || n === E.SOIL || n === E.FERTILIZER || n === E.COMPOST) &&
                w.wet[j] > 0.4 && !w.life[j] && R() < 0.3) {
              w.life[j] = LIFE.MUSHROOM; w.lifeAmt[j] = 3;
            }
          }
        }
      }
    } else if (L === LIFE.KELP) {
      // underwater forest: roots in open water, drinks daylight, grazed like algae
      const ksea = (e === E.WATER || e === E.BRINE);
      if (!ksea || t < 0 || t > 30 || hasNbrW(w, x, y, n => n === E.ACID || n === E.CHLORINE)) {
        if (R() < 0.4) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      } else {
        kelp++;
        w.lifeAmt[i] = Math.min(50, w.lifeAmt[i] + 0.3);
        if (dl >= 0.25 && R() < 0.2) { // forests grow by day, persist by night
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy);
            if ((w.el[j] === E.WATER || w.el[j] === E.BRINE) && !w.life[j] && R() < 0.3) {
              w.life[j] = LIFE.KELP; w.lifeAmt[j] = 3;
            }
          }
        }
      }
    } else if (L === LIFE.FLOWER) {
      // bloomer: cold-hardy perennial - roots persist nights and frost, blooms need damp soil, warmth and daylight
      const fhost = (e === E.SOIL || e === E.FERTILIZER);
      if (!fhost || w.wet[i] < 0.3) {
        if (R() < 0.3) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      } else if (t < 0 || t > 35) {
        flower++; // dormant: alive, waiting out the cold or heat
      } else {
        flower++;
        w.lifeAmt[i] = Math.min(40, w.lifeAmt[i] + 0.3);
        if (dl >= 0.25 && R() < 0.08) { // blooms open by day
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy);
            if ((w.el[j] === E.SOIL || w.el[j] === E.FERTILIZER) && w.wet[j] > 0.3 && !w.life[j] && R() < 0.3) {
              w.el[j] = E.SEED; w.ev.push(['sprout', x + dx, y + dy]); break;
            }
          }
        }
      }
    } else if (L === LIFE.BEE) {
      // pollinator: works flowers, carries seeds in the bargain, starves without blooms
      let bloomNear = false;
      for (let dy = -1; dy <= 1 && !bloomNear; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        if (w.life[gidx(x + dx, y + dy)] === LIFE.FLOWER) { bloomNear = true; break; }
      }
      if (!bloomNear || t < 0 || t > 40 || R() < uv * 0.3) {
        if (R() < 0.3) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      } else {
        bee++;
        if (R() < 0.3) { // harvest: nectar for the hive, seeds for the meadow
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy);
            if (w.life[j] === LIFE.FLOWER && R() < 0.4) {
              w.lifeAmt[i] = Math.min(40, w.lifeAmt[i] + 4); w.ev.push(['bloom', x + dx, y + dy]);
              for (let ey = -1; ey <= 1; ey++) for (let ex = -1; ex <= 1; ex++) {
                const kx = x + dx + ex, ky = y + dy + ey;
                if (!inG(kx, ky)) continue;
                const k = gidx(kx, ky);
                if ((w.el[k] === E.SOIL || w.el[k] === E.FERTILIZER) && w.wet[k] > 0.3 && !w.life[k] && R() < 0.2) {
                  w.el[k] = E.SEED;
                }
              }
              break;
            }
          }
          if (w.lifeAmt[i] >= 10 && R() < 0.35) { // the hive puts up honey: colonies winter on stored nectar
            for (let hy = -1; hy <= 1; hy++) for (let hx = -1; hx <= 1; hx++) {
              if (!hx && !hy || !inG(x + hx, y + hy)) continue;
              const q = gidx(x + hx, y + hy);
              const nq = w.el[q];
              if ((nq === E.EMPTY || ((nq === E.SOIL || nq === E.FERTILIZER || nq === E.SEED) && !w.life[q])) && R() < 0.4) {
                w.el[q] = E.HONEY; w.ev.push(['feed', x + hx, y + hy]); break;
              }
            }
          }
        }
        if (w.lifeAmt[i] >= 20 && R() < 0.1) { // the hive swarms
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy);
            if (w.el[j] !== E.WATER && w.el[j] !== E.BRINE && w.el[j] !== E.LAVA && w.el[j] !== E.ACID &&
                !w.life[j] && R() < 0.3) {
              w.life[j] = LIFE.BEE; w.lifeAmt[j] = 3; w.lifeAmt[i] = 8;
            }
          }
        }
      }
    } else if (L === LIFE.GRASS) {
      const gsoil = (w.el[i] === E.SOIL || w.el[i] === E.FERTILIZER);
      if (!airAt(w, x, y) || !gsoil || w.wet[i] < 0.35 || t < 0 || t > 40) {
        w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['wither', x, y]); continue; // the air lesson
      }
      grass++;
      const fedg = fedAt(w, x, y);
      if (R() < (fedg ? 0.45 : 0.3)) {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          const j = gidx(x + dx, y + dy);
          if ((w.el[j] === E.SOIL || w.el[j] === E.FERTILIZER) && (w.wet[j] > 0.35 || fedg) && !w.life[j] && R() < 0.3) {
            w.life[j] = LIFE.GRASS; w.lifeAmt[j] = 3;
          }
        }
      }
    } else if (L === LIFE.CLOVER) {
      // nitrogen-fixer: clover feeds the soil it stands in, the way rotations rest fields
      const csoil = (w.el[i] === E.SOIL || w.el[i] === E.FERTILIZER);
      if (!airAt(w, x, y) || !csoil || w.wet[i] < 0.35 || t < 0 || t > 40) {
        w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['wither', x, y]); continue;
      }
      clover++;
      const fedc = fedAt(w, x, y);
      if (R() < (fedc ? 0.4 : 0.25)) {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          const j = gidx(x + dx, y + dy);
          if ((w.el[j] === E.SOIL || w.el[j] === E.FERTILIZER) && (w.wet[j] > 0.35 || fedc) && !w.life[j] && R() < 0.3) {
            w.life[j] = LIFE.CLOVER; w.lifeAmt[j] = 3;
          } else if (w.el[j] === E.SOIL && !w.life[j] && R() < 0.03) {
            w.el[j] = E.FERTILIZER; w.ev.push(['feed', x + dx, y + dy]); // rhizobia pay rent in nitrogen
          }
        }
      }
    } else if (L === LIFE.SPIDER) {
      // pest control: takes ants and locusts, spares the bees, starves without prey
      const shost = (e === E.SOIL || e === E.FERTILIZER || e === E.SAND);
      let prey = false;
      for (let dy = -1; dy <= 1 && !prey; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        const pj = w.life[gidx(x + dx, y + dy)];
        if (pj === LIFE.ANT || pj === LIFE.LOCUSTS) { prey = true; break; }
      }
      if (!shost || t < 0 || t > 40) {
        if (R() < 0.4) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      } else {
        spider++;
        if (prey && R() < 0.4) {
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy);
            if ((w.life[j] === LIFE.ANT || w.life[j] === LIFE.LOCUSTS) && R() < 0.5) {
              w.life[j] = 0; w.lifeAmt[j] = 0; w.lifeAmt[i] = Math.min(40, w.lifeAmt[i] + 4); w.ev.push(['hunt', x + dx, y + dy]); break;
            }
          }
        }
        if (!prey && R() < 0.1) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
        if (w.lifeAmt[i] >= 20 && R() < 0.1) {
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy);
            if ((w.el[j] === E.SOIL || w.el[j] === E.SAND) && !w.life[j] && R() < 0.3) {
              w.life[j] = LIFE.SPIDER; w.lifeAmt[j] = 3; w.lifeAmt[i] = 8;
            }
          }
        }
      }
    } else if (L === LIFE.SHRIMP) {
      // brine grazer: Artemia's niche is water too salty for fish, with algae to eat
      const ssea = (e === E.BRINE);
      let sfed = false;
      for (let dy = -1; dy <= 1 && !sfed; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        const j = gidx(x + dx, y + dy);
        if (w.life[j] === LIFE.ALGAE) {
          sfed = true;
          if (R() < 0.2) { w.life[j] = 0; w.lifeAmt[j] = 0; w.lifeAmt[i] = Math.min(40, w.lifeAmt[i] + 3); w.ev.push(['nibble', x + dx, y + dy]); }
          break;
        }
      }
      if (!ssea || t < 0 || t > 35) {
        if (R() < 0.4) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      } else {
        shrimp++;
        if (!sfed && R() < 0.05) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
        if (sfed && R() < 0.2) {
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy);
            if (w.el[j] === E.BRINE && !w.life[j] && R() < 0.3) {
              w.life[j] = LIFE.SHRIMP; w.lifeAmt[j] = 3;
            }
          }
        }
      }
    } else if (L === LIFE.ARCHAEA) {
      // hyperthermophile: hot-spring fauna (Taq grows 50-80, holds on from 40), dies in warm water
      const asea = (e === E.WATER || e === E.BRINE);
      if (!asea || t < 40 || t > 110) {
        if (R() < 0.4) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      } else {
        archaea++;
        w.lifeAmt[i] = Math.min(40, w.lifeAmt[i] + 0.3);
        if (R() < 0.15) {
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy);
            if ((w.el[j] === E.WATER || w.el[j] === E.BRINE) && !w.life[j] && R() < 0.3) {
              w.life[j] = LIFE.ARCHAEA; w.lifeAmt[j] = 3;
            }
          }
        }
      }
    } else if (L === LIFE.STROM) {
      // stromatolite: sunlit mats that rain limestone — needs builders (cyano/algae) beside it
      let feed = false;
      for (let dy = -1; dy <= 1 && !feed; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        const fj = w.life[gidx(x + dx, y + dy)];
        if (fj === LIFE.CYANO || fj === LIFE.ALGAE) { feed = true; break; }
      }
      const shome = (e === E.WATER || e === E.BRINE || e === E.LIMESTONE); // mats creep across their own reef
      if (!shome) {
        if (R() < 0.4) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      } else if (dl < 0.25 || t < 0 || t > 40 || e === E.LIMESTONE) {
        strom++; // dormant: mats wait out nights and chills, and rest on finished rock
      } else {
        strom++;
        if (feed && R() < 0.1) { // a day's growth: trap sediment, precipitate carbonate, entomb the builders
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy);
            if ((w.el[j] === E.WATER || w.el[j] === E.BRINE) && w.life[j] !== LIFE.STROM && R() < 0.3) {
              w.el[j] = E.LIMESTONE; w.ev.push(['reef', x + dx, y + dy]); break;
            }
          }
        }
        if (feed && R() < 0.08) {
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy);
            if ((w.el[j] === E.WATER || w.el[j] === E.BRINE) && !w.life[j] && R() < 0.3) {
              w.life[j] = LIFE.STROM; w.lifeAmt[j] = 3;
            }
          }
        }
      }
    } else if (L === LIFE.TARDI) {
      // water bear: grazes mild water, tun-dormant through everything else — vacuum, frost, noon heat
      const active = (e === E.WATER || e === E.BRINE) && t >= 0 && t <= 30;
      tardi++; // tun or active, it counts: dormancy is survival, not death
      if (active) {
        w.lifeAmt[i] = Math.min(40, w.lifeAmt[i] + 0.2);
        if (R() < 0.06) {
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy || !inG(x + dx, y + dy)) continue;
            const j = gidx(x + dx, y + dy);
            if ((w.el[j] === E.WATER || w.el[j] === E.BRINE) && !w.life[j] && R() < 0.3) {
              w.life[j] = LIFE.TARDI; w.lifeAmt[j] = 3;
            }
          }
        }
      }
    } else if (L === LIFE.DEINO) {
      // Conan the Bacterium: shrugs off UV that kills germs, dozes through frost, remediates uranium into lead
      if (w.wet[i] < 0.2 || t > 60) {
        if (R() < 0.5) { w.life[i] = 0; w.lifeAmt[i] = 0; w.ev.push(['perish', x, y]); continue; }
      }
      deino++;
      if (t < -5) continue; // dormant: frozen but viable, like the real microbe
      w.lifeAmt[i] = Math.min(60, w.lifeAmt[i] + w.lifeAmt[i] * 0.1 * Math.min(1, w.wet[i]));
      if (R() < 0.15) {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy || !inG(x + dx, y + dy)) continue;
          const j = gidx(x + dx, y + dy);
          if (w.wet[j] > 0.2 && w.el[j] !== E.WATER && w.el[j] !== E.BRINE && w.el[j] !== E.LAVA &&
              w.el[j] !== E.ACID && !w.life[j] && R() < 0.3) {
            w.life[j] = LIFE.DEINO; w.lifeAmt[j] = 6;
          }
        }
      }
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { // bioremediation shift
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        const j = gidx(x + dx, y + dy);
        if (w.el[j] === E.URANIUM && R() < 0.05) {
          w.el[j] = E.LEAD; w.uClean++; w.ev.push(['clean', x + dx, y + dy]); break;
        }
      }
    }
  }
  // cumulative selection for brine-eaters
  if (detox > 0) w.reducer = Math.min(1, w.reducer * 0.9995 + detox * 0.005);
  // ecosystem score: Shannon diversity over lifeform tile counts (the ABM's own index, grown up)
  const tiles = [germTiles, moss, grass, algae, fungus, lichen, locusts, coral, cactus, sponge, fern, worms, termites,
    virus, fish, bird, ant, tree, mushroom, kelp, flower, bee];
  const pop = tiles.reduce((a, b) => a + b, 0);
  let ecoH = 0, richness = 0;
  for (const n of tiles) {
    if (n <= 0) continue;
    richness++;
    const p = n / pop;
    ecoH -= p * Math.log(p);
  }
  w.counts = { germs: Math.round(germs), moss, grass, algae, fungus, lichen, locusts, salt, acid, water, brick, co2, glass, lime, limestone,
    coral, cactus, sponge, fern, worms, termites, vent, wood, soil, virus, fish, bird, ant, tree, sugar, meat,
    gold, marble, diamond, steel, mushroom, kelp, flower, bee, shale, sap, fossil, oil,
    honey, guano, trona, rust, sulfur, fertilizer, lava,
    clover, spider, shrimp, archaea, cyano, strom, tardi, deino,
    ecoH: Math.round(ecoH * 1000) / 1000, richness, biomass: pop };
}

const QUESTS = [
  { id: 'E1', world: 'earth', name: 'Meadow', goal: 'grow 150 grass',
    done: (w, c) => c.grass >= 150, guide: 'Soil bed, water it damp FIRST (sprinkler, or a pool touching the bed — never over it), then plant grass on damp dirt. Dry-planted grass withers in seconds.' },
  { id: 'E2', world: 'earth', name: 'Acid spill', goal: 'leave zero acid (bury it in soil)',
    done: (w, c) => w.sol > 30 && c.acid === 0, guide: 'Soil buffers acid — dilution is a real cleanup tactic.' },
  { id: 'M1', world: 'moon', name: 'Ice harvest', goal: 'hold 20+ liquid water at dawn (bank ice overnight, melt it)',
    done: (w, c) => w.m1done, guide: 'Lunar water must be banked as ice overnight, melted at dawn.' },
  { id: 'M2', world: 'moon', name: 'Night greenhouse', goal: 'have 40 moss alive at dawn',
    done: (w, c) => w.m2done, guide: 'Greenhouses (dome + heat) beat a 250° swing. Cluster the moss inside one heater warm disc, keep it damp, hold 40 alive through the night into the dawn census.' },
  { id: 'R1', world: 'mars', name: 'De-poison', goal: 'zero salt + 800 germs alive',
    done: (w, c) => c.salt === 0 && c.germs >= 800, guide: 'Dissolve the poison, then let eaters finish it.' },
  { id: 'R2', world: 'mars', name: 'Bloom', goal: 'grow 100 moss',
    done: (w, c) => c.moss >= 100, guide: 'Succession: microbes ready the ground, moss follows — but nights kill unheated moss and day-UV shreds undomed moss. Dome + two heaters + water, then plant big.' },
  { id: 'E3', world: 'earth', name: 'Kiln', goal: 'fire 20+ clay into brick',
    done: (w, c) => c.brick >= 20, guide: 'Dig clay, bake it past 400° — pottery scales up to industry.' },
  { id: 'M3', world: 'moon', name: 'Heavy air', goal: 'pool 50+ CO₂ in a crater',
    done: (w, c) => c.co2 >= 50, guide: 'CO₂ is heavy: pour it in a pit and it stays, smothering flames.' },
  { id: 'R3', world: 'mars', name: 'Dome bloom', goal: 'grow 60 grass inside a dome',
    done: (w, c) => c.grass >= 60, guide: 'Air, soil, water, mild temps — a dome carries all four on Mars.' },
  { id: 'E4', world: 'earth', name: 'Compost', goal: 'rot 25 wood into soil',
    done: (w, c) => w.rot >= 25, guide: 'Fungus eats dead wood and leaves soil behind — the rot economy.' },
  { id: 'M4', world: 'moon', name: 'Glass house', goal: 'make 30 glass',
    done: (w, c) => c.glass >= 30, guide: 'Sand plus a pinned sun (or a stoked heat ray) vitrifies. Greenhouses need glazing.' },
  { id: 'R4', world: 'mars', name: 'First footprints', goal: 'grow 70 lichen',
    done: (w, c) => c.lichen >= 70, guide: 'Lichens pioneer bare rock in the light — the first green on a dead world.' },
  { id: 'U1', world: 'europa', name: 'Meltwater', goal: 'hold 25 liquid water',
    done: (w, c) => c.water >= 25, guide: 'Ice plus heaters: meltwater is where Europan life would sip.' },
  { id: 'U2', world: 'europa', name: 'Brine garden', goal: 'grow 50 moss',
    done: (w, c) => c.moss >= 50, guide: 'Domes + heaters over brine — import soil, then plant a Europan greenhouse.' },
  { id: 'H1', world: 'hadean', name: 'Acid pond', goal: 'brew 20 acid from sulfur',
    done: (w, c) => c.acid >= 20, guide: 'Hot sulfur + water breathes acid — Hadean rain.' },
  { id: 'H2', world: 'hadean', name: 'Hot garden', goal: 'grow 300 germs',
    done: (w, c) => c.germs >= 300, guide: 'Hadean days are mild for wet germs under a UV roof — thermophiles inherit the Earth.' },
  { id: 'E5', world: 'earth', name: 'Swarm', goal: 'host 50 locusts',
    done: (w, c) => c.locusts >= 50, guide: 'Raise a RIPE meadow (150+ grass on damp soil), then loose the swarm: the count spikes as they strip it — the quest fires at the peak, then the field crashes. That is the plague.' },
  { id: 'E6', world: 'earth', name: 'Quicklime', goal: 'calcine 10 limestone into lime',
    done: (w, c) => c.lime >= 10, guide: 'Burn limestone in a kiln — quicklime built Rome.' },
  { id: 'E7', world: 'earth', name: 'Straw guardian', goal: 'host 30 locusts beside a scarecrow',
    done: (w, c) => c.locusts >= 30 && Array.from(w.tech).includes(TECH.SCARECROW), guide: 'The old straw man still works — scarecrows clear a swarm without poison.' },
  { id: 'E8', world: 'earth', name: 'Reef', goal: 'grow 25 coral',
    done: (w, c) => c.coral >= 25, guide: 'Water will not paint over solid rock: erase a lagoon in the shelf first, flood it, seed coral at dawn — count the bloom at noon, before nightfall.' },
  { id: 'U3', world: 'europa', name: 'Warm pool', goal: 'hold 20 liquid water around a vent',
    done: (w, c) => c.water >= 20, guide: 'Vents hold 90° in the ice — melt pools no heater can match. Mind the white smokers.' },
  { id: 'U4', world: 'europa', name: 'White smoker', goal: 'grow 12 limestone at a vent',
    done: (w, c) => c.limestone >= 12, guide: 'Alkaline vents lay carbonate chimneys — Lost City, where life may have begun.' },
  { id: 'H3', world: 'hadean', name: 'Glass shore', goal: 'vitrify 10 sand at a lava vent',
    done: (w, c) => c.glass >= 10, guide: 'Bank sand against a lava vent — volcanic heat vitrifies it, no sun required.' },
  { id: 'H4', world: 'hadean', name: 'Shade garden', goal: 'grow 50 fungus',
    done: (w, c) => c.fungus >= 50, guide: 'Shade cloth plus night air: 41° days, 25° nights — fungus country.' },
  { id: 'E9', world: 'earth', name: 'Web of life', goal: 'reach Shannon diversity 1.4',
    done: (w, c) => c.ecoH >= 1.4, guide: 'Many species, evenly spread — the Shannon index ecologists actually use. Paint a little of everything.' },
  { id: 'H5', world: 'hadean', name: 'Primordial soup', goal: 'hold 70 water while a vent stands',
    done: (w, c) => c.water >= 70 && c.vent > 0, guide: 'Salt a vent pool into brine — fresh water boils past 60° in vacuum. Dig a rock basin so it stays put.' },
  { id: 'H6', world: 'hadean', name: 'Genesis', goal: 'raise 100 germs from a vent pool',
    done: (w, c) => c.germs >= 100, guide: 'Tend a salted vent pool under a dome and wait — the water seeds germs by itself. Grow them to a hundred.' },
  { id: 'T1', world: 'titan', name: 'Oasis', goal: 'hold 20 liquid water',
    done: (w, c) => c.water >= 20, guide: 'Five heaters over the ice bedrock hold a pool at −180° ambient — meltwater is precious here too.' },
  { id: 'T2', world: 'titan', name: 'Hothouse', goal: 'grow 40 moss',
    done: (w, c) => c.moss >= 40, guide: 'Dome + heaters + sprinkler over imported soil: a hothouse on an ice moon. Nothing grows unheated.' },
  { id: 'T3', world: 'titan', name: 'Sun glass', goal: 'vitrify 15 sand with pinned suns',
    done: (w, c) => c.glass >= 15, guide: 'No lava on Titan — pin a cluster of suns over the dunes instead. Import sand if the dunes drift thin.' },
  { id: 'T4', world: 'titan', name: 'Nuggets', goal: 'smelt 5 gold from ore',
    done: (w, c) => c.gold >= 5, guide: 'Paint copper ore by the kiln: bonanza veins run gold about one time in seven.' },
  { id: 'V1', world: 'venus', name: 'Volcanic glass', goal: 'vitrify 20 sand at lava fields',
    done: (w, c) => c.glass >= 20, guide: 'Bank dune sand against the lava fields — the planet is halfway to a kiln already.' },
  { id: 'V2', world: 'venus', name: 'Marble works', goal: 'bake 10 limestone into marble',
    done: (w, c) => c.marble >= 10, guide: 'Paint limestone touching lava: contact metamorphism on a world that never cools.' },
  { id: 'V3', world: 'venus', name: 'Diamond forge', goal: 'press 5 diamonds from coal',
    done: (w, c) => c.diamond >= 5, guide: 'Coal against lava, white-hot: the forge planet makes gems the slow way.' },
  { id: 'V4', world: 'venus', name: 'Steel works', goal: 'smelt 20 steel',
    done: (w, c) => c.steel >= 20, guide: 'Lay metal on charcoal (coal self-immolates at 460°): ambient heat already beats bloomery heat. Venus is a free kiln.' },
  { id: 'E10', world: 'earth', name: 'Fish pond', goal: 'keep 8 fish in an algae pool',
    done: (w, c) => c.fish >= 8, guide: 'Water, daylight, algae first — then fish. Grazers need a stocked pool, not an empty one.' },
  { id: 'E11', world: 'earth', name: 'Gilded copies', goal: 'copy one gold seed into 8',
    done: (w, c) => c.gold >= 8, guide: 'Clear a patch, paint one gold beside one clone: the ring fills itself. Chain more clones to go bigger.' },
  { id: 'E12', world: 'earth', name: 'Flower bed', goal: 'bloom 20 flowers',
    done: (w, c) => c.flower >= 20, guide: 'Wet soil, daylight, then flowers by the dozen — they persist the night but only seed by day.' },
  { id: 'E13', world: 'earth', name: 'Shale oil', goal: 'crack 10 oil from shale',
    done: (w, c) => c.oil >= 10, guide: 'Bury mud under sand, wait for shale, then kiln it past 400°: kerogen cracks to oil.' },
  { id: 'E14', world: 'earth', name: 'Honey harvest', goal: 'put up 5 honey',
    done: (w, c) => c.honey >= 5, guide: 'Flowers by day, bees at the bed edge with bare ground or seed litter for comb: fed hives store honey.' },
  { id: 'E15', world: 'earth', name: 'Guano island', goal: 'whitewash 12 guano',
    done: (w, c) => c.guano >= 12, guide: 'Stock a pool (algae, then fish), roost birds on the shore soil: fed colonies whitewash the cliffs.' },
  { id: 'E16', world: 'earth', name: 'Clover rotation', goal: 'field 40 clover',
    done: (w, c) => c.clover >= 40, guide: 'Like grass but it pays rent: clover turns neighbouring dirt to fertiliser. Rest the field, reap it.' },
  { id: 'E17', world: 'earth', name: 'Spider guard', goal: 'spiders hold the field locust-free',
    done: (w, c) => c.spider >= 2 && c.locusts === 0, guide: 'Grow grass, loose locusts, then spiders: they eat the swarm and starve after. Biocontrol, not pets.' },
  { id: 'E19', world: 'earth', name: 'Stromatolite reef', goal: 'lay 6 reef limestone',
    done: (w, c) => c.limestone >= 6, guide: 'Cyano first, let it spread, then stromatolites beside the builders: mats rain limestone and entomb them.' },
  { id: 'E20', world: 'earth', name: 'Soda flat', goal: 'crust 10 trona',
    done: (w, c) => c.trona >= 10, guide: 'Salt flat, scattered lime, sprinkler mist: damp soda salts crust trona. Flood it and quicklime boils the pool.' },
  { id: 'U5', world: 'europa', name: 'Brine stock', goal: 'graze 5 brine shrimp',
    done: (w, c) => c.shrimp >= 5, guide: 'Five heaters hold the pool, salt it to brine, stock algae at dawn, then shrimp: too salty for fish, just right for Artemia.' },
  { id: 'H8', world: 'hadean', name: 'Hot-spring seed', goal: 'bloom 12 archaea by day',
    done: (w, c) => c.archaea >= 12, guide: 'Walled pool on hot ground, seed the same morning: archaea own 40°+ water by day and die back at night.' },
  { id: 'R5', world: 'mars', name: 'Oxygenate', goal: 'breathe out 10 free oxygen',
    done: (w) => w.o2 >= 10, guide: 'Heated pool, seed cyano, wait out the sols: it dozes through 35-tick nights and exhales every day. Watch the air meter.' },
  { id: 'R6', world: 'mars', name: 'Decontaminate', goal: 'clean 5 uranium to lead',
    done: (w) => w.uClean >= 5, guide: 'Dome, heater, sprinkler over uranium, seed by day: Deinococcus ignores UV that kills germs and remediates ore to lead.' },
  { id: 'R7', world: 'mars', name: 'Banded iron', goal: 'rust 3 iron in free oxygen',
    done: (w, c) => c.rust >= 3, guide: 'After Oxygenate: lay metal in the pool. No dome needed anymore — your own air rusts it. BIFs, minus the eons.' },
  { id: 'M5', world: 'moon', name: 'Moonwalk', goal: 'tardigrades outlast a full cycle',
    done: (w) => w.sol > 90 && w.counts.tardi > 0, guide: 'Paint water bears on the ice and play a full 90-tick cycle: tun-state sleeps through vacuum, frost and noon.' },
  { id: 'I1', world: 'io', name: 'Sulfur snow', goal: 'hold 140 sulfur',
    done: (w, c) => c.sulfur >= 140, guide: 'Io rains sulfur frost: gather the fields and paint your own drifts. The foundry pays in yellow.' },
  { id: 'I2', world: 'io', name: 'Living lake', goal: 'keep 100 lava liquid',
    done: (w, c) => c.lava >= 100, guide: 'Pour fresh lava over the lakes: crust wins unless you feed them. Tidal heat does the rest.' },
  { id: 'A1', world: 'archaean', name: 'First mats', goal: 'grow 4 stromatolites',
    done: (w, c) => c.strom >= 4, guide: 'Warm shallow seas, no heaters needed: cyano first and spread, then mats beside the builders. Reef follows.' },
  { id: 'A2', world: 'archaean', name: 'The oxidation', goal: 'breathe out 15 free oxygen',
    done: (w) => w.o2 >= 15, guide: 'The GOE where it happened: a big cyano pool under a methane haze. No heaters, no dome — just time and daylight.' },
  { id: 'I3', world: 'io', name: 'Tidal pulse', goal: 'witness 10 eruptions',
    done: (w) => w.erupt >= 10, guide: 'Jupiter kneads the crust: basalt near lava cracks open on its own. Tend a lake and count the bursts.' },
  { id: 'I4', world: 'io', name: "Pele's ring", goal: 'hold 130 lava',
    done: (w, c) => c.lava >= 130, guide: 'Pour fresh lava and let the tides help: eruptions feed the lakes while crust steals the edges.' },
  { id: 'N1', world: 'enceladus', name: 'Tiger stripes', goal: 'hold 6 vents',
    done: (w, c) => c.vent >= 6, guide: 'Paint a stripe line of VENTs across the south ice — Cassini mapped four real ones: Alexandria, Cairo, Baghdad, Damascus.' },
  { id: 'N2', world: 'enceladus', name: 'Brackish sea', goal: 'hold 35 water around a vent',
    done: (w, c) => c.water >= 35 && c.vent > 0, guide: 'Salt the pool into brine so it survives the cold, then vent + two heaters hold it liquid. Fresh water freezes; the ocean is salty for a reason.' },
  { id: 'N3', world: 'enceladus', name: 'Salt spray', goal: 'hold 50 salt',
    done: (w, c) => c.salt >= 50, guide: 'The plumes spray salty grains — Cassini tasted them. Bank the fallout: paint salt wide on the ice.' },
  { id: 'N4', world: 'enceladus', name: 'Warm pocket', goal: 'grow 100 germs beside a vent',
    done: (w, c) => c.germs >= 100 && c.vent > 0, guide: 'Import soil, dome it, heat it, then plant beside a vent — the only warm, wet, sheltered acres on the moon.' },
  { id: 'H7', world: 'hadean', name: 'Diamond core', goal: 'press 3 diamonds at a vent',
    done: (w, c) => c.diamond >= 3, guide: 'Coal against a lava vent: Hadean heat does the pressing. Mind the quench steam.' },
  { id: 'E21', world: 'earth', name: 'Old growth', goal: 'raise 15 trees',
    done: (w, c) => c.tree >= 15, guide: 'Plant trees on damp soil and let them seed: old trees drop saplings at their roots. Forests are slow meadows.' },
  { id: 'E22', world: 'earth', name: 'Apiary', goal: 'put up 10 honey',
    done: (w, c) => c.honey >= 10, guide: 'Bigger beds, steady bees: flowers by day, hives fed and storing. Angiosperms pay in sugar — collect it.' },
  { id: 'U6', world: 'europa', name: 'Krill run', goal: 'graze 15 brine shrimp',
    done: (w, c) => c.shrimp >= 15, guide: 'Scale the stock: wide brine, dawn algae, double shrimp. Artemia grazes what fish cannot reach.' },
];

function checkQuests(w, day) {
  const c = w.counts, out = [];
  // dawn census: a few-tick window after the night -> day transition
  // (wasNight resets at the end of this function, so the window arms once)
  if (day && w.wasNight && w.id === 'moon') w.dawnWin = 5;
  if (w.dawnWin > 0 && w.id === 'moon') {
    w.dawnWin--;
    if (c.water >= 20) w.m1done = true;
    if (c.moss >= 40) w.m2done = true;
    if (w.m1done && !w.quests.M1) { w.quests.M1 = w.sol; out.push('M1'); }
    if (w.m2done && !w.quests.M2) { w.quests.M2 = w.sol; out.push('M2'); }
  }
  w.wasNight = !day;
  for (const q of QUESTS) {
    if (q.id === 'M2') continue;
    if (w.id === q.world && !w.quests[q.id] && q.done(w, c)) {
      w.quests[q.id] = w.sol; out.push(q.id);
    }
  }
  return out;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { E, LIFE, TECH, WORLDS, GW, GH, gidx, createWorld, paint, stepWorld, worldTemp, QUESTS, habitability, habitExplain };
}
