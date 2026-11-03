"""Build a standalone mission-control dashboard (dashboard.html) from sim outputs.

Reads evolution_metrics.csv (+ grid_evolution.gif alongside) and inlines
everything into one file://-safe page: no fetch, no JS chart libs.
Charts are server-side SVG; a scrubber + readouts are vanilla JS.

Run:  .\\.venv\\Scripts\\Activate.ps1 ; python build_dashboard.py
"""
from __future__ import annotations

import csv
import json

CSV = "evolution_metrics.csv"
OUT = "dashboard.html"

C_POP, C_FIT, C_SH, C_RED = "#A3E635", "#FFB000", "#2DD4BF", "#FF4D2E"
C_BONE, C_DIM = "#EDE4D8", "#A89880"


def load_rows():
    with open(CSV, newline="") as f:
        return list(csv.DictReader(f))


def num(rows, key):
    return [float(r[key]) for r in rows]


def chart(series, labels, colors, w=680, h=170, title=""):
    """Multi-series SVG timeline with a JS-driven scrub marker."""
    pl, pr, pt, pb = 46, 14, 12, 22
    iw, ih = w - pl - pr, h - pt - pb
    lo = min(min(s) for s in series)
    hi = max(max(s) for s in series)
    if hi - lo < 1e-9:
        hi = lo + 1.0
    n = len(series[0])

    def X(i):
        return pl + i / max(n - 1, 1) * iw

    def Y(v):
        return pt + (1 - (v - lo) / (hi - lo)) * ih

    parts = [f'<svg viewBox="0 0 {w} {h}" data-pl="{pl}" data-iw="{iw}" '
             f'data-n="{n}" class="chart" role="img" aria-label="{title}">']
    for g in (0, 1, 2):
        v = lo + (hi - lo) * g / 2
        y = Y(v)
        parts.append(
            f'<line x1="{pl}" y1="{y:.1f}" x2="{w - pr}" y2="{y:.1f}" '
            f'stroke="#2A1E14" stroke-width="1"/>'
            f'<text x="4" y="{y + 3:.1f}" class="ylab">{v:.2f}</text>')
    for i, s in enumerate(series):
        pts = " ".join(f"{X(k):.1f},{Y(v):.1f}" for k, v in enumerate(s))
        parts.append(
            f'<polyline points="{pts}" fill="none" '
            f'stroke="{colors[i]}" stroke-width="1.6"/>'
            f'<circle cx="{X(n - 1):.1f}" cy="{Y(s[-1]):.1f}" r="3" '
            f'fill="{colors[i]}"/>')
    parts.append(
        f'<line class="scrub" x1="-20" y1="{pt}" x2="-20" y2="{h - pb}" '
        f'stroke="{C_BONE}" stroke-width="1" stroke-dasharray="3 3" opacity="0.7"/>')
    parts.append(
        f'<text x="{pl}" y="{h - 6}" class="ylab">t+0</text>'
        f'<text x="{w - pr - 34}" y="{h - 6}" class="ylab">t+{n - 1}</text>')
    for k, lab in enumerate(labels):
        parts.append(
            f'<circle cx="{pl + k * 120}" cy="8" r="3" fill="{colors[k]}"/>'
            f'<text x="{pl + k * 120 + 7}" y="11" class="ylab">{lab}</text>')
    parts.append("</svg>")
    return "".join(parts)


def derive_events(rows):
    """Story of the run in plain sentences: (step, kind, sentence)."""
    pop = num(rows, "population")
    red = num(rows, "avg_reducer")
    em = [int(r["emergences"]) for r in rows]
    ev = []
    n0 = int(rows[0]["protocells"]) if float(rows[0]["protocells"]) > 0 else 0
    if n0:
        ev.append((0, "soup",
                   f"Step 0: {n0} blobs of pre-life chemistry drift in a chemical soup. No living cells yet."))
    else:
        ev.append((0, "seed",
                   f"Step 0: {int(rows[0]['population'])} living microbes wake up in poisonous, sun-blasted soil."))
    for i in range(1, len(rows)):
        if em[i] > 0 and em[i - 1] == 0:
            ev.append((i, "genesis",
                       f"Step {i}: the first living cell assembles itself from chemistry. Life has begun — everything after this is evolution."))
            break
    for i, v in enumerate(red):
        if v >= 0.55:
            ev.append((i, "allele",
                       f"Step {i}: most microbes can now eat the poison (perchlorate). A deadly toxin has become food."))
            break
    imax = max(range(len(pop)), key=lambda k: pop[k])
    ev.append((imax, "peak",
               f"Step {imax}: the largest colony — {int(pop[imax])} microbes alive at once."))
    last = rows[-1]
    if int(float(last["population"])) > 0:
        ev.append((len(rows) - 1, "done",
                   f"Step {len(rows) - 1}: life endures. {int(float(last['population']))} microbes, "
                   f"health {float(last['avg_fitness']):.2f} out of 1."))
    else:
        ev.append((len(rows) - 1, "done",
                   f"Step {len(rows) - 1}: life died out. The stress won — try an easier world or stronger microbes."))
    return sorted(ev)


def takeaways(rows):
    """What this run taught us, in plain sentences: (headline, detail)."""
    first, last = rows[0], rows[-1]
    p0, p1 = int(float(first["population"])), int(float(last["population"]))
    f0, f1 = float(first["avg_fitness"]), float(last["avg_fitness"])
    r0, r1 = float(first["avg_reducer"]), float(last["avg_reducer"])
    s0, s1 = float(first["shannon_diversity"]), float(last["shannon_diversity"])
    em_total = int(last["emergences"])
    out = []
    if p1 > 0:
        out.append(("Life survived here.",
                    f"Population went from {p0} to {p1}. Under Mars-like poison and sun, the colony didn't just hang on — it spread."))
    else:
        out.append(("Life did not survive here.",
                    f"Population fell from {p0} to zero. This world, as tuned, is too harsh — that itself is a result: it maps the edge of habitability."))
    if r1 > r0 + 0.02:
        out.append(("The poison became food.",
                    f"Perchlorate-eaters rose from {r0:.0%} to {r1:.0%} of the colony. Natural selection visibly favored microbes that digest the toxin and clean their surroundings."))
    elif p1 > 0:
        out.append(("No takeover by poison-eaters this time.",
                    f"Perchlorate-eaters stayed near {r1:.0%}. Survival came from toughness (repair, membranes), not from eating the toxin."))
    if p1 > 0:
        direction = "held steady" if abs(s1 - s0) < 0.5 else ("rose" if s1 > s0 else "narrowed")
        out.append((f"Variety {direction}.",
                    f"Genetic diversity went from {s0:.1f} to {s1:.1f}. Mutation plus gene-sharing between neighbours kept the gene pool stocked — the raw material for future adaptation."))
    if em_total > 0:
        out.append((f"Life began {em_total} times from chemistry.",
                    "Before the first microbe existed, blobs of chemicals grew, split, and one crossed the line into life. The rest is evolution."))
    if p1 > 0 and f1 > f0:
        out.append(("The colony got healthier over time.",
                    f"Average health climbed from {f0:.2f} to {f1:.2f} — the signature of adaptation, not luck."))
    return out


HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MERIDIANI OPS — Mars Evolution ABM</title>
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = { theme: { extend: {
  colors: { basalt:'#0B0806', slab:'#14100B', seam:'#2A1E14',
            bone:'#EDE4D8', ash:'#A89880', amber:'#FFB000',
            rust:'#FF4D2E', brine:'#2DD4BF', spore:'#A3E635' },
  fontFamily: { mono:['JetBrains Mono','ui-monospace','SFMono-Regular','monospace'],
                sans:['system-ui','Segoe UI','sans-serif'] } } } };
</script>
<style>
  body { background:#0B0806; }
  .panel { background:#14100B; border:1px solid #2A1E14; border-radius:10px; }
  .chip { border:1px solid #2A1E14; border-radius:999px; }
  .badge { border:1px solid #2A1E14; border-radius:4px; }
  .ylab { fill:#A89880; font:10px 'JetBrains Mono',monospace; }
  .tick { font-variant-numeric:tabular-nums; }
  input[type=range] { accent-color:#FFB000; }
  .pulse { animation:pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
  @media (prefers-reduced-motion: reduce) { .pulse { animation:none; } }
  .evt { border-left:2px solid #2A1E14; }
  .evt-soup { border-color:#2DD4BF; } .evt-genesis { border-color:#A3E635; }
  .evt-allele { border-color:#FF4D2E; } .evt-peak { border-color:#FFB000; }
  .evt-seed { border-color:#A89880; } .evt-done { border-color:#EDE4D8; }
</style>
</head>
<body class="text-bone font-sans antialiased">
<header class="sticky top-0 z-10 border-b border-seam" style="background:#0B0806f2">
  <div class="max-w-[1400px] mx-auto px-5 py-3 flex flex-wrap items-center gap-x-5 gap-y-2">
    <div class="font-mono font-bold tracking-tight text-lg">
      MERIDIANI<span class="text-amber">/</span>OPS
      <span class="text-ash font-normal text-sm ml-2">mars evolution abm</span>
    </div>
    <div class="flex gap-2 font-mono text-xs">
      <span class="chip px-3 py-1 text-amber">%%MODE%%</span>
      <span class="chip px-3 py-1 text-ash">%%STEPS%% steps</span>
      <span class="chip px-3 py-1 text-ash">50 × 50 grid</span>
      <span class="chip px-3 py-1"><span class="text-spore pulse">●</span> %%STATUS%%</span>
    </div>
    <div class="ml-auto flex items-center gap-3 font-mono text-xs">
      <span class="badge px-2 py-1 text-ash"> time travel </span>
      <input id="scrub" type="range" min="0" max="%%MAXSTEP%%" value="%%MAXSTEP%%" class="w-44">
      <span id="r-step" class="tick text-amber w-14">t+%%MAXSTEP%%</span>
    </div>
  </div>
</header>
<!--PANELS-->
</body>
</html>
"""

RAIL_ITEM = ('<div class="panel px-4 py-3">'
             '<div class="text-[13px] text-ash">%%LABEL%%</div>'
             '<div class="font-mono text-2xl tick %%COLOR%%" id="%%ID%%">%%VAL%%</div>'
             '<div class="text-[12px] text-ash">%%SUB%%</div>'
             "</div>")


def rail(rows):
    last = rows[-1]
    first = rows[0]
    d = lambda a, b, f: f"went {f(a)} → {f(b)} from start"
    items = [
        ("Living microbes — how many are alive right now",
         "r-pop", "text-spore", int(float(last["population"])),
         d(int(float(first["population"])), int(float(last["population"])), str)),
        ("Average health — 0 is dying, 1 is perfect",
         "r-fit", "text-amber", f'{float(last["avg_fitness"]):.3f}',
         d(float(first["avg_fitness"]), float(last["avg_fitness"]), lambda v: f"{v:.2f}")),
        ("Genetic variety — higher means more kinds of microbes",
         "r-sh", "text-brine", f'{float(last["shannon_diversity"]):.2f}',
         d(float(first["shannon_diversity"]), float(last["shannon_diversity"]), lambda v: f"{v:.1f}")),
        ("Poison-eaters — share of microbes that digest perchlorate",
         "r-red", "text-rust", f'{float(last["avg_reducer"]):.0%}',
         d(float(first["avg_reducer"]), float(last["avg_reducer"]), lambda v: f"{v:.0%}")),
        ("Pre-life blobs — chemistry that is not alive yet",
         "r-proto", "text-bone", int(float(last["protocells"])),
         "only matters in life-from-chemistry mode"),
        ("Origins of life — times chemistry became biology",
         "r-em", "text-bone", int(last["emergences"]), "total for this run"),
    ]
    return "".join(RAIL_ITEM.replace("%%LABEL%%", lab).replace("%%ID%%", i)
                   .replace("%%COLOR%%", c).replace("%%VAL%%", str(v))
                   .replace("%%SUB%%", s) for lab, i, c, v, s in items)


BODY = """<main class="max-w-[1400px] mx-auto px-5 py-5 flex flex-col gap-4">
  <section class="panel p-5">
    <h2 class="font-mono font-bold text-lg mb-1">What question is this answering?</h2>
    <p class="text-[15px] leading-relaxed max-w-[90ch]">
      Mars soil is poisonous and sun-blasted. So: <span class="text-bone font-semibold">could living things survive there — and how would they change?</span>
      This page is a sandbox for that question. A computer grows thousands of virtual microbes under Mars-like stress
      and watches who lives, who dies, and which new tricks (like <span class="text-rust">eating the poison</span>) take over the colony.
    </p>
    <p class="text-[13px] text-ash mt-2">Why it matters: farming Mars soil · choosing where rovers should look for life ·
    judging whether Earth germs could contaminate Mars · testing how life itself might begin.</p>
  </section>
  <section class="panel px-5 py-3 text-[13px] text-ash">
    <span class="text-bone font-semibold">How to read this page in 30 seconds:</span>
    1. Watch the colony movie below. 2. Read “What this run taught us”.
    3. Drag the <span class="text-amber">time slider</span> up top to travel back through history.
  </section>
  <section class="panel p-5">
    <h2 class="font-mono font-bold text-lg mb-3">What this run taught us</h2>
    <div class="flex flex-col gap-3">%%TAKES%%</div>
  </section>
  <div class="grid grid-cols-12 gap-4">
  <aside class="col-span-12 lg:col-span-3 flex flex-col gap-3">
    <div class="text-[13px] text-ash px-1">Live numbers <span class="text-seam">//</span> move the time slider to see any moment</div>
    %%RAIL%%
    <div class="panel px-4 py-3 text-[12px] text-ash leading-relaxed">
      Under the hood: each microbe has a 28-switch genome (food use, sun repair, skin strength, poison eating).
      Each step it eats, risks death from stress, has babies with small mutations, and sometimes swaps genes with neighbours.
    </div>
  </aside>
  <section class="col-span-12 lg:col-span-9 flex flex-col gap-4">
    <div class="panel p-4">
      <div class="flex items-baseline gap-3 mb-2 flex-wrap">
        <h2 class="font-mono font-bold">The colony movie</h2>
        <span class="text-[12px] text-ash">Left: who lives where (red = good at eating, green = sun repair, blue = tough skin).
        Right: poison-eaters glowing red as they spread.</span>
      </div>
      <img src="grid_evolution.gif" alt="animated 2D grid of evolving microbes"
           class="w-full border border-seam" style="border-radius:6px">
    </div>
    <div class="panel p-4">
      <h2 class="font-mono font-bold mb-1">How many are alive over time</h2>
      <p class="text-[12px] text-ash mb-2">Green = living microbes. If this climbs, life is winning; if it crashes to zero, the world was too harsh.</p>
      %%C0%%
    </div>
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div class="panel p-4">
        <h2 class="font-mono font-bold mb-1">How healthy the colony is</h2>
        <p class="text-[12px] text-ash mb-2">Average health from 0 to 1. A rising line means evolution is working, not just luck.</p>
        %%C1%%
      </div>
      <div class="panel p-4">
        <h2 class="font-mono font-bold mb-1">The poison becomes food</h2>
        <p class="text-[12px] text-ash mb-2">Share of microbes that digest perchlorate. Rising = natural selection favouring poison-eaters.</p>
        %%C2%%
      </div>
    </div>
    <div class="panel p-4">
      <div class="flex items-baseline gap-3 mb-2">
        <h2 class="font-mono font-bold">Story of this run</h2>
      </div>
      <ol class="flex flex-col gap-2 text-[13px]">
        %%EVENTS%%
      </ol>
    </div>
    <footer class="text-[12px] text-ash px-1">
      Built from <span class="text-bone">evolution_metrics.csv (%%STEPS%% steps)</span> by
      <span class="text-bone">mars_evolution_abm.py</span> · refresh with <span class="text-bone">python build_dashboard.py</span>
    </footer>
  </section>
  </div>
</main>
<script>
const D = %%DATA%%;
const N = D.pop.length;
const $ = id => document.getElementById(id);
function setScrub(i) {
  $('r-step').textContent = 't+' + i;
  const put = (id, v) => $(id).textContent = v;
  put('r-pop', D.pop[i]); put('r-fit', D.fit[i].toFixed(3));
  put('r-sh', D.sh[i].toFixed(2));
  put('r-red', Math.round(D.red[i] * 100) + '%');
  put('r-proto', D.proto[i]); put('r-em', D.em[i]);
  document.querySelectorAll('svg.chart').forEach(svg => {
    const pl = +svg.dataset.pl, iw = +svg.dataset.iw;
    const x = pl + i / (N - 1) * iw;
    svg.querySelectorAll('.scrub').forEach(l => {
      l.setAttribute('x1', x); l.setAttribute('x2', x);
    });
  });
}
$('scrub').addEventListener('input', e => setScrub(+e.target.value));
setScrub(N - 1);
</script>"""


def main():
    rows = load_rows()
    n = len(rows)
    pop = [int(float(r["population"])) for r in rows]
    fit = num(rows, "avg_fitness")
    sh = num(rows, "shannon_diversity")
    red = num(rows, "avg_reducer")
    proto = [int(float(r["protocells"])) for r in rows]
    em = [int(r["emergences"]) for r in rows]
    abi = max(em) > 0 or float(rows[0]["protocells"]) > 0
    mode = "life from chemistry" if abi else "seeded colony"
    status = "alive" if pop[-1] > 0 else "died out"
    c0 = chart([pop, proto], ["microbes", "protocells"], [C_POP, C_DIM], title="occupancy")
    c1 = chart([fit], ["avg fitness"], [C_FIT], title="fitness")
    c2 = chart([red], ["reducer freq"], [C_RED], title="reducers")
    ev_html = "".join(
        f'<li class="evt evt-{k} pl-3 py-1 text-ash">{t}</li>'
        for _, k, t in derive_events(rows))
    take_html = "".join(
        f'<div><div class="text-[15px] font-semibold text-bone">{h}</div>'
        f'<div class="text-[13px] text-ash">{d}</div></div>'
        for h, d in takeaways(rows))
    body = BODY.replace("%%RAIL%%", rail(rows)).replace("%%C0%%", c0) \
        .replace("%%C1%%", c1).replace("%%C2%%", c2) \
        .replace("%%EVENTS%%", ev_html).replace("%%TAKES%%", take_html) \
        .replace("%%STEPS%%", str(n)) \
        .replace("%%DATA%%", json.dumps(
            {"pop": pop, "fit": fit, "sh": sh, "red": red,
             "proto": proto, "em": em}))
    html = HEAD.replace("<!--PANELS-->", body) \
        .replace("%%MODE%%", mode).replace("%%STEPS%%", str(n)) \
        .replace("%%STATUS%%", status).replace("%%MAXSTEP%%", str(n - 1))
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"wrote {OUT} ({n} steps, mode={mode}, status={status})")


if __name__ == "__main__":
    main()
