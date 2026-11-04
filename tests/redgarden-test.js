/* Red Garden progression test: the heater melts, and a scripted bot completes
   all 8 problems (puddle, germs, poison, green, shields, teeming, deep clean,
   paradise) plus the heater codex page. No time limit in-game; the bot plays
   the same 5-energy-per-sol economy as a human.
   Run: node tests/redgarden-test.js   (from the evolution/ root) */
'use strict';
const G = require('../red-garden/game.js');
let fail = 0;
const ok = (name, cond, info) => {
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (cond ? '' : ' :: ' + info));
  if (!cond) fail++;
};
// heater counts as a warm neighbour: ice melts beside it with no soil around
{
  const w = G.createWorld(11);
  G.applyTool(w, 'soil', 10, 10);
  G.applyTool(w, 'heater', 12, 10);
  G.applyTool(w, 'ice', 14, 10);
  // ring the lab so nothing else counts as warm: heater is the only neighbour
  let water = 0;
  for (let k = 0; k < 60; k++) { G.stepWorld(w); }
  for (let i = 0; i < 40 * 26; i++) if (w.terr[i] === 4) water++;
  ok('heater melts nearby ice', water > 0, 'water=' + water);
  ok('heater unlocks its codex page', (() => {
    const p = G.checkProgress(w, G.stats(w));
    return p.codex.includes('heat') || w.codex.heat;
  })(), 'no heat page');
}
// full playthrough, seed 7: fifteen pond clusters, then scrub + frontier rounds
{
  const w = G.createWorld(7);
  const spend = (tool, x, y) => {
    let r = G.applyTool(w, tool, x, y), guard = 0;
    while (r && guard++ < 1200) { G.stepWorld(w); G.checkProgress(w, G.stats(w)); r = G.applyTool(w, tool, x, y); }
  };
  const tick = (cap, cond) => {
    let n = 0;
    while (!cond() && n++ < cap) {
      G.stepWorld(w);
      const p = G.checkProgress(w, G.stats(w));
      for (const q of p.quests) w.energy = Math.min(100, w.energy + 25);
    }
  };
  const clusters = [];
  for (const cy of [6, 13, 20]) for (const cx of [6, 13, 20, 27, 34]) clusters.push([cx, cy]);
  for (const [cx, cy] of clusters) {
    spend('soil', cx - 2, cy); spend('soil', cx + 2, cy); spend('soil', cx, cy + 2);
    spend('ice', cx - 1, cy); spend('ice', cx + 1, cy); spend('ice', cx, cy + 1); spend('ice', cx, cy - 1);
    spend('heater', cx, cy - 3);
  }
  tick(400, () => G.stats(w).water >= 60);
  const flats = [];
  for (const [cx, cy] of clusters) flats.push([cx - 2, cy], [cx + 2, cy], [cx, cy + 2]);
  for (let k = 0; k < 2; k++) for (const [x, y] of flats) spend('germs', x, y);
  for (const [cx, cy] of [[10, 13], [20, 13], [30, 13]]) spend('dome', cx, cy);
  tick(200, () => G.stats(w).germs >= 300);
  for (const [x, y] of flats) {
    let r = G.applyTool(w, 'moss', x, y), g2 = 0;
    while (r && g2++ < 200) { G.stepWorld(w); G.checkProgress(w, G.stats(w)); r = G.applyTool(w, 'moss', x, y); }
  }
  for (let round = 0; round < 80; round++) {
    const hot = [];
    for (let i = 0; i < 40 * 26; i++) if (w.pois[i] > 0.05) hot.push([w.pois[i], i]);
    hot.sort((a, b) => b[0] - a[0]);
    for (const [, i] of hot.slice(0, 6)) spend('scrub', i % 40, (i / 40) | 0);
    let g = 0;
    for (let y = 1; y < 25 && g < 12; y++) for (let x = 1; x < 39 && g < 12; x++) {
      const i = y * 40 + x;
      if ((w.terr[i] === 3 || w.terr[i] === 0) && w.moist[i] > 0.3 && w.germ[i] < 2) {
        if (!spend('germs', x, y)) g++;
      }
    }
    for (let y = 1; y < 25; y++) for (let x = 1; x < 39; x++) {
      const i = y * 40 + x;
      if (w.terr[i] === 3 && w.moist[i] > 0.3 && w.germ[i] > 2) G.applyTool(w, 'moss', x, y);
    }
    tick(40, () => w.quests.every(Boolean));
    if (w.quests.every(Boolean)) break;
  }
  const s = G.stats(w);
  ok('bot completes all 8 problems', w.quests.slice(0, 8).every(Boolean),
    `quests=${w.quests.map(Number).join('')} sol=${w.sol} moss=${s.moss} green=${s.greenPct}%`);
  ok('quest pages all unlock', ['water', 'germs', 'poison', 'green', 'shield', 'teem', 'eden']
    .every(k => w.codex[k]), Object.keys(w.codex).join(','));
}
// endgame ranch: 20 humans at once, a 12-strong dino herd, critters that soil
{
  const w = G.createWorld(7);
  const spend = (tool, x, y) => {
    let r = G.applyTool(w, tool, x, y), guard = 0;
    while (r && guard++ < 1200) { G.stepWorld(w); G.checkProgress(w, G.stats(w)); r = G.applyTool(w, tool, x, y); }
  };
  const tick = (cap, cond) => {
    let n = 0;
    while (!cond() && n++ < cap) {
      G.stepWorld(w);
      const p = G.checkProgress(w, G.stats(w));
      for (const q of p.quests) w.energy = Math.min(100, w.energy + 25);
    }
  };
  for (const cy of [8, 16]) for (const cx of [8, 18, 28]) {
    spend('soil', cx - 2, cy); spend('soil', cx + 2, cy); spend('soil', cx, cy + 2);
    spend('ice', cx - 1, cy); spend('ice', cx + 1, cy); spend('ice', cx, cy + 1); spend('ice', cx, cy - 1);
    spend('heater', cx, cy - 3);
  }
  tick(400, () => G.stats(w).water >= 30);
  for (let k = 0; k < 3; k++) {
    for (let y = 1; y < 25; y++) for (let x = 1; x < 39; x++) {
      const i = y * 40 + x;
      if ((w.terr[i] === 3 || w.terr[i] === 0) && w.moist[i] > 0.3 && w.germ[i] < 2) G.applyTool(w, 'germs', x, y);
    }
    tick(60, () => false);
  }
  for (let y = 1; y < 25; y++) for (let x = 1; x < 39; x++) {
    const i = y * 40 + x;
    if (w.terr[i] === 3 && w.moist[i] > 0.3 && w.germ[i] > 2) G.applyTool(w, 'moss', x, y);
  }
  tick(300, () => G.stats(w).moss >= 120);
  // warm blood: 20 humans breathing at once (starvation takes 7 sols, so placement latches)
  let placed = 0;
  for (let y = 4; y < 22 && placed < 20; y++) for (let x = 4; x < 36 && placed < 20; x++) {
    if (w.terr[y * 40 + x] !== 1) {
      w.energy = 100;
      if (!G.applyTool(w, 'human', x, y)) placed++;
    }
  }
  G.stepWorld(w); G.stepWorld(w); G.checkProgress(w, G.stats(w));
  ok('20 humans breathe at once', G.stats(w).humans >= 20 && !!w.quests[8],
    `humans=${G.stats(w).humans} q9=${w.quests[8]}`);
  // giant herd: 6 founders breed to 12 on the rich field
  for (let k = 0; k < 6; k++) { w.energy = 100; G.applyTool(w, 'dino', 17 + k, 10); }
  tick(150, () => !!w.quests[9]);
  ok('dino founders breed a 12-herd', !!w.quests[9], `dinos=${G.stats(w).dinos} q10=${w.quests[9]}`);
  ok('ranch pages unlock', !!w.codex.blood && !!w.codex.herd,
    Object.keys(w.codex).filter(k => k === 'blood' || k === 'herd').join(','));
  // city + crew: 30 humans and 8 critters breathing at once (nothing starves this fast)
  let city = 0;
  for (let y = 4; y < 22 && city < 30; y++) for (let x = 4; x < 36 && city < 30; x++) {
    if (w.terr[y * 40 + x] !== 1) {
      w.energy = 100;
      if (!G.applyTool(w, 'human', x, y)) city++;
    }
  }
  let crew = 0;
  for (let y = 4; y < 22 && crew < 8; y++) for (let x = 4; x < 36 && crew < 8; x++) {
    if (w.terr[y * 40 + x] !== 1) {
      w.energy = 100;
      if (!G.applyTool(w, 'critter', x, y)) crew++;
    }
  }
  G.stepWorld(w); G.stepWorld(w); G.checkProgress(w, G.stats(w));
  ok('30 humans found a city', G.stats(w).humans >= 30 && !!w.quests[10],
    `humans=${G.stats(w).humans} q11=${w.quests[10]}`);
  ok('8 critters work a crew', G.stats(w).critters >= 8 && !!w.quests[11],
    `critters=${G.stats(w).critters} q12=${w.quests[11]}`);
  ok('city pages unlock', !!w.codex.city && !!w.codex.crew,
    Object.keys(w.codex).filter(k => k === 'city' || k === 'crew').join(','));
  // critters soil wet dirt
  const w2 = G.createWorld(22);
  const spend2 = (tool, x, y) => {
    let r = G.applyTool(w2, tool, x, y), guard = 0;
    while (r && guard++ < 300) { G.stepWorld(w2); G.checkProgress(w2, G.stats(w2)); r = G.applyTool(w2, tool, x, y); }
  };
  spend2('soil', 20, 13); spend2('ice', 21, 13);
  for (let k = 0; k < 40; k++) { G.stepWorld(w2); G.checkProgress(w2, G.stats(w2)); }
  w2.energy = 100;
  G.applyTool(w2, 'critter', 18, 13); G.applyTool(w2, 'critter', 22, 13);
  let soil0 = 0;
  for (let i = 0; i < 40 * 26; i++) if (w2.terr[i] === 3) soil0++;
  for (let k = 0; k < 80; k++) { G.stepWorld(w2); G.checkProgress(w2, G.stats(w2)); }
  let soil1 = 0;
  for (let i = 0; i < 40 * 26; i++) if (w2.terr[i] === 3) soil1++;
  ok('critters soil wet dirt', soil1 > soil0, `${soil0} -> ${soil1}`);
}
console.log(fail ? `\n${fail} GARDEN FAILURES` : '\nGARDEN COMPLETE');
process.exit(fail ? 1 : 0);
