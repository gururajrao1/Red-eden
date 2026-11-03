/* RED EDEN lab UI: controls + live run + playback + charts + takeaways. */
'use strict';
const $ = id => document.getElementById(id);
const PRESETS = {
  'Balanced world': {},
  'Poison world': { poisScale: 1.6 },
  'Harsh sun': { uvScale: 1.8 },
  'Gene traders': { pHgt: 0.25 },
  'Life from chemistry': { mode: 'abiogenesis' },
  'Quiet evolution': { mu: 0.005, pHgt: 0.0 },
};
let frames = [], result = null, playing = false, playT = 0;

function params() {
  return {
    mode: $('in-mode').value, mu: +$('in-mu').value, pHgt: +$('in-hgt').value,
    uvScale: +$('in-uv').value, poisScale: +$('in-pois').value,
    steps: +$('in-steps').value, seed: (Math.random() * 1e9) | 0,
    W: 48, H: 30, nInit: 250, protoInit: 120,
  };
}
function paintLabels() {
  $('v-mu').textContent = (+$('in-mu').value).toFixed(3);
  $('v-hgt').textContent = (+$('in-hgt').value).toFixed(2);
  $('v-uv').textContent = (+$('in-uv').value).toFixed(1) + '×';
  $('v-pois').textContent = (+$('in-pois').value).toFixed(1) + '×';
  $('v-steps').textContent = $('in-steps').value;
}
['in-mu', 'in-hgt', 'in-uv', 'in-pois', 'in-steps'].forEach(id =>
  $(id).addEventListener('input', paintLabels));

function applyPreset(name) {
  const p = PRESETS[name];
  if (p.mode) $('in-mode').value = p.mode;
  if (p.mu !== undefined) $('in-mu').value = p.mu;
  if (p.pHgt !== undefined) $('in-hgt').value = p.pHgt;
  if (p.uvScale !== undefined) $('in-uv').value = p.uvScale;
  if (p.poisScale !== undefined) $('in-pois').value = p.poisScale;
  paintLabels();
}
Object.keys(PRESETS).forEach(name => {
  const b = document.createElement('button');
  b.className = 'btn ghost'; b.style.fontSize = '12px'; b.textContent = name;
  b.onclick = () => {
    applyPreset(name);
    if (name === 'Life from chemistry') $('in-mode').value = 'abiogenesis';
    run();
  };
  $('presets').appendChild(b);
});
// deep links from the library (?preset= / ?mode=)
(function () {
  const q = new URLSearchParams(location.search);
  const preset = q.get('preset');
  if (preset && PRESETS[preset]) applyPreset(preset);
  if (q.get('mode') === 'abiogenesis') $('in-mode').value = 'abiogenesis';
})();

function snapshot(s) {
  // subsampled trait grids for playback
  const { W, H } = s.P, rgb = new Uint8ClampedArray(W * H * 3), red = new Float32Array(W * H);
  for (const m of s.microbes) {
    const [me, u, b, r] = decode(m.g);
    rgb[m.i * 3] = me * 255; rgb[m.i * 3 + 1] = u * 255; rgb[m.i * 3 + 2] = b * 255;
    red[m.i] = r;
  }
  return { rgb, red, pop: s.microbes.length };
}

function run() {
  const P = params();
  $('run-state').textContent = 'simulating ' + P.steps + ' steps…';
  $('btn-run').disabled = true;
  setTimeout(() => { // let the UI breathe before the sub-second compute
    const s = createSim(P);
    frames = [{ rgb: new Uint8ClampedArray(P.W * P.H * 3), red: new Float32Array(P.W * P.H),
                pop: s.microbes.length }];
    for (let k = 0; k < P.steps; k++) {
      stepSim(s);
      if (k % 2 === 0 || k === P.steps - 1) frames.push(snapshot(s));
      if (!s.microbes.length && !s.protocells.length) break;
    }
    // rebuild history + events exactly like runSim
    const h = s.hist, n = h.pop.length, ev = [];
    ev.push(P.mode === 'abiogenesis'
      ? `Step 0: ${P.protoInit} pre-life blobs drift in a chemical soup.`
      : `Step 0: ${P.nInit} microbes wake in poisonous, sun-blasted soil.`);
    if (s.firstEmergence !== null)
      ev.push(`Step ${s.firstEmergence}: the first living cell assembles from chemistry.`);
    let imax = 0;
    for (let i = 0; i < n; i++) if (h.pop[i] > h.pop[imax]) imax = i;
    const ri = h.red.findIndex((v, i) => v >= 0.5 && h.pop[i] > 10);
    if (ri > 0) ev.push(`Step ${ri}: most microbes digest the poison — toxin becomes food.`);
    ev.push(h.pop[n - 1] > 0
      ? `Step ${n - 1}: life endures — ${h.pop[n - 1]} microbes, health ${h.fit[n - 1].toFixed(2)}.`
      : `Step ${n - 1}: extinction. The stress won this time.`);
    result = { h, ev, P, emergences: s.emergences };
    renderAll();
    $('run-state').textContent =
      `done in ${n - 1} steps · ${h.pop[n - 1]} alive · seed ${P.seed} (each run is a fresh roll)`;
    $('btn-run').disabled = false;
  }, 30);
}

function drawFrame(f) {
  const P = result.P;
  const c1 = $('map-trait'), c2 = $('map-red');
  const x1 = c1.getContext('2d'), x2 = c2.getContext('2d');
  const img = x1.createImageData(P.W, P.H);
  for (let i = 0; i < P.W * P.H; i++) {
    img.data[i * 4] = f.rgb[i * 3] || 12; img.data[i * 4 + 1] = f.rgb[i * 3 + 1] || 8;
    img.data[i * 4 + 2] = f.rgb[i * 3 + 2] || 8; img.data[i * 4 + 3] = 255;
  }
  x1.putImageData(img, 0, 0);
  const img2 = x2.createImageData(P.W, P.H);
  for (let i = 0; i < P.W * P.H; i++) {
    img2.data[i * 4] = f.red[i] * 255; img2.data[i * 4 + 1] = 10;
    img2.data[i * 4 + 2] = 10; img2.data[i * 4 + 3] = 255;
  }
  x2.putImageData(img2, 0, 0);
}

function chart(series, labels, colors, title) {
  const w = 520, h = 150, pl = 44, pr = 10, pt = 22, pb = 18;
  const iw = w - pl - pr, ih = h - pt - pb;
  let lo = Infinity, hi = -Infinity;
  series.forEach(s => s.forEach(v => { if (v < lo) lo = v; if (v > hi) hi = v; }));
  if (hi - lo < 1e-9) hi = lo + 1;
  const n = series[0].length;
  const X = i => pl + i / Math.max(n - 1, 1) * iw;
  const Y = v => pt + (1 - (v - lo) / (hi - lo)) * ih;
  let s = `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}">`;
  for (let g = 0; g < 3; g++) {
    const v = lo + (hi - lo) * g / 2, y = Y(v);
    s += `<line x1="${pl}" y1="${y.toFixed(1)}" x2="${w - pr}" y2="${y.toFixed(1)}" stroke="#2A1E14"/>` +
         `<text x="2" y="${(y + 3).toFixed(1)}" class="ylab">${v.toFixed(2)}</text>`;
  }
  series.forEach((sr, k) => {
    const pts = sr.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
    s += `<polyline points="${pts}" fill="none" stroke="${colors[k]}" stroke-width="1.6"/>`;
  });
  s += `<text x="${pl}" y="${h - 4}" class="ylab">step 0</text>` +
       `<text x="${w - 60}" y="${h - 4}" class="ylab">step ${n - 1}</text>`;
  labels.forEach((lab, k) => {
    s += `<circle cx="${pl + k * 130}" cy="8" r="3" fill="${colors[k]}"/>` +
         `<text x="${pl + k * 130 + 7}" y="11" class="ylab">${lab}</text>`;
  });
  return s + '</svg>';
}

function takeaways(h) {
  const n = h.pop.length, out = [];
  const last = a => a[n - 1];
  if (last(h.pop) > 0)
    out.push(['Life survived here.',
      `Population ${h.pop[0]} → ${last(h.pop)}. Under poison and sun, the colony spread.`]);
  else
    out.push(['Life did not survive here.',
      `Population fell to zero. That maps the edge of habitability — try gentler sliders.`]);
  if (last(h.red) > h.red[0] + 0.02)
    out.push(['The poison became food.',
      `Poison-eaters rose ${(h.red[0] * 100).toFixed(0)}% → ${(last(h.red) * 100).toFixed(0)}%. Selection, visible.`]);
  if (last(h.pop) > 0 && last(h.fit) > h.fit[0])
    out.push(['The colony got healthier.',
      `Health ${h.fit[0].toFixed(2)} → ${last(h.fit).toFixed(2)} — adaptation, not luck.`]);
  if (last(h.em) > 0)
    out.push([`Life began ${last(h.em)} time${last(h.em) === 1 ? '' : 's'} from chemistry.`,
      'Blobs of chemicals grew, split, and crossed the line into life.']);
  return out;
}

function renderAll() {
  const { h, ev, P } = result;
  $('results').hidden = false;
  $('res-title').textContent =
    `Results — ${P.mode === 'abiogenesis' ? 'life from chemistry' : 'seeded colony'}, ${h.pop.length - 1} steps`;
  $('takes').innerHTML = takeaways(h).map(([a, b]) =>
    `<div class="take"><h3>${a}</h3><p>${b}</p></div>`).join('');
  const C = { pop: '#A3E635', fit: '#FFB000', sh: '#2DD4BF', red: '#FF4D2E', dim: '#A89880' };
  $('charts').innerHTML =
    `<div><p class="ref">Living microbes (green) + pre-life blobs (grey)</p>${chart([h.pop, h.proto], ['microbes', 'blobs'], [C.pop, C.dim], 'population')}</div>` +
    `<div><p class="ref">Health (amber) + variety (teal)</p>${chart([h.fit, h.sh], ['health', 'variety'], [C.fit, C.sh], 'fitness')}</div>` +
    `<div><p class="ref">Poison-eater share — rising means selection favours them</p>${chart([h.red], ['eaters'], [C.red], 'reducers')}</div>` +
    `<div><p class="ref">Origins of life over time</p>${chart([h.em], ['emergences'], [C.dim], 'emergences')}</div>`;
  $('events').innerHTML = ev.map(t => `<div class="evt">${t}</div>`).join('');
  $('prov').textContent =
    `Parameters: mutation ${P.mu}, gene transfer ${P.pHgt}, sun ×${P.uvScale}, poison ×${P.poisScale}, seed ${P.seed}. ` +
    `Same equations as mars_evolution_abm.py. Related reading: Library → The Poison, The Spread, The Beginning.`;
  const sc = $('scrub');
  sc.max = frames.length - 1; sc.value = frames.length - 1;
  showFrame(frames.length - 1);
  sc.oninput = () => { playing = false; $('btn-play').textContent = 'Replay ▶'; showFrame(+sc.value); };
  $('btn-play').onclick = () => {
    playing = !playing;
    $('btn-play').textContent = playing ? 'Pause ⏸' : 'Replay ▶';
    if (playing) { playT = 0; playLoop(); }
  };
}
function showFrame(i) {
  drawFrame(frames[i]);
  $('frame-lab').textContent = `frame ${i}/${frames.length - 1} · pop ${frames[i].pop}`;
  $('scrub').value = i;
}
function playLoop() {
  if (!playing) return;
  playT++;
  if (playT % 4 === 0) {
    const i = (+$('scrub').value + 1) % frames.length;
    showFrame(i);
    if (i === frames.length - 1) { playing = false; $('btn-play').textContent = 'Replay ▶'; return; }
  }
  requestAnimationFrame(playLoop);
}

$('btn-run').onclick = run;
paintLabels();
if (new URLSearchParams(location.search).has('preset') ||
    new URLSearchParams(location.search).get('mode') === 'abiogenesis') run();
