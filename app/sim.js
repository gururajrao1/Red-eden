/* RED EDEN lab sim — faithful JS port of mars_evolution_abm.py.
   Same equations: P(death) = 1 - exp(-Stress/Resistance), 28-locus genomes
   (metab 8 / uv 8 / membrane 8 / reducer 4), point + duplication + frameshift
   mutation, 4-locus HGT cassettes, chemotaxis, protocell emergence.
   Pure logic, no DOM: node can require() it for headless verification. */
'use strict';

const L = 28;
const DEFAULTS = {
  W: 48, H: 30, nInit: 250, seed: 42, mu: 0.02, pHgt: 0.05,
  eThresh: 14, steps: 200, mode: 'seeded', protoInit: 120,
  uvScale: 1, poisScale: 1, monRain: 0.4,
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
function gauss(rng) {
  let u = 0, v = 0;
  while (!u) u = rng();
  while (!v) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const mean8 = (g, o) => (g[o] + g[o+1] + g[o+2] + g[o+3] + g[o+4] + g[o+5] + g[o+6] + g[o+7]) / 8;
// returns [metabEff, uvRep, membrane, reducer]
function decode(g) {
  const m = mean8(g, 0), u = mean8(g, 8), b = mean8(g, 16);
  const r = (g[24] + g[25] + g[26] + g[27]) / 4;
  return [0.3 + 0.7 * m, u, b, r];
}
const fitnessOf = g => { const [m, u, b, r] = decode(g); return 0.35 * m + 0.25 * u + 0.25 * b + 0.15 * r; };
function deathP(stress, res) {
  if (res < 1e-6) return 1;
  const p = 1 - Math.exp(-stress / res);
  return p < 0 ? 0 : p > 1 ? 1 : p;
}
function shannon(counts, total) {
  let h = 0;
  for (const c of counts) if (c > 0) { const p = c / total; h -= p * Math.log(p); }
  return h;
}

function createSim(opts) {
  const P = Object.assign({}, DEFAULTS, opts);
  const rng = mulberry32(P.seed);
  const { W, H } = P, N = W * H;
  const s = { P, rng, t: 0, microbes: [], protocells: [], byCell: new Map(),
              emergences: 0, firstEmergence: null,
              uv: new Float32Array(N), perch: new Float32Array(N),
              aw: new Float32Array(N), nutr: new Float32Array(N),
              mon: new Float32Array(N), uvBase: new Float32Array(N),
              eInit: 10, hist: { pop: [], fit: [], sh: [], red: [], proto: [], em: [] } };
  // UV gradient + noise
  for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) {
    const i = y * W + x;
    s.uvBase[i] = (0.35 + 0.65 * (x / (W - 1)) + gauss(rng) * 0.03) * P.uvScale;
  }
  // perchlorate hotspots
  s.perch.fill(0.15 * P.poisScale);
  let pmax = 0.001;
  for (let k = 0; k < 6; k++) {
    const cx = rng() * W, cy = rng() * H, sg = 4 + rng() * 5;
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) {
      const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
      s.perch[y * W + x] += 0.8 * Math.exp(-d2 / (2 * sg * sg)) * P.poisScale;
    }
  }
  for (let i = 0; i < N; i++) if (s.perch[i] > pmax) pmax = s.perch[i];
  for (let i = 0; i < N; i++) s.perch[i] = Math.min(1, s.perch[i] / pmax);
  for (let i = 0; i < N; i++) {
    s.nutr[i] = Math.min(5, Math.max(0.2, 2 + gauss(rng) * 0.8));
    s.mon[i] = Math.min(6, Math.max(0.2, 3 + gauss(rng)));
  }
  s.uv.set(s.uvBase);
  for (let i = 0; i < N; i++)
    s.aw[i] = Math.min(1, Math.max(0.4, 0.95 - 0.45 * s.perch[i] - 0.1 * s.uv[i]));
  const freeCells = [];
  for (let i = 0; i < N; i++) freeCells.push(i);
  const takeCell = occ => {
    for (let a = 0; a < 40; a++) {
      const i = (rng() * N) | 0;
      if (!occ.has(i)) { occ.add(i); return i; }
    }
    return -1;
  };
  const occ = new Set();
  const mkGen = () => { const g = []; for (let k = 0; k < L; k++) g.push(rng() < 0.5 ? 1 : 0); return g; };
  if (P.mode === 'abiogenesis') {
    for (let k = 0; k < P.protoInit; k++) {
      const i = takeCell(occ);
      if (i < 0) break;
      s.protocells.push({ i, len: 2, stab: rng() });
    }
  } else {
    for (let k = 0; k < P.nInit; k++) {
      const i = takeCell(occ);
      if (i < 0) break;
      const m = { i, g: mkGen(), e: s.eInit, age: 0 };
      s.microbes.push(m);
      s.byCell.set(i, m);
    }
  }
  s.occ = occ;
  return s;
}

function neighbours(s, i) {
  const { P } = s, x = i % P.W, y = (i / P.W) | 0, out = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy) continue;
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < P.W && ny < P.H) out.push(ny * P.W + nx);
  }
  return out;
}
function killAgent(s, list, k) {
  const a = list[k];
  s.occ.delete(a.i);
  if (s.byCell.get(a.i) === a) s.byCell.delete(a.i);
  list.splice(k, 1);
}
function mutate(s, g) {
  const out = g.slice(), R = s.rng;
  for (let k = 0; k < L; k++) if (R() < s.P.mu) out[k] = 1 - out[k];
  if (R() < s.P.mu * 0.25) {
    const src = (R() * (L - 4)) | 0, dst = (R() * (L - 4)) | 0;
    for (let k = 0; k < 4; k++) out[dst + k] = g[src + k];
  }
  if (R() < s.P.mu * 0.15) {
    const at = (R() * (L - 2)) | 0;
    for (let k = L - 1; k > at; k--) out[k] = out[k - 1];
    out[at] = R() < 0.5 ? 1 : 0;
  }
  return out;
}

function stepMicrobe(s, m, k) {
  const P = s.P, R = s.rng;
  const [metab, , , red0] = decode(m.g);
  // 1. eat + basal
  const avail = s.nutr[m.i];
  const uptake = Math.min(avail, 2 * (0.4 + 0.6 * metab));
  s.nutr[m.i] = avail - uptake;
  m.e += uptake * 0.9;
  if (red0 > 0 && s.perch[m.i] > 0) {
    const meal = Math.min(s.perch[m.i], red0 * 0.35);
    m.e += meal * 2.2;
    s.perch[m.i] = Math.max(0, s.perch[m.i] - meal * 0.1);
  }
  m.e -= 0.4 * (1.4 - 0.6 * metab);
  m.age++;
  if (m.e <= 0 || m.age > 120) { killAgent(s, s.microbes, k); return; }
  // 2. stress
  const [, uvRep, memb, red] = decode(m.g);
  const pcEff = s.perch[m.i] * (1 - 0.75 * red);
  const stress = 0.35 * (0.6 * s.uv[m.i] + 0.7 * pcEff + 0.8 * (1 - s.aw[m.i]));
  const resist = (0.6 * (0.15 + uvRep) + 1.0 * (0.15 + memb) + 1e-3) * 6;
  if (R() < deathP(stress, resist)) { killAgent(s, s.microbes, k); return; }
  // chemotaxis toward food when hungry
  if (m.e < P.eThresh) {
    let best = m.i, bv = s.nutr[m.i];
    for (const j of neighbours(s, m.i)) {
      if (!s.occ.has(j) && s.nutr[j] > bv) { bv = s.nutr[j]; best = j; }
    }
    if (best !== m.i) { s.occ.delete(m.i); s.byCell.delete(m.i); m.i = best; s.occ.add(best); s.byCell.set(best, m); }
  }
  // 3. replicate
  if (m.e >= P.eThresh) {
    const free = neighbours(s, m.i).filter(j => !s.occ.has(j));
    if (free.length) {
      m.e -= 2;
      if (m.e <= 0) { killAgent(s, s.microbes, k); return; }
      const cell = free[(R() * free.length) | 0];
      const ec = m.e / 2; m.e /= 2;
      const child = { i: cell, g: mutate(s, m.g), e: ec, age: 0 };
      s.microbes.push(child); s.occ.add(cell); s.byCell.set(cell, child);
    }
  }
  // 4. HGT: copy a 4-locus cassette from a neighbour
  if (R() < P.pHgt) {
    const donors = [];
    for (const j of neighbours(s, m.i)) {
      const a = s.byCell.get(j);
      if (a && a !== m) donors.push(a);
    }
    if (donors.length) {
      const d = donors[(R() * donors.length) | 0];
      const src = (R() * (L - 4)) | 0;
      for (let q = 0; q < 4; q++) m.g[src + q] = d.g[src + q];
      m.e = Math.max(0, m.e - 0.1);
    }
  }
}

function stepProto(s, p, k) {
  const R = s.rng;
  const meal = Math.min(s.mon[p.i], 1.2);
  s.mon[p.i] -= meal;
  p.len += meal * 2.2 - 0.15;
  if (R() < deathP(0.35 * 0.6 * s.uv[p.i], 1.2) || p.len <= 0) {
    killAgent(s, s.protocells, k); return;
  }
  if (p.len >= 16) {
    const free = neighbours(s, p.i).filter(j => !s.occ.has(j));
    if (free.length) {
      p.len /= 2;
      const cell = free[(R() * free.length) | 0];
      s.protocells.push({ i: cell, len: p.len, stab: R() });
      s.occ.add(cell);
    }
  }
  if (p.len >= 10 && p.stab + 0.5 * s.aw[p.i] > 1.05) {
    // emergence: chemistry becomes biology
    const cell = p.i;
    killAgent(s, s.protocells, k);
    const g = []; for (let q = 0; q < L; q++) g.push(R() < 0.5 ? 1 : 0);
    const baby = { i: cell, g, e: s.eInit, age: 0 };
    s.microbes.push(baby);
    s.occ.add(cell); s.byCell.set(cell, baby);
    s.emergences++;
    if (s.firstEmergence === null) s.firstEmergence = s.t;
  }
}

function updateEnv(s) {
  const { P, rng: R, N } = { P: s.P, rng: s.rng, N: s.P.W * s.P.H };
  s.t++;
  const cyc = 0.6 + 0.4 * Math.sin(2 * Math.PI * s.t / 50);
  for (let i = 0; i < N; i++)
    s.uv[i] = Math.min(1.5, Math.max(0, s.uvBase[i] * cyc + gauss(R) * 0.01));
  if (s.t % 5 === 0) {
    const old = Float32Array.from(s.perch);
    for (let x = 0; x < P.W; x++) for (let y = 0; y < P.H; y++) {
      const i = y * P.W + x;
      const nb = old[((y + 1) % P.H) * P.W + x] + old[((y - 1 + P.H) % P.H) * P.W + x] +
                 old[y * P.W + ((x + 1) % P.W)] + old[y * P.W + ((x - 1 + P.W) % P.W)];
      s.perch[i] = Math.min(1, Math.max(0, 0.8 * old[i] + 0.05 * nb));
    }
  }
  for (let i = 0; i < N; i++) {
    s.aw[i] = Math.min(1, Math.max(0.4, 0.95 - 0.45 * s.perch[i] - 0.1 * s.uv[i] + gauss(R) * 0.005));
    s.nutr[i] = Math.min(5, Math.max(0, s.nutr[i] * 0.995 + 0.3 + gauss(R) * 0.02));
    s.mon[i] = Math.min(6, Math.max(0, s.mon[i] * 0.99 + (P.mode === 'abiogenesis' ? P.monRain : 0) + gauss(R) * 0.02));
  }
}

function collect(s) {
  const n = s.microbes.length, h = s.hist;
  h.pop.push(n); h.proto.push(s.protocells.length); h.em.push(s.emergences);
  if (!n) { h.fit.push(0); h.sh.push(0); h.red.push(0); return; }
  let f = 0, r = 0;
  const strains = new Map();
  for (const m of s.microbes) {
    f += fitnessOf(m.g); r += decode(m.g)[3];
    const key = m.g.join('');
    strains.set(key, (strains.get(key) || 0) + 1);
  }
  h.fit.push(f / n); h.red.push(r / n);
  h.sh.push(shannon([...strains.values()], n));
}

function stepSim(s) {
  updateEnv(s);
  // iterate over copies since birth/death mutates lists
  for (const p of [...s.protocells]) {
    const k = s.protocells.indexOf(p);
    if (k >= 0) stepProto(s, p, k);
  }
  const order = [...s.microbes];
  for (let q = order.length - 1; q >= 0; q--) {
    const m = order[q];
    const k = s.microbes.indexOf(m);
    if (k >= 0) stepMicrobe(s, m, k);
  }
  // shuffle next round
  for (let i = s.microbes.length - 1; i > 0; i--) {
    const j = (s.rng() * (i + 1)) | 0;
    [s.microbes[i], s.microbes[j]] = [s.microbes[j], s.microbes[i]];
  }
  collect(s);
}

function runSim(opts, onTick) {
  const s = createSim(opts);
  collect(s);
  const steps = (opts && opts.steps) || DEFAULTS.steps;
  for (let k = 0; k < steps; k++) {
    stepSim(s);
    if (onTick) onTick(s, k);
    if (!s.microbes.length && !s.protocells.length) break;
  }
  const h = s.hist, n = h.pop.length;
  const ev = [];
  ev.push(s.P.mode === 'abiogenesis'
    ? `Step 0: ${opts.protoInit || DEFAULTS.protoInit} pre-life blobs drift in a chemical soup.`
    : `Step 0: ${opts.nInit || DEFAULTS.nInit} microbes wake in poisonous, sun-blasted soil.`);
  if (s.firstEmergence !== null)
    ev.push(`Step ${s.firstEmergence}: the first living cell assembles from chemistry.`);
  let imax = 0;
  for (let i = 0; i < n; i++) if (h.pop[i] > h.pop[imax]) imax = i;
  const ri = h.red.findIndex((v, i) => v >= 0.5 && h.pop[i] > 10);
  if (ri > 0) ev.push(`Step ${ri}: most microbes digest the poison — toxin becomes food.`);
  ev.push(h.pop[n - 1] > 0
    ? `Step ${n - 1}: life endures — ${h.pop[n - 1]} microbes, health ${h.fit[n - 1].toFixed(2)}.`
    : `Step ${n - 1}: extinction. The stress won this time.`);
  return { hist: h, events: ev, peak: { step: imax, pop: h.pop[imax] },
           emergences: s.emergences, firstEmergence: s.firstEmergence };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEFAULTS, decode, fitnessOf, deathP, createSim, stepSim, runSim };
}
