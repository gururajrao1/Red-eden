"""Mars-like early microbial evolution ABM (Mesa + NumPy + Numba).

Environment: 2D grid with dynamic Temperature/UV flux, Perchlorate
toxicity, Water Activity (a_w), nutrients and (in abiogenesis mode)
prebiotic monomers.
Agents: microbes with binary genotype -> (metabolic efficiency,
UV repair, membrane integrity, perchlorate reduction), energy, age,
reproduction threshold. Optional protocell prequel: genome-free
protocells feed on monomers and can emerge as living microbes.

Modes:
  seeded (default) ... start from --n_init random microbes
  abiogenesis ........ --abiogenesis starts from --proto_init protocells
  HGT sweep .......... compare runs with --p_hgt 0.0 vs 0.2

Outputs: evolution_metrics.csv, grid_evolution.gif, metrics_plot.png
Run:  .\\.venv\\Scripts\\Activate.ps1 ; python mars_evolution_abm.py [--steps 200] [--show]
"""
from __future__ import annotations

import argparse
import csv
import random

import mesa
import mesa.space as space
import numpy as np
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from numba import njit

# ----------------------------------------------------------------------------
# Accelerated helpers
# ----------------------------------------------------------------------------
L_GENOME = 28
N_METAB, N_UV, N_MEM, N_RED = 8, 8, 8, 4


@njit
def decode_phenotype(genotype):
    metab = np.mean(genotype[0:8])
    uv_rep = np.mean(genotype[8:16])
    memb = np.mean(genotype[16:24])
    red = np.mean(genotype[24:28])
    metab_eff = 0.3 + 0.7 * metab
    return metab_eff, uv_rep, memb, red


@njit
def death_probability(stress, resistance):
    if resistance < 1e-6:
        return 1.0
    p = 1.0 - np.exp(-stress / resistance)
    if p < 0.0:
        return 0.0
    if p > 1.0:
        return 1.0
    return p


@njit
def shannon_index(counts, total):
    h = 0.0
    for c in counts:
        if c > 0:
            p = c / total
            h -= p * np.log(p)
    return h


# ----------------------------------------------------------------------------
# Agent
# ----------------------------------------------------------------------------
class Microbe(mesa.Agent):
    """Microbial agent with binary genotype, energy, age."""

    def __init__(self, model, genotype=None, energy=None, pos=None):
        super().__init__(model)
        if genotype is None:
            genotype = (np.random.rand(L_GENOME) < 0.5).astype(np.float64)
        self.genotype = genotype.astype(np.float64)
        self.energy = float(energy) if energy is not None else model.e_init
        self.age = 0
        self.e_thresh = model.e_thresh

    @property
    def phenotype(self):
        return decode_phenotype(self.genotype)

    @property
    def fitness(self):
        m, u, b, r = decode_phenotype(self.genotype)
        return 0.35 * m + 0.25 * u + 0.25 * b + 0.15 * r

    def step(self):
        m = self.model
        x, y = self.pos
        # -- Step 1: resource consumption & basal metabolism -----------------
        avail = m.nutrients[x, y]
        metab_eff, _, _, perch_red = decode_phenotype(self.genotype)
        uptake = min(avail, m.uptake_max * (0.4 + 0.6 * metab_eff))
        m.nutrients[x, y] = avail - uptake
        self.energy += uptake * m.yield_eff
        # perchlorate reducers eat the toxin: energy bonus + local detox
        if perch_red > 0.0 and m.perch[x, y] > 0.0:
            meal = min(m.perch[x, y], perch_red * m.red_uptake)
            self.energy += meal * m.red_yield
            m.perch[x, y] = max(0.0, m.perch[x, y] - meal * m.detox_rate)
        basal = m.basal_cost * (1.4 - 0.6 * metab_eff)
        self.energy -= basal
        self.age += 1
        if self.energy <= 0 or self.age > m.max_age:
            m.kill(self)
            return
        # -- Step 2: environmental stress check ------------------------------
        uv = m.uv[x, y]
        pc = m.perch[x, y]
        aw = m.aw[x, y]
        _, uv_rep, memb, perch_red = decode_phenotype(self.genotype)
        pc_eff = pc * (1.0 - 0.75 * perch_red)
        stress = m.stress_scale * (m.w_uv * uv + m.w_pc * pc_eff + m.w_aw * (1.0 - aw))
        resistance = m.w_uv * (0.15 + uv_rep) + m.w_mem * (0.15 + memb) + 1e-3
        resistance *= m.resist_scale
        if random.random() < death_probability(stress, resistance):
            m.kill(self)
            return
        # chemotaxis: drift toward the richest adjacent cell when hungry
        if self.energy < self.e_thresh:
            nbrs = m.grid.get_neighborhood(
                self.pos, moore=True, include_center=True)
            best = max(nbrs, key=lambda c: m.nutrients[c[0], c[1]])
            if best != self.pos and m.grid.is_cell_empty(best):
                m.grid.move_agent(self, best)
                x, y = self.pos
        # -- Step 3: mutation & replication ----------------------------------
        if self.energy >= self.e_thresh:
            m.replicate(self)
            if not self.is_alive():
                return
        # -- Step 4: horizontal gene transfer --------------------------------
        if random.random() < m.p_hgt:
            m.hgt(self)

    def is_alive(self):
        return self in self.model.microbes


class Protocell(mesa.Agent):
    """Prebiotic protocell: grows from monomers, splits, may emerge as life.

    Has no genome yet — only a polymer length and a stability draw.
    Crossing the emergence threshold converts it into a Microbe.
    """

    def __init__(self, model, length=2.0):
        super().__init__(model)
        self.length = float(length)
        self.stability = random.random()

    def step(self):
        m = self.model
        x, y = self.pos
        # feed on monomers
        meal = min(m.monomers[x, y], m.proto_uptake)
        m.monomers[x, y] -= meal
        self.length += meal * m.proto_growth
        self.length -= m.proto_decay
        # UV dissolution risk (no repair machinery yet; brines give
        # partial shielding, hence the higher resistance than bare exposure)
        if random.random() < death_probability(
                m.stress_scale * m.w_uv * m.uv[x, y], 1.2):
            m.kill_proto(self)
            return
        if self.length <= 0:
            m.kill_proto(self)
            return
        # split when long enough
        if self.length >= m.proto_split:
            cell = m.empty_neighbor(self.pos)
            if cell is not None:
                self.length /= 2.0
                child = Protocell(self.model, length=self.length)
                m.grid.place_agent(child, cell)
                m.protocells.append(child)
        # emergence: long + stable + wet enough -> first genome
        aw = m.aw[x, y]
        if (self.length >= m.emerge_len
                and self.stability + 0.5 * aw > m.emerge_bar):
            m.emerge(self)


# ----------------------------------------------------------------------------
# Model
# ----------------------------------------------------------------------------
class MarsModel(mesa.Model):
    """Mars-like 2D grid model with dynamic stress fields."""

    def __init__(self, width=50, height=50, n_init=300, seed=42,
                 mu=0.02, e_thresh=14.0, p_hgt=0.05,
                 abiogenesis=False, proto_init=150):
        super().__init__(seed=seed)
        random.seed(seed)
        np.random.seed(seed)
        self.width, self.height = width, height
        self.grid = space.SingleGrid(width, height, torus=False)
        self.mu = mu
        self.mu_dup = mu * 0.25
        self.mu_fs = mu * 0.15
        self.e_init = 10.0
        self.e_thresh = e_thresh
        self.p_hgt = p_hgt
        self.uptake_max = 2.0
        self.yield_eff = 0.9
        self.basal_cost = 0.4
        self.max_age = 120
        self.w_uv, self.w_pc, self.w_aw, self.w_mem = 0.6, 0.7, 0.8, 1.0
        self.resist_scale = 6.0
        self.stress_scale = 0.35
        self.repro_cost = 2.0
        # perchlorate-reducer niche
        self.red_uptake = 0.35
        self.red_yield = 2.2
        self.detox_rate = 0.10
        # abiogenesis prequel parameters
        self.abiogenesis = abiogenesis
        self.proto_uptake = 1.2
        self.proto_growth = 2.2
        self.proto_decay = 0.15
        self.proto_split = 16.0
        self.emerge_len = 10.0
        self.emerge_bar = 1.05
        self.microbes: list[Microbe] = []
        self.protocells: list[Protocell] = []
        self.emergences = 0
        self.first_emergence_step: int | None = None
        self._init_environment()
        if abiogenesis:
            self._seed_protocells(proto_init)
        else:
            self._seed_population(n_init)
        # metrics history
        self.hist_pop: list[int] = []
        self.hist_fit: list[float] = []
        self.hist_shannon: list[float] = []
        self.hist_red: list[float] = []
        self.hist_proto: list[int] = []
        self.hist_emerged: list[int] = []
        self.snapshots: list[np.ndarray] = []
        self.red_snapshots: list[np.ndarray] = []

    # -- environment ---------------------------------------------------------
    def _init_environment(self):
        W, H = self.width, self.height
        xx, yy = np.meshgrid(np.arange(W), np.arange(H), indexing="ij")
        # UV flux: latitudinal gradient (harsher north) + noise
        self.uv_base = 0.35 + 0.65 * (xx / max(W - 1, 1))
        self.uv_base += np.random.normal(0, 0.03, size=(W, H))
        # Perchlorate hotspots: a few gaussian patches
        self.perch = np.full((W, H), 0.15)
        for _ in range(6):
            cx, cy = np.random.randint(0, W), np.random.randint(0, H)
            s = np.random.uniform(4, 9)
            d2 = (xx - cx) ** 2 + (yy - cy) ** 2
            self.perch += 0.8 * np.exp(-d2 / (2 * s * s))
        self.perch = np.clip(self.perch / self.perch.max(), 0, 1)
        self.nutrients = np.clip(
            np.random.normal(2.0, 0.8, size=(W, H)), 0.2, 5.0)
        self.monomers = np.clip(
            np.random.normal(3.0, 1.0, size=(W, H)), 0.2, 6.0)
        self.uv = self.uv_base.copy()
        self.aw = np.clip(0.95 - 0.45 * self.perch - 0.10 * self.uv, 0.40, 1.0)
        self.t = 0

    def _seed_population(self, n_init):
        placed = 0
        attempts = 0
        while placed < n_init and attempts < n_init * 20:
            attempts += 1
            x = self.random.randrange(self.width)
            y = self.random.randrange(self.height)
            if self.grid.is_cell_empty((x, y)):
                a = Microbe(self, energy=self.e_init)
                self.grid.place_agent(a, (x, y))
                self.microbes.append(a)
                placed += 1

    def _seed_protocells(self, n_proto):
        placed, attempts = 0, 0
        while placed < n_proto and attempts < n_proto * 20:
            attempts += 1
            x = self.random.randrange(self.width)
            y = self.random.randrange(self.height)
            if self.grid.is_cell_empty((x, y)):
                p = Protocell(self)
                self.grid.place_agent(p, (x, y))
                self.protocells.append(p)
                placed += 1

    def kill_proto(self, agent):
        try:
            self.grid.remove_agent(agent)
        except Exception:
            pass
        try:
            self.protocells.remove(agent)
        except ValueError:
            pass
        try:
            agent.remove()
        except Exception:
            pass

    def emerge(self, proto):
        """A protocell becomes the first living microbe."""
        pos = proto.pos
        self.kill_proto(proto)
        baby = Microbe(self, energy=self.e_init)
        self.grid.place_agent(baby, pos)
        self.microbes.append(baby)
        self.emergences += 1
        if self.first_emergence_step is None:
            self.first_emergence_step = self.t

    # -- agent helpers -------------------------------------------------------
    def kill(self, agent):
        try:
            self.grid.remove_agent(agent)
        except Exception:
            pass
        try:
            self.microbes.remove(agent)
        except ValueError:
            pass
        try:
            agent.remove()
        except Exception:
            pass

    def mutate(self, genotype):
        g = genotype.copy()
        # point mutations
        flips = np.random.rand(L_GENOME) < self.mu
        g[flips] = 1.0 - g[flips]
        # gene duplication: copy a 4-locus block over another random block
        if np.random.rand() < self.mu_dup:
            src = np.random.randint(0, L_GENOME - 4)
            dst = np.random.randint(0, L_GENOME - 4)
            g[dst:dst + 4] = genotype[src:src + 4]
        # frameshift: shift a tail segment by one locus
        if np.random.rand() < self.mu_fs:
            at = np.random.randint(0, L_GENOME - 2)
            g[at + 1:] = g[at:-1]
            g[at] = float(np.random.randint(0, 2))
        return g

    def empty_neighbor(self, pos):
        nbrs = self.grid.get_neighborhood(pos, moore=True, include_center=False)
        empty = [c for c in nbrs if self.grid.is_cell_empty(c)]
        return self.random.choice(empty) if empty else None

    def replicate(self, parent):
        cell = self.empty_neighbor(parent.pos)
        if cell is None:
            return
        child_g = self.mutate(parent.genotype)
        parent.energy -= self.repro_cost
        if parent.energy <= 0:
            self.kill(parent)
            return
        e_child = parent.energy / 2.0
        parent.energy /= 2.0
        child = Microbe(self, genotype=child_g, energy=e_child)
        self.grid.place_agent(child, cell)
        self.microbes.append(child)

    def hgt(self, agent, radius=1):
        nbrs = self.grid.get_neighborhood(
            agent.pos, moore=True, include_center=False, radius=radius)
        donors = [self.grid[x, y] for (x, y) in nbrs
                  if not self.grid.is_cell_empty((x, y))]
        # only true microbes carry genomes; protocells cannot donate
        donors = [d for d in donors
                  if d is not agent and isinstance(d, Microbe)]
        if not donors:
            return
        donor = self.random.choice(donors)
        src = np.random.randint(0, L_GENOME - 4)
        agent.genotype[src:src + 4] = donor.genotype[src:src + 4]
        agent.energy = max(0.0, agent.energy - 0.1)

    # -- dynamics -------------------------------------------------------------
    def update_environment(self):
        self.t += 1
        # diurnal UV cycle + noise
        cyc = 0.6 + 0.4 * np.sin(2 * np.pi * self.t / 50.0)
        self.uv = np.clip(self.uv_base * cyc + np.random.normal(
            0, 0.01, size=self.uv.shape), 0, 1.5)
        # slow perchlorate diffusion (4-neighbour blur every 5 steps)
        if self.t % 5 == 0:
            p = self.perch
            self.perch = np.clip(0.8 * p + 0.05 * (
                np.roll(p, 1, 0) + np.roll(p, -1, 0)
                + np.roll(p, 1, 1) + np.roll(p, -1, 1)), 0, 1)
        # water activity falls where perchlorate/UV are high
        self.aw = np.clip(
            0.95 - 0.45 * self.perch - 0.10 * self.uv
            + np.random.normal(0, 0.005, size=self.uv.shape), 0.40, 1.0)
        # nutrient replenishment + weak diffusion
        self.nutrients = np.clip(
            self.nutrients * 0.995 + 0.30
            + np.random.normal(0, 0.02, size=self.uv.shape), 0.0, 5.0)
        # monomer rain (feedstock for the prebiotic soup)
        self.monomers = np.clip(
            self.monomers * 0.99 + (0.40 if self.abiogenesis else 0.0)
            + np.random.normal(0, 0.02, size=self.uv.shape), 0.0, 6.0)

    def collect_metrics(self):
        n = len(self.microbes)
        self.hist_pop.append(n)
        self.hist_proto.append(len(self.protocells))
        self.hist_emerged.append(self.emergences)
        if n == 0:
            self.hist_fit.append(0.0)
            self.hist_shannon.append(0.0)
            self.hist_red.append(0.0)
            return
        fits = np.array([a.fitness for a in self.microbes])
        self.hist_fit.append(float(fits.mean()))
        reds = np.array([decode_phenotype(a.genotype)[3]
                         for a in self.microbes])
        self.hist_red.append(float(reds.mean()))
        strains: dict[str, int] = {}
        for a in self.microbes:
            key = "".join("1" if b > 0.5 else "0" for b in a.genotype)
            strains[key] = strains.get(key, 0) + 1
        counts = np.array(list(strains.values()), dtype=np.float64)
        self.hist_shannon.append(float(shannon_index(counts, float(n))))

    def snapshot_rgb(self):
        img = np.zeros((self.width, self.height, 3))
        for a in self.microbes:
            m, u, b, _ = decode_phenotype(a.genotype)
            x, y = a.pos
            img[x, y, 0] = m
            img[x, y, 1] = u
            img[x, y, 2] = b
        return img

    def snapshot_red(self):
        img = np.zeros((self.width, self.height))
        for a in self.microbes:
            _, _, _, r = decode_phenotype(a.genotype)
            x, y = a.pos
            img[x, y] = r
        return img

    def step(self):
        self.update_environment()
        for p in self.random.sample(self.protocells, len(self.protocells)):
            if p in self.protocells:
                p.step()
        for a in self.random.sample(self.microbes, len(self.microbes)):
            if a in self.microbes:
                a.step()
        self.collect_metrics()

    def run(self, steps, snapshot_every=2):
        self.collect_metrics()
        self.snapshots.append(self.snapshot_rgb())
        self.red_snapshots.append(self.snapshot_red())
        for _ in range(steps):
            self.step()
            if self.t % snapshot_every == 0:
                self.snapshots.append(self.snapshot_rgb())
                self.red_snapshots.append(self.snapshot_red())
            if len(self.microbes) == 0 and len(self.protocells) == 0:
                break


# ----------------------------------------------------------------------------
# Outputs: CSV + plots + GIF
# ----------------------------------------------------------------------------
def save_csv(model, path="evolution_metrics.csv"):
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["step", "population", "avg_fitness", "shannon_diversity",
                    "avg_reducer", "protocells", "emergences"])
        for i, (p, fit, sh, red, pr, em) in enumerate(zip(
                model.hist_pop, model.hist_fit, model.hist_shannon,
                model.hist_red, model.hist_proto, model.hist_emerged)):
            w.writerow([i, p, f"{fit:.6f}", f"{sh:.6f}",
                        f"{red:.6f}", pr, em])


def save_metrics_plot(model, path="metrics_plot.png"):
    fig, ax = plt.subplots(4, 1, figsize=(9, 10), sharex=True)
    ax[0].plot(model.hist_pop, color="tab:green", label="microbes")
    ax[0].plot(model.hist_proto, color="tab:olive", label="protocells")
    ax[0].set_ylabel("Agents")
    ax[0].legend(fontsize=8)
    ax[1].plot(model.hist_fit, color="tab:blue")
    ax[1].set_ylabel("Avg fitness")
    ax[2].plot(model.hist_shannon, color="tab:purple")
    ax[2].set_ylabel("Shannon index")
    ax[3].plot(model.hist_red, color="tab:red")
    ax[3].set_ylabel("Reducer freq")
    ax[3].set_xlabel("Step")
    fig.suptitle("Mars ABM: population / fitness / diversity / reducers")
    fig.tight_layout()
    fig.savefig(path, dpi=130)
    plt.close(fig)


def save_grid_gif(model, path="grid_evolution.gif", fps=10):
    snaps = model.snapshots
    reds = model.red_snapshots
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 5))
    im1 = ax1.imshow(np.transpose(snaps[0], (1, 0, 2)),
                     origin="lower", vmin=0, vmax=1)
    ax1.set_title("Traits (R=metab G=UV B=mem)")
    im2 = ax2.imshow(np.transpose(reds[0], (1, 0)), origin="lower",
                     vmin=0, vmax=1, cmap="Reds")
    ax2.set_title("Reducer allele")

    def upd(i):
        im1.set_data(np.transpose(snaps[i], (1, 0, 2)))
        im2.set_data(np.transpose(reds[i], (1, 0)))
        k = min(i * 2, len(model.hist_pop) - 1)
        ax1.set_title(f"Traits step {i * 2} pop {model.hist_pop[k]}")
        ax2.set_title(f"Reducers step {i * 2} f={model.hist_red[k]:.2f}")
        return [im1, im2]

    ani = animation.FuncAnimation(fig, upd, frames=len(snaps),
                                  interval=1000 / fps, blit=False)
    ani.save(path, writer="pillow", fps=fps)
    plt.close(fig)


def main():
    ap = argparse.ArgumentParser(description="Mars microbial evolution ABM")
    ap.add_argument("--steps", type=int, default=200)
    ap.add_argument("--width", type=int, default=50)
    ap.add_argument("--height", type=int, default=50)
    ap.add_argument("--n_init", type=int, default=300)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--mu", type=float, default=0.02)
    ap.add_argument("--p_hgt", type=float, default=0.05)
    ap.add_argument("--abiogenesis", action="store_true",
                    help="start from protocells instead of seeded microbes")
    ap.add_argument("--proto_init", type=int, default=150)
    ap.add_argument("--show", action="store_true",
                    help="display metrics plot interactively")
    args = ap.parse_args()

    model = MarsModel(width=args.width, height=args.height,
                      n_init=args.n_init, seed=args.seed, mu=args.mu,
                      p_hgt=args.p_hgt, abiogenesis=args.abiogenesis,
                      proto_init=args.proto_init)
    model.run(args.steps)
    save_csv(model)
    save_metrics_plot(model)
    save_grid_gif(model)
    print(f"steps={len(model.hist_pop)} final_pop={model.hist_pop[-1]} "
          f"final_fit={model.hist_fit[-1]:.3f} "
          f"final_shannon={model.hist_shannon[-1]:.3f} "
          f"final_red={model.hist_red[-1]:.3f} "
          f"emergences={model.emergences} "
          f"first_emergence={model.first_emergence_step}")
    print("wrote evolution_metrics.csv, metrics_plot.png, grid_evolution.gif")
    if args.show:
        import subprocess
        import sys
        subprocess.run([sys.executable, "-c",
                        "import matplotlib.pyplot as plt, pandas as pd;"
                        "d=pd.read_csv('evolution_metrics.csv');"
                        "d.plot(x='step', subplots=True, layout=(3,1), figsize=(9,8));"
                        "plt.tight_layout(); plt.show()"])


if __name__ == "__main__":
    main()

