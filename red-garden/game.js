/* RED GARDEN — Mars terraforming sandbox.
   Pure sim (createWorld/stepWorld/applyTool) has no DOM deps so a node
   harness can require() this file and play scripted runs. */
'use strict';

// ---- config ---------------------------------------------------------------
const W = 40, H = 26, TILE = 20, UV = 0.55;
const T = { REG: 0, ROCK: 1, ICE: 2, SOIL: 3, WATER: 4, MOSS: 5 };
const TOOLS = {
  germs: { name: 'Germs', cost: 4, r: 1, color: '#A3E635', blurb: 'seed living microbes' },
  soil:  { name: 'Soil', cost: 3, r: 2, color: '#8a5a2b', blurb: 'turn dirt fertile' },
  ice:   { name: 'Ice', cost: 5, r: 1, color: '#bfe8ff', blurb: 'future puddles' },
  moss:  { name: 'Moss', cost: 4, r: 1, color: '#3fae4a', blurb: 'needs wet soil + germs' },
  scrub: { name: 'Scrub', cost: 6, r: 3, color: '#FFB000', blurb: 'destroy perchlorate' },
  dome:  { name: 'Dome', cost: 18, r: 3, color: '#2DD4BF', blurb: 'UV shield bubble' },
};
const ORDER = ['germs', 'soil', 'ice', 'moss', 'scrub', 'dome'];

// ---- rng ------------------------------------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- audio (tiny synth, browser only) -------------------------------------
let AC = null, muted = false;
function beep(freq, dur, type, vol, when) {
  if (muted || typeof window === 'undefined') return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'square'; o.frequency.value = freq;
    g.gain.value = vol || 0.03;
    o.connect(g); g.connect(AC.destination);
    const t = AC.currentTime + (when || 0);
    o.start(t); o.stop(t + dur);
  } catch (e) { /* no audio, no problem */ }
}
const sfx = {
  place() { beep(520, 0.06); },
  bad() { beep(140, 0.15, 'sawtooth', 0.04); },
  quest() { beep(660, 0.1); beep(880, 0.14, 'square', 0.03, 0.1); },
  win() { [523, 659, 784, 1046].forEach((f, i) => beep(f, 0.16, 'square', 0.035, i * 0.13)); },
};

// ---- world ----------------------------------------------------------------
function idx(x, y) { return y * W + x; }
function inB(x, y) { return x >= 0 && y >= 0 && x < W && y < H; }

function blob(rng, field, cx, cy, rad, val) {
  for (let y = Math.max(0, cy - rad); y <= Math.min(H - 1, cy + rad); y++)
    for (let x = Math.max(0, cx - rad); x <= Math.min(W - 1, cx + rad); x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= rad && rng() < 1 - d / (rad + 1)) field[idx(x, y)] = val;
    }
}

function createWorld(seed) {
  const rng = mulberry32(seed || 1);
  const w = {
    seed: seed || 1, rng, sol: 0, energy: 70, reducer: 0.1,
    terr: new Uint8Array(W * H), pois: new Float32Array(W * H),
    moist: new Float32Array(W * H), germ: new Float32Array(W * H),
    shield: new Uint8Array(W * H),
    quests: [false, false, false, false], codex: {},
    tips: {}, deaths: 0, won: false, frame: 0,
  };
  w.pois.fill(0.15);
  for (let k = 0; k < 5; k++)
    blob(rng, w.pois, 4 + rng() * (W - 8) | 0, 4 + rng() * (H - 8) | 0, 3 + rng() * 3 | 0, 0.85);
  for (let k = 0; k < 9; k++)
    blob(rng, w.terr, rng() * W | 0, rng() * H | 0, 1 + rng() * 2 | 0, T.ROCK);
  for (let k = 0; k < 12; k++) {
    const x = rng() * W | 0, y = rng() * H | 0;
    if (w.terr[idx(x, y)] === T.REG) w.terr[idx(x, y)] = T.ICE;
  }
  let tot = 0;
  for (let i = 0; i < W * H; i++) tot += w.pois[i];
  w.pois0 = tot;
  return w;
}

// ---- tools ----------------------------------------------------------------
function brush(w, cx, cy, r, fn) {
  for (let y = cy - r; y <= cy + r; y++)
    for (let x = cx - r; x <= cx + r; x++) {
      if (!inB(x, y)) continue;
      if (Math.hypot(x - cx, y - cy) > r + 0.4) continue;
      fn(x, y, idx(x, y));
    }
}

// Returns a human message (or null on success). Pure: no DOM.
function applyTool(w, tool, cx, cy) {
  const def = TOOLS[tool];
  if (!def) return 'no such tool';
  if (w.energy < def.cost) return 'Not enough energy — it refills over time.';
  let changed = false;
  const R = w.rng;
  brush(w, cx, cy, def.r, (x, y, i) => {
    const t = w.terr[i];
    if (tool === 'soil') {
      if (t === T.REG) { w.terr[i] = T.SOIL; changed = true; }
    } else if (tool === 'ice') {
      if (t === T.REG || t === T.SOIL) { w.terr[i] = T.ICE; changed = true; }
    } else if (tool === 'germs') {
      if (t !== T.ROCK && t !== T.ICE) { w.germ[i] += 8 + R() * 6; changed = true; }
    } else if (tool === 'moss') {
      // pioneers: moss takes wet soil, or colonises bare wet dirt directly
      if (t === T.SOIL && w.moist[i] > 0.2 && w.germ[i] > 2) {
        w.terr[i] = T.MOSS; changed = true;
      } else if (t === T.REG && w.moist[i] > 0.55 && w.germ[i] > 4) {
        w.terr[i] = T.MOSS; changed = true;
      }
    } else if (tool === 'scrub') {
      if (w.pois[i] > 0.02) { w.pois[i] = Math.max(0, w.pois[i] - 0.8); changed = true; }
    } else if (tool === 'dome') {
      if (t !== T.ROCK) { w.shield[i] = 1; changed = true; }
    }
  });
  if (!changed) {
    if (tool === 'moss') return 'Moss needs wet soil with germs — or very wet bare dirt crawling with them.';
    return 'Nothing to do there — try different ground.';
  }
  w.energy -= def.cost;
  return null;
}

// ---- simulation: one sol --------------------------------------------------
function neighbors(w, x, y, fn) {
  if (x > 0) fn(idx(x - 1, y));
  if (x < W - 1) fn(idx(x + 1, y));
  if (y > 0) fn(idx(x, y - 1));
  if (y < H - 1) fn(idx(x, y + 1));
}

function stepWorld(w) {
  const R = w.rng;
  w.sol++;
  w.frame++;
  w.energy = Math.min(100, w.energy + 5);
  w.deaths = 0;
  // melt + moisture: water seeps outward through soil (capillary diffusion)
  const mOld = Float32Array.from(w.moist);
  const mAt = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : mOld[y * W + x];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = idx(x, y), t = w.terr[i];
    if (t === T.ICE) {
      let warm = false;
      neighbors(w, x, y, j => {
        const n = w.terr[j];
        if (n === T.SOIL || n === T.MOSS || n === T.WATER) warm = true;
      });
      if (warm && R() < 0.12) { w.terr[i] = T.WATER; w.moist[i] = 1; }
    } else if (t === T.WATER) {
      w.moist[i] = 1;
    } else if (t !== T.ROCK) {
      const avg = (mAt(x - 1, y) + mAt(x + 1, y) + mAt(x, y - 1) + mAt(x, y + 1)) / 4;
      w.moist[i] += (avg - w.moist[i]) * 0.15;
      w.moist[i] *= 0.997;
    }
    // deliquescence: perchlorate salts drink water from the air,
    // so poison ground stays damp enough for eaters to colonise
    if (t !== T.ROCK && t !== T.ICE && w.pois[i] > 0.3) {
      const brine = w.pois[i] * 0.55;
      if (w.moist[i] < brine) w.moist[i] = brine;
    }
  }
  // germs: grow, detox, die
  let germSum = 0, germTiles = 0, detoxTick = 0;
  for (let i = 0; i < W * H; i++) {
    const t = w.terr[i], g = w.germ[i];
    if (g <= 0) continue;
    const wet = w.moist[i] > 0.25 ? 1 : w.moist[i] * 2;
    const uvKill = UV * (w.shield[i] ? 0 : 1) * (1 - 0.5 * w.reducer);
    const before = g;
    // evolved eaters shrug off poison: colonise it, then digest it
    const poisHit = w.pois[i] * (1 - 0.7 * w.reducer);
    let ng = g + g * 0.25 * wet * (1 - poisHit) - g * uvKill * 0.4;
    if (w.pois[i] > 0.8) ng *= 0.9;
    ng = Math.min(60, Math.max(0, ng));
    if (t === T.ROCK || t === T.ICE) ng = 0;
    w.deaths += Math.max(0, before - ng);
    w.germ[i] = ng;
    if (ng > 1) {
      const before_pois = w.pois[i];
      w.pois[i] = Math.max(0, w.pois[i] - ng * 0.005); // eaters detox
      detoxTick += before_pois - w.pois[i];
      germSum += ng; germTiles++;
    }
  }
  if (germTiles > 0) {
    // selection is cumulative: every poison digested breeds better eaters
    w.reducer = Math.min(1, w.reducer * 0.9995 + detoxTick * 0.02);
  }
  // moss spread + death + terraforming (moss builds soil from wet dirt)
  const spread = [], enrich = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = idx(x, y);
    if (w.terr[i] === T.MOSS) {
      if (w.moist[i] < 0.12 && R() < 0.06) { w.terr[i] = T.SOIL; continue; }
      if (w.germ[i] > 4 && R() < 0.35) {
        neighbors(w, x, y, j => {
          if (w.terr[j] === T.SOIL && w.moist[j] > 0.3) spread.push(j);
          else if (w.terr[j] === T.REG && w.moist[j] > 0.5 && R() < 0.12) enrich.push(j);
        });
      }
    }
  }
  for (const j of spread) if (w.terr[j] === T.SOIL) w.terr[j] = T.MOSS;
  for (const j of enrich) if (w.terr[j] === T.REG) w.terr[j] = T.SOIL;
  return { germSum };
}

// ---- stats / quests / codex -----------------------------------------------
function stats(w) {
  let water = 0, moss = 0, germs = 0, pois = 0;
  for (let i = 0; i < W * H; i++) {
    if (w.terr[i] === T.WATER) water++;
    if (w.terr[i] === T.MOSS) moss++;
    germs += w.germ[i]; pois += w.pois[i];
  }
  return { water, moss, germs: Math.round(germs), poisFrac: pois / w.pois0,
           greenPct: Math.round(100 * moss / (W * H)) };
}

const QUESTS = [
  { id: 'q1', name: 'Make a puddle', goal: 'hold 12 water tiles',
    done: s => s.water >= 12, prog: s => Math.min(s.water, 12) + '/12 water' },
  { id: 'q2', name: 'Wake the germs', goal: 'keep 300 microbes alive',
    done: s => s.germs >= 300, prog: s => Math.min(s.germs, 300) + '/300 germs' },
  { id: 'q3', name: 'Clean the poison', goal: 'halve the perchlorate',
    done: s => s.poisFrac <= 0.5, prog: s => Math.round(100 * (1 - s.poisFrac)) + '% cleaned' },
  { id: 'q4', name: 'Green Mars', goal: 'grow 120 moss tiles',
    done: s => s.moss >= 120, prog: s => Math.min(s.moss, 120) + '/120 moss' },
];

const CODEX = {
  water: { title: 'Water runs everything',
    body: 'Life does not just need ice — it needs water it can use. On Mars, poisonous salts lock water away. Every puddle you melt is a refuge where chemistry can get busy.' },
  germs: { title: 'Tough little germs',
    body: 'Earth microbes survive vacuum, radiation and deep freeze — Antarctic rock-dwellers and spore-formers shrug off worse than Mars. Your germs are their stand-ins.' },
  poison: { title: 'The poison that became food',
    body: 'Martian soil can hold ~1% perchlorate, nasty stuff for humans. But some Earth bacteria breathe it, stripping off oxygen for energy. Your scrubbers and evolving eaters copy that exact trick.' },
  green: { title: 'Terraforming starts small',
    body: 'No planet greened overnight. Mosses and lichens crack rock, hold water and build soil for whatever comes next. Every forest was once bare rock with a green smudge.' },
  sun: { title: 'The invisible killer: UV',
    body: 'Mars has almost no ozone, so harsh UV sterilises bare ground. Real survivors hide under dust or in salt crusts — or under your domes, exactly as you just learned.' },
  genes: { title: 'Germs trade genes',
    body: 'Bacteria swap genes directly with neighbours — horizontal transfer — spreading tricks like poison-eating far faster than parent-to-child inheritance. Your colony just evolved that way.' },
};
const QUEST_CODEX = ['water', 'germs', 'poison', 'green'];

// Returns {quests:[ids completed this tick], codex:[ids unlocked]} — pure.
function checkProgress(w, s) {
  const out = { quests: [], codex: [] };
  QUESTS.forEach((q, k) => {
    if (!w.quests[k] && q.done(s)) { w.quests[k] = true; out.quests.push(q.id); }
  });
  QUESTS.forEach((q, k) => {
    if (w.quests[k] && !w.codex[QUEST_CODEX[k]]) {
      w.codex[QUEST_CODEX[k]] = true; out.codex.push(QUEST_CODEX[k]);
    }
  });
  if (w.deaths > 40 && !w.codex.sun) { w.codex.sun = true; out.codex.push('sun'); }
  if (w.reducer >= 0.5 && !w.codex.genes) { w.codex.genes = true; out.codex.push('genes'); }
  if (w.quests.every(Boolean)) w.won = true;
  return out;
}

// ---- rendering (browser only, called from UI layer) -----------------------
function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const BASE = ['#8a3b22', '#4a3430', '#bfe8ff', '#7a4d26', '#1d5f8a', '#2f8a3d'];

function drawWorld(w, ctx, cursor) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = idx(x, y), t = w.terr[i], px = x * TILE, py = y * TILE;
    const n = hash2(x, y), n2 = hash2(x + 99, y + 7);
    let c = BASE[t];
    if (t === T.REG || t === T.SOIL) {
      const v = n * 14 - 7;
      c = shade(c, v);
    }
    ctx.fillStyle = c;
    ctx.fillRect(px, py, TILE, TILE);
    // moisture darkening
    if ((t === T.SOIL || t === T.REG) && w.moist[i] > 0.3) {
      ctx.fillStyle = 'rgba(20,40,80,' + (0.35 * w.moist[i]).toFixed(2) + ')';
      ctx.fillRect(px, py, TILE, TILE);
    }
    // poison speckle
    if (w.pois[i] > 0.25 && t !== T.ROCK) {
      ctx.fillStyle = 'rgba(255,60,30,' + (0.5 * w.pois[i]).toFixed(2) + ')';
      if (n2 > 0.4) ctx.fillRect(px + 3, py + 4, 5, 4);
      if (n2 < 0.6) ctx.fillRect(px + 11, py + 12, 4, 4);
    }
    if (t === T.ICE && ((w.frame >> 3) + x + y) % 2 === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 5 + ((n * 8) | 0), py + 5 + ((n2 * 8) | 0), 3, 3);
    }
    if (t === T.WATER) {
      ctx.fillStyle = (w.frame >> 4) % 2 ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.2)';
      ctx.fillRect(px, py + ((w.frame >> 4) % 2 ? 3 : 13), TILE, 3);
    }
    if (t === T.MOSS) {
      ctx.fillStyle = '#1d5b26';
      ctx.fillRect(px + 3, py + 10, 5, 7);
      ctx.fillRect(px + 11, py + 7, 5, 10);
      ctx.fillStyle = '#57d465';
      ctx.fillRect(px + 4, py + 8, 3, 3);
      ctx.fillRect(px + 12, py + 5, 3, 3);
    }
    if (t === T.ROCK) {
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.fillRect(px + 2, py + 12, 16, 6);
      ctx.fillStyle = 'rgba(255,255,255,.12)';
      ctx.fillRect(px + 3, py + 3, 8, 3);
    }
    // germs: lime dots scale with count
    const g = w.germ[i];
    if (g > 0.5 && t !== T.ROCK && t !== T.ICE) {
      const dots = Math.min(6, 1 + ((g / 10) | 0));
      const blink = ((w.frame >> 3) + x + y) % 2 === 0;
      ctx.fillStyle = blink ? '#c8ff5a' : '#7fd41f';
      for (let d = 0; d < dots; d++) {
        const ox = 3 + hash2(x * 7 + d, y * 3) * 14;
        const oy = 3 + hash2(x * 3, y * 7 + d) * 14;
        ctx.fillRect(px + ox | 0, py + oy | 0, 3, 3);
      }
    }
    // dome shimmer
    if (w.shield[i]) {
      ctx.strokeStyle = 'rgba(45,212,191,.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 1.5, py + 1.5, TILE - 3, TILE - 3);
    }
  }
  // brush cursor
  if (cursor && inB(cursor.x, cursor.y)) {
    const def = TOOLS[cursor.tool];
    ctx.strokeStyle = '#FFB000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cursor.x * TILE + TILE / 2, cursor.y * TILE + TILE / 2,
            def.r * TILE + 6, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const cl = v => Math.max(0, Math.min(255, v + amt)) | 0;
  const r = cl(n >> 16), g = cl((n >> 8) & 255), b = cl(n & 255);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// ---- UI layer (browser only) ----------------------------------------------
if (typeof window !== 'undefined') (function () {
  let world = createWorld((Math.random() * 1e9) | 0);
  let tool = 'soil', paused = false, speed = 1, started = false;
  let cursor = null, painting = false;
  const $ = id => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const TIPS = [
    [w => w.sol === 8 && !w.tips.soil, 'Tip: paint SOIL (key 2) near ice, then ICE (3) beside it — ice melts into puddles.'],
    [w => w.sol === 30 && !w.tips.germ, 'Tip: seed GERMS (1) on wet ground. They multiply where it is damp.'],
    [w => stats(world).germs > 60 && !world.tips.uv, 'Watch out: bare sun kills germs. A DOME (6) over your colony saves lives.'],
    [w => stats(world).moss > 0 && !world.tips.moss, 'Moss spreads by itself across wet, germy soil. Give it room.'],
  ];

  function say(msg) { $('ticker').textContent = msg; }

  function buildToolbar() {
    const bar = $('toolbar');
    bar.innerHTML = '';
    ORDER.forEach((key, k) => {
      const d = TOOLS[key];
      const b = document.createElement('button');
      b.className = 'tool' + (key === tool ? ' sel' : '');
      b.innerHTML = '<span class="key">' + (k + 1) + '</span><span class="swatch" style="background:' +
        d.color + '"></span><b>' + d.name + ' · ' + d.cost + '⚡</b><small>' + d.blurb + '</small>';
      b.onclick = () => { tool = key; sfx.place(); buildToolbar(); };
      bar.appendChild(b);
    });
  }

  function buildQuests(s) {
    const ol = $('quests');
    ol.innerHTML = '';
    QUESTS.forEach((q, k) => {
      const li = document.createElement('li');
      li.className = world.quests[k] ? 'done' : (k === 0 || world.quests[k - 1] ? 'active' : '');
      li.innerHTML = '<b>' + (k + 1) + '. ' + q.name + '</b> — ' + q.goal +
        '<div class="prog">' + (world.quests[k] ? 'DONE ✓' : q.prog(s)) + '</div>';
      ol.appendChild(li);
    });
  }

  function buildCodex() {
    const ol = $('codex');
    ol.innerHTML = '';
    let n = 0;
    Object.keys(CODEX).forEach(id => {
      const open = !!world.codex[id];
      if (open) n++;
      const li = document.createElement('li');
      li.className = open ? 'open' : 'locked';
      li.innerHTML = open
        ? '<h4>' + CODEX[id].title + '</h4><p>' + CODEX[id].body + '</p>'
        : '<h4>??? — locked</h4><p>Keep playing: solve problems and survive disasters to unlock this page.</p>';
      ol.appendChild(li);
    });
    $('codex-n').textContent = n + '/6';
  }

  function paintAt(ev) {
    const r = canvas.getBoundingClientRect();
    const x = ((ev.clientX - r.left) / r.width * W) | 0;
    const y = ((ev.clientY - r.top) / r.height * H) | 0;
    cursor = { x, y, tool };
    if (!inB(x, y)) return;
    const msg = applyTool(world, tool, x, y);
    if (msg) { say(msg); sfx.bad(); }
    else sfx.place();
  }

  canvas.addEventListener('pointerdown', ev => {
    if (!started) return;
    painting = true; canvas.setPointerCapture(ev.pointerId); paintAt(ev);
  });
  canvas.addEventListener('pointermove', ev => {
    const r = canvas.getBoundingClientRect();
    cursor = { x: ((ev.clientX - r.left) / r.width * W) | 0,
               y: ((ev.clientY - r.top) / r.height * H) | 0, tool };
    if (painting && started) paintAt(ev);
  });
  canvas.addEventListener('pointerup', () => { painting = false; });
  canvas.addEventListener('pointerleave', () => { cursor = null; painting = false; });

  window.addEventListener('keydown', ev => {
    if (ev.key >= '1' && ev.key <= '6') {
      tool = ORDER[+ev.key - 1]; buildToolbar(); sfx.place();
    } else if (ev.key === ' ') { ev.preventDefault(); togglePause(); }
    else if (ev.key === 'f' || ev.key === 'F') toggleSpeed();
  });

  function togglePause() {
    paused = !paused;
    $('btn-pause').textContent = paused ? '▶' : 'II';
    say(paused ? 'Paused. The colony holds its breath.' : 'Running.');
  }
  function toggleSpeed() {
    speed = speed === 1 ? 3 : 1;
    $('btn-speed').textContent = speed + '×';
  }
  $('btn-pause').onclick = togglePause;
  $('btn-speed').onclick = toggleSpeed;
  $('btn-sound').onclick = ev => {
    muted = !muted;
    ev.target.textContent = muted ? '✕' : '♪';
  };
  $('btn-restart').onclick = () => location.reload();
  $('tab-quests').onclick = () => {
    $('quests').hidden = false; $('codex').hidden = true;
    $('tab-quests').classList.add('on'); $('tab-codex').classList.remove('on');
  };
  $('tab-codex').onclick = () => {
    $('quests').hidden = true; $('codex').hidden = false;
    $('tab-codex').classList.add('on'); $('tab-quests').classList.remove('on');
  };
  $('btn-start').onclick = () => {
    $('startOverlay').hidden = true; started = true;
    say('Paint SOIL near ice. Make your first puddle.');
    beep(440, 0.1); beep(660, 0.12, 'square', 0.03, 0.1);
  };
  $('btn-again').onclick = () => location.reload();

  let acc = 0, last = performance.now(), uiTick = 0;
  function frame(now) {
    try {
      const dt = Math.min(100, now - last);
      last = now;
      if (started && !paused && !world.won) {
        acc += dt * speed;
        while (acc >= 500) { acc -= 500; tick(); }
      }
      drawWorld(world, ctx, cursor);
      if (++uiTick % 20 === 0) refreshHUD();
    } finally {
      requestAnimationFrame(frame);
    }
  }

  function tick() {
    stepWorld(world);
    const s = stats(world);
    const prog = checkProgress(world, s);
    prog.quests.forEach(() => {
      world.energy = Math.min(100, world.energy + 25);
      sfx.quest();
    });
    if (prog.quests.length) {
      const q = QUESTS.find(q => q.id === prog.quests[prog.quests.length - 1]);
      say('Problem solved: ' + q.name + '! +25 energy, new field-guide page. ' +
        (world.won ? '' : 'Next: ' + nextGoal()));
    }
    prog.codex.forEach(id => {
      say('Field guide unlocked: ' + CODEX[id].title);
      buildCodex();
    });
    TIPS.forEach(([cond, msg]) => {
      if (cond(world)) { say(msg); }
    });
    TIPS.forEach((t, k) => {
      if (t[0](world) && !world.tips['k' + k]) world.tips['k' + k] = true;
    });
    if (world.won && $('winOverlay').hidden) {
      $('winOverlay').hidden = false;
      let best = 1e9;
      try { best = +(localStorage.getItem('redgarden_best') || 1e9); } catch (e) { /* private mode */ }
      const sols = world.sol;
      const line = sols < best
        ? 'New record: ' + sols + ' sols!'
        : sols + ' sols (best: ' + best + ').';
      try { if (sols < best) localStorage.setItem('redgarden_best', sols); } catch (e) { /* private mode */ }
      $('win-stats').textContent = line + ' Germs peaked with the poison half-eaten. Darwin would be proud.';
      sfx.win();
    }
    buildQuests(s);
    refreshHUD(s);
  }

  function nextGoal() {
    const k = world.quests.findIndex(q => !q);
    return k < 0 ? 'all done!' : QUESTS[k].name + ' — ' + QUESTS[k].goal;
  }

  function refreshHUD(s) {
    s = s || stats(world);
    $('st-sol').textContent = world.sol;
    $('st-energy').style.width = world.energy + '%';
    $('st-energy-n').textContent = Math.round(world.energy);
    $('st-green').textContent = s.greenPct + '%';
    $('st-germs').textContent = s.germs;
    $('st-poison').textContent = Math.round(100 * s.poisFrac) + '%';
    document.querySelectorAll('.tool').forEach((b, k) => {
      b.classList.toggle('cant', world.energy < TOOLS[ORDER[k]].cost);
    });
  }

  buildToolbar(); buildQuests(stats(world)); buildCodex(); refreshHUD();
  requestAnimationFrame(frame);
})();

// node harness hook (no DOM): require() exposes the pure sim.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    W, H, T, UV, TOOLS, ORDER, QUESTS, CODEX,
    createWorld, applyTool, stepWorld, stats, checkProgress, mulberry32,
  };
}
