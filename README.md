<div align="center">
  
# MORPHOS — Generative Evolutionary Specimen Laboratory

> *“From simple rules, infinite worlds unfold.”*

MORPHOS is an interactive generative biology laboratory that simulates natural selection, genetic drift, and procedural morphogenesis in pure monochrome space. 

By selecting mathematical forms, you act as the evolutionary filter—guiding the genetic trajectory of procedural organisms across generations.

---

## ── CONCEPT & MATHEMATICAL FOUNDATION

Every organism in MORPHOS is defined by a mathematical **Genome** containing 15 continuous and discrete genes governing geometry, symmetry, recursive depth, harmonic distortion, and decay rates.

### 1. The Basal Polar Manifold

The core structural manifold is calculated via a polar deformation equation combined with logarithmic spiral growth:

$$r(\theta) = R \cdot \left[1 + A \cdot \sin(n\theta + \phi) + B \cdot \sin(m\theta^2 + \psi)\right] \cdot e^{\frac{k\theta}{2\pi}}$$

* Where **$n$** represents radial symmetry folds ($2 \le n \le 12$).
* **$m$** introduces an irrational golden ratio multiplier ($m \approx 1.6180339887$) for controlled structural asymmetry.
* **$k$** controls logarithmic spiral dispersion.

### 2. Recursive Branching & Harmonic Decay

From every nodal point along the basal manifold, sub-branches recursively divide down to depth $d$. Each level applies scale decay ($\gamma$), angular offsets ($\Delta \theta$), and high-frequency sinusoidal noise.

---

## ── GENETIC ENGINE & REPRODUCTION

MORPHOS uses a **deterministic genetic algorithm** to pass traits from parent organisms to offspring.

* **Seeded PRNG**: Utilizes `mulberry32` pseudo-random number generation for 100% reproducible breeding runs.
* **Gaussian Mutation**: Uses the Box-Muller transform to calculate standard normal distribution ($\sigma = 0.15$) trait mutations.
* **Uniform & Blend Crossover**: Blends gene values from selected parent pairs during recombination.

$$\text{Child Gene} = \alpha \cdot \text{Parent}_A + (1 - \alpha) \cdot \text{Parent}_B \quad (\text{where } 0.25 \le \alpha \le 0.75)$$

---

## ── ARCHITECTURE & RENDERING PIPELINE

To render hundreds of complex recursive fractal branches at 60 FPS without UI jank, MORPHOS implements an advanced geometry engine:

```
[ Genome Parameters ]
         │
         ▼
[ Geometry Cache Engine (LRU) ]
         │ (Generates & Stores Polyline Coordinates Once)
         ▼
[ Canvas 2D Matrix Engine ] ──► Continuous 60 FPS Rotation & Pulse
         │
         ▼
[ Hard Segment Limiter ] ──► Halts Recursion at Budget Cap (1,200–2,200 Segments)
```

1. **LRU Geometry Caching**: Separates fractal coordinate calculations from canvas rendering. Coordinates are generated once per genome and cached.
2. **Matrix Transforms**: Continuous animations use 2D canvas context transformations (`ctx.rotate()`, `ctx.scale()`) on pre-calculated polylines.
3. **Budget Cap**: A hard budget limit prevents pathological high-symmetry genomes from exceeding maximum screen segment thresholds.

---

## ── MONOCHROME VISUAL LANGUAGE

* **Canvas**: Pure Obsidian Black (`#000000`).
* **Geometry**: High-contrast Luminescent White (`#FFFFFF`) with variable line weights ($0.5\text{px} - 2.0\text{px}$) and opacity layers.
* **Typography**: Clean, restrained monospace & display pairing (`Plus Jakarta Sans` & `Playfair Display`).
* **Web Audio Synthesis**: Custom sine-wave oscillator audio cues triggering on interaction and evolution pulses.

---
