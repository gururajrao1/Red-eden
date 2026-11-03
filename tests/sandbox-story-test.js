/* Story-coverage test: every paper promising a story gets one, every chapter
   is shaped like readable pages (not a wall of text), and the reader page
   is wired to the library.
   Run: node tests/sandbox-story-test.js   (from the evolution/ root) */
'use strict';
const fs = require('fs');
const vm = require('vm');
const base = __dirname + '/../app/';
const sb = { console };
vm.createContext(sb);
vm.runInContext(fs.readFileSync(base + 'papers.js', 'utf8'), sb);
vm.runInContext(fs.readFileSync(base + 'chapters.js', 'utf8'), sb);
const V = expr => vm.runInContext(expr, sb);
let fail = 0;
const ok = (name, cond, info) => {
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (cond ? '' : ' :: ' + info));
  if (!cond) fail++;
};
const stories = V(`PAPERS.filter(p => p.story).map(p => p.story)`);
const keys = V(`Object.keys(CHAPTERS)`);
ok('every promised story exists', stories.every(s => keys.includes(s)),
  'missing: ' + stories.filter(s => !keys.includes(s)).join(','));
ok('at least one story shipped', keys.length >= 1, 'none');
for (const k of keys) {
  const ch = V(`CHAPTERS[${JSON.stringify(k)}]`);
  ok(`${k}: 4-6 pages`, ch.pages.length >= 4 && ch.pages.length <= 6, ch.pages.length);
  ok(`${k}: every page titled with kicker + body`,
    ch.pages.every(p => p.h && p.kick && p.paras && p.paras.length >= 2),
    'shapeless page');
  ok(`${k}: paragraphs are readable chunks`, ch.pages.every(p => p.paras.every(t => t.length <= 700)),
    'wall of text');
  ok(`${k}: replayable experiment`, ch.experiment && ch.experiment.steps.length >= 3,
    'no experiment');
  ok(`${k}: sources + honesty note`, ch.sources.length >= 1 && ch.dramatized && ch.dramatized.length > 20,
    'uncited');
}
const lib = fs.readFileSync(base + 'library.html', 'utf8');
const story = fs.readFileSync(base + 'story.html', 'utf8');
ok('library loads chapters + queue', lib.includes('chapters.js') && lib.includes('id="queue"')
  && lib.includes('story.html?c='), 'wiring');
ok('reader has pager + honesty panel', story.includes('id="prev"') && story.includes('id="next"')
  && story.includes('id="paras"') && story.includes('How this story was made'), 'reader');
console.log(fail ? `\n${fail} STORY FAILURES` : `\nALL STORIES SHIPPED (${keys.length} chapter${keys.length > 1 ? 's' : ''})`);
process.exit(fail ? 1 : 0);
