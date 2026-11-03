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
            EMBER: 74, PHOSPHORUS: 75, MUD: 76, SINTER: 77, TUFF: 78 };
const LIFE = { NONE: 0, GERMS: 1, MOSS: 2, GRASS: 3, ALGAE: 4, FUNGUS: 5, LICHEN: 6, LOCUSTS: 7,
  CORAL: 8, CACTUS: 9, SPONGE: 10, FERN: 11, WORMS: 12, TERMITES: 13 };
const TECH = { NONE: 0, HEATER: 1, DOME: 2, SPRINKLER: 3, SHADE: 4, KILN: 5, SCARECROW: 6 };
const POWDER = new Set([E.SAND, E.SALT, E.ASH, E.SNOW, E.CLAY, E.GUNPOWDER, E.SULFUR, E.FERTILIZER, E.PUMICE, E.GRAVEL,
  E.SAWDUST, E.COAL, E.DUST, E.HAIL, E.SALTPETRE, E.LIME, E.SEED, E.COMPOST, E.PHOSPHORUS]);
const LIQUID = new Set([E.WATER, E.BRINE, E.ACID, E.LAVA, E.OIL, E.CRYO, E.MERCURY, E.FOAM, E.CEMENT]);
const GAS = new Set([E.STEAM, E.SMOKE, E.CLOUD, E.HYDROGEN, E.OXYGEN, E.METHANE, E.HELIUM, E.CO2, E.NITROGEN, E.CHLORINE]);
// thermal conductivity per element (metal fast, gases slow)
function condOf(e) {
  if (e === E.METAL || e === E.STEEL) return 0.6;
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
      if (n === E.ROCK || n === E.LAVA || n === E.CONCRETE || n === E.GRANITE || n === E.BASALT || n === E.STEEL) continue; // blast-proof
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
  const w = { id: worldId, Wd, rng, sol: 0, reducer: 0.1,
    el: new Uint8Array(GN), life: new Uint8Array(GN), lifeAmt: new Float32Array(GN),
    tech: new Uint8Array(GN), wet: new Float32Array(GN), age: new Float32Array(GN), heat: new Float32Array(GN), hist: [], rot: 0,
    pt: new Float32Array(GN),
    ev: [], quests: {}, m1run: 0, wasNight: true };
  w.el.fill(worldId === 'europa' ? E.ICE : (worldId === 'earth' ? E.SOIL : E.REGOLITH));
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
    else if (e === E.SAND && (t > 800 || hotNbr(w, x, y, 800))) {
      w.el[i] = E.GLASS; w.ev.push(['glaze', x, y]); // contact melting at the lava face
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
    else if (e === E.MUD && !hasNbr(x, y, n => n === E.WATER || n === E.BRINE) && R() < 0.1) {
      w.el[i] = E.SOIL; // sun-dried mud sets back to dirt
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
    else if (e === E.QUARTZ && hotNbr(w, x, y, 600)) {
      w.el[i] = E.GLASS; w.ev.push(['glaze', x, y]); // easier fulgurite than sand
    }
    else if (e === E.WAX && t > 60) {
      w.el[i] = E.OIL; w.ev.push(['melt', x, y]); // phase change before burning
    }
    else if (e === E.COPPERORE && (t > 450 || hotNbr(w, x, y, 450))) {
      w.el[i] = E.COPPER; w.ev.push(['smelt', x, y]); // a kiln reaches bloomery heat
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
    else if (e === E.CHARCOAL && R() < 0.05) {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        const j = gidx(x + dx, y + dy);
        if (w.el[j] === E.BRINE) { w.el[j] = E.WATER; w.wet[j] = 1; w.ev.push(['filter', x + dx, y + dy]); break; }
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
    else if (e === E.COAL && (t > 300 || hotNbr(w, x, y, 300) ||
             hasNbr(x, y, n => n === E.FIRE || n === E.LAVA))) {
      w.el[i] = E.FIRE; w.wet[i] = 0; w.ev.push(['ignite', x, y]); // high ignition point, then burns
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
             (w.Wd.o2 || isDome(w, x, y)) && R() < 0.005) {
      w.el[i] = E.RUST; w.ev.push(['rust', x, y]); // oxidation needs water + air
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
               n === E.AMBER || n === E.PHOSPHORUS) && air && R() < 0.3 && !hasNbr(x + dx, y + dy, m => m === E.FOAM)) {
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
    else if (e === E.ACID) {
      // eats rock/dirt/sand, neutralised by soil
      for (let dy = -1; dy <= 1 && w.el[i] === E.ACID; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || !inG(x + dx, y + dy)) continue;
        const j = gidx(x + dx, y + dy), n = w.el[j];
        if (n === E.SOIL && R() < 0.2) { w.el[i] = E.EMPTY; w.ev.push(['fizz', x, y]); break; }
        if ((n === E.LIMESTONE || n === E.CHALK) && R() < 0.3) {
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
             n === E.WAX || n === E.PAPER || n === E.SAWDUST || n === E.RUBBER || n === E.CHARCOAL || n === E.AMBER) && R() < 0.4) {
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
  let vent = 0, wood = 0, soil = 0;
  let coral = 0, cactus = 0, sponge = 0, fern = 0, worms = 0, termites = 0;
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
    }
  }
  // cumulative selection for brine-eaters
  if (detox > 0) w.reducer = Math.min(1, w.reducer * 0.9995 + detox * 0.005);
  // ecosystem score: Shannon diversity over lifeform tile counts (the ABM's own index, grown up)
  const tiles = [germTiles, moss, grass, algae, fungus, lichen, locusts, coral, cactus, sponge, fern, worms, termites];
  const pop = tiles.reduce((a, b) => a + b, 0);
  let ecoH = 0, richness = 0;
  for (const n of tiles) {
    if (n <= 0) continue;
    richness++;
    const p = n / pop;
    ecoH -= p * Math.log(p);
  }
  w.counts = { germs: Math.round(germs), moss, grass, algae, fungus, lichen, locusts, salt, acid, water, brick, co2, glass, lime, limestone,
    coral, cactus, sponge, fern, worms, termites, vent, wood, soil,
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
  module.exports = { E, LIFE, TECH, WORLDS, GW, GH, gidx, createWorld, paint, stepWorld, worldTemp, QUESTS };
}
