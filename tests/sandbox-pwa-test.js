/* PWA test: the app installs and runs offline — manifest parses, icons are
   real PNGs at the declared sizes, the worker caches a shell that exists,
   and the page wires it all with touch that cannot scroll.
   Run: node tests/sandbox-pwa-test.js   (from the evolution/ root) */
'use strict';
const fs = require('fs');
const base = __dirname + '/../app/';
let fail = 0;
const ok = (name, cond, info) => {
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (cond ? '' : ' :: ' + info));
  if (!cond) fail++;
};
const manifest = JSON.parse(fs.readFileSync(base + 'manifest.json', 'utf8'));
ok('manifest names the app', manifest.short_name === 'RED EDEN' && manifest.display === 'standalone',
  manifest.short_name);
ok('manifest starts in the sandbox', manifest.start_url === 'sandbox.html', manifest.start_url);
for (const ic of manifest.icons) {
  const p = base + ic.src, buf = fs.readFileSync(p);
  const sig = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  ok(`icon ${ic.sizes} is a real PNG`, sig && `${w}x${h}` === ic.sizes, `${w}x${h}`);
}
const sw = fs.readFileSync(base + 'sw.js', 'utf8');
const shell = [...sw.matchAll(/'([a-z0-9./-]+\.(?:html|css|js|png|json))'/g)].map(m => m[1]);
ok('worker caches a non-empty shell', shell.length >= 10, shell.length);
ok('every cached file exists', shell.every(f => fs.existsSync(base + f)),
  'missing: ' + shell.filter(f => !fs.existsSync(base + f)).join(','));
ok('worker installs, cleans, serves', sw.includes("addEventListener('install'")
  && sw.includes("addEventListener('activate'") && sw.includes("addEventListener('fetch'"), 'handlers');
const html = fs.readFileSync(base + 'sandbox.html', 'utf8');
ok('page links manifest + theme + touch icon',
  html.includes('rel="manifest"') && html.includes('name="theme-color"')
  && html.includes('apple-touch-icon'), 'head wiring');
ok('page registers the worker', html.includes("serviceWorker.register('sw.js')"), 'register');
ok('canvas cannot scroll the page', /#sandbox\{[^}]*touch-action:none/.test(html), 'touch-action');
console.log(fail ? `\n${fail} PWA FAILURES` : '\nAPP SHELL INSTALLS + OFFLINES');
process.exit(fail ? 1 : 0);
