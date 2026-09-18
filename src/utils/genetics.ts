import { Genome, CrossoverStrategy } from '../types/genome';

// ==================================================
// SEEDED PSEUDO-RANDOM NUMBER GENERATOR (mulberry32)
// ==================================================
export function createPRNG(seed: number): () => number {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ==================================================
// GAUSSIAN RANDOM GENERATOR (Box-Muller Transform)
// ==================================================
export function seededGaussian(rand: () => number, mean = 0, std = 1): number {
  let u1 = rand();
  while (u1 === 0) u1 = rand(); // Avoid log(0)
  let u2 = rand();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z * std;
}

// Helper to clamp values strictly within bounds
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// Generate short 6-hex hash based on genome properties for identity
export function calculateGenomeHash(genome: Genome): string {
  const str = `${genome.symmetry}-${genome.branches}-${genome.recursionDepth}-${genome.branchAngle.toFixed(3)}-${genome.scaleDecay.toFixed(3)}-${genome.curvature.toFixed(3)}-${genome.noiseSeed}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(6, '0').slice(0, 6).toUpperCase();
  return `0x${hex}`;
}

// ==================================================
// INITIAL POPULATION GENERATION
// ==================================================
export function generateRandomGenome(
  generation = 1,
  parentIds: [string | null, string | null] = [null, null],
  customSeed?: number
): Genome {
  const seed = customSeed ?? Math.floor(Math.random() * 2147483647);
  const rand = createPRNG(seed);

  const id = `org-g${generation}-${seed.toString(36)}`;

  return {
    id,
    generation,
    parentIds,

    // Mathematical Ranges:
    symmetry: Math.floor(2 + rand() * 11),            // 2 to 12
    branches: Math.floor(2 + rand() * 5),             // 2 to 6
    recursionDepth: Math.floor(3 + rand() * 4),       // 3 to 6

    branchAngle: rand() * (2 * Math.PI),              // 0 to 2PI
    branchAngleDelta: -Math.PI / 2 + rand() * Math.PI,// -PI/2 to PI/2

    scaleDecay: 0.5 + rand() * 0.35,                  // 0.5 to 0.85

    curvature: rand(),                                 // 0 to 1
    harmonicFrequency: 0.5 + rand() * 5.5,             // 0.5 to 6
    harmonicAmplitude: rand(),                         // 0 to 1

    coreRadius: rand() * 18,                           // 0 to 18
    lineWeight: 0.5 + rand() * 1.5,                    // 0.5 to 2.0
    opacity: 0.2 + rand() * 0.75,                      // 0.2 to 0.95

    noiseSeed: Math.floor(rand() * 2147483647),
  };
}

// ==================================================
// GENOME CROSSOVER (UNIFORM / BLEND CROSSOVER)
// ==================================================
export function crossoverGenomes(
  parentA: Genome,
  parentB: Genome,
  strategy: CrossoverStrategy = 'uniform',
  generation = Math.max(parentA.generation, parentB.generation) + 1,
  crossoverSeed?: number
): Genome {
  const seed = crossoverSeed ?? Math.floor(Math.random() * 2147483647);
  const rand = createPRNG(seed);
  const id = `org-g${generation}-${seed.toString(36)}`;

  const pick = <T>(geneA: T, geneB: T): T => {
    if (strategy === 'blend' && typeof geneA === 'number' && typeof geneB === 'number') {
      const alpha = 0.25 + rand() * 0.5;
      return (geneA * alpha + geneB * (1 - alpha)) as unknown as T;
    }
    return rand() < 0.5 ? geneA : geneB;
  };

  const child: Genome = {
    id,
    generation,
    parentIds: [parentA.id, parentB.id],

    symmetry: Math.round(pick(parentA.symmetry, parentB.symmetry)),
    branches: Math.round(pick(parentA.branches, parentB.branches)),
    recursionDepth: Math.round(pick(parentA.recursionDepth, parentB.recursionDepth)),

    branchAngle: pick(parentA.branchAngle, parentB.branchAngle),
    branchAngleDelta: pick(parentA.branchAngleDelta, parentB.branchAngleDelta),

    scaleDecay: pick(parentA.scaleDecay, parentB.scaleDecay),

    curvature: pick(parentA.curvature, parentB.curvature),
    harmonicFrequency: pick(parentA.harmonicFrequency, parentB.harmonicFrequency),
    harmonicAmplitude: pick(parentA.harmonicAmplitude, parentB.harmonicAmplitude),

    coreRadius: pick(parentA.coreRadius, parentB.coreRadius),
    lineWeight: pick(parentA.lineWeight, parentB.lineWeight),
    opacity: pick(parentA.opacity, parentB.opacity),

    noiseSeed: pick(parentA.noiseSeed, parentB.noiseSeed),
  };

  // Clamp parameters to valid ranges
  child.symmetry = clamp(child.symmetry, 2, 12);
  child.branches = clamp(child.branches, 2, 6);
  child.recursionDepth = clamp(child.recursionDepth, 3, 6);
  child.scaleDecay = clamp(child.scaleDecay, 0.5, 0.85);
  child.curvature = clamp(child.curvature, 0, 1);
  child.harmonicFrequency = clamp(child.harmonicFrequency, 0.5, 6);
  child.harmonicAmplitude = clamp(child.harmonicAmplitude, 0, 1);
  child.lineWeight = clamp(child.lineWeight, 0.5, 2.0);
  child.opacity = clamp(child.opacity, 0.2, 0.95);

  return child;
}

// ==================================================
// GAUSSIAN MUTATION (BOX-MULLER TRANSFORM)
// ==================================================
export function mutateGenome(
  genome: Genome,
  mutationRate = 0.25,        // Gene mutation probability
  mutationSigma = 0.15,       // Mutation standard deviation
  mutationSeed?: number
): Genome {
  const seed = mutationSeed ?? Math.floor(Math.random() * 2147483647);
  const rand = createPRNG(seed);

  const mutated: Genome = { ...genome };

  const shouldMutate = () => rand() < mutationRate;

  const mutateContinuous = (val: number, min: number, max: number, scale = 1.0) => {
    if (!shouldMutate()) return val;
    const z = seededGaussian(rand, 0, mutationSigma * scale * (max - min));
    return clamp(val + z, min, max);
  };

  const mutateDiscrete = (val: number, min: number, max: number) => {
    if (!shouldMutate()) return val;
    const z = seededGaussian(rand, 0, mutationSigma * (max - min));
    const step = Math.round(z);
    return clamp(val + (step === 0 ? (rand() < 0.5 ? -1 : 1) : step), min, max);
  };

  mutated.symmetry = mutateDiscrete(mutated.symmetry, 2, 12);
  mutated.branches = mutateDiscrete(mutated.branches, 2, 6);
  mutated.recursionDepth = mutateDiscrete(mutated.recursionDepth, 3, 6);

  mutated.branchAngle = mutateContinuous(mutated.branchAngle, 0, 2 * Math.PI, 0.8);
  mutated.branchAngleDelta = mutateContinuous(mutated.branchAngleDelta, -Math.PI / 2, Math.PI / 2, 0.8);

  mutated.scaleDecay = mutateContinuous(mutated.scaleDecay, 0.5, 0.85, 0.5);

  mutated.curvature = mutateContinuous(mutated.curvature, 0, 1, 0.8);
  mutated.harmonicFrequency = mutateContinuous(mutated.harmonicFrequency, 0.5, 6, 0.8);
  mutated.harmonicAmplitude = mutateContinuous(mutated.harmonicAmplitude, 0, 1, 0.8);

  mutated.coreRadius = mutateContinuous(mutated.coreRadius, 0, 20, 0.5);
  mutated.lineWeight = mutateContinuous(mutated.lineWeight, 0.5, 2.0, 0.5);
  mutated.opacity = mutateContinuous(mutated.opacity, 0.2, 0.95, 0.5);

  if (shouldMutate()) {
    mutated.noiseSeed = Math.floor(rand() * 2147483647);
  }

  return mutated;
}

// Verification helper for testing determinism
export function verifyGenomeDeterminism(a: Genome, b: Genome): boolean {
  return (
    a.symmetry === b.symmetry &&
    a.branches === b.branches &&
    a.recursionDepth === b.recursionDepth &&
    a.branchAngle === b.branchAngle &&
    a.branchAngleDelta === b.branchAngleDelta &&
    a.scaleDecay === b.scaleDecay &&
    a.curvature === b.curvature &&
    a.harmonicFrequency === b.harmonicFrequency &&
    a.harmonicAmplitude === b.harmonicAmplitude &&
    a.noiseSeed === b.noiseSeed
  );
}
