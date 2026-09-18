export interface Genome {
  id: string;
  generation: number;
  parentIds: [string | null, string | null];

  // Primary Mathematical Parameters
  symmetry: number;           // 2 to 12 radial folding axes
  branches: number;           // 2 to 6 children per branch
  recursionDepth: number;     // 3 to 6 levels of recursion

  branchAngle: number;        // 0 to 2PI base angle
  branchAngleDelta: number;   // -PI/2 to PI/2 divergence

  scaleDecay: number;         // 0.5 to 0.85 length decay factor

  curvature: number;          // 0 to 1 bending coefficient
  harmonicFrequency: number;  // 0.5 to 6 wave oscillations along length
  harmonicAmplitude: number;  // 0 to 1 deformation strength

  coreRadius: number;         // Central nucleus radius (0 to 20)
  lineWeight: number;         // 0.5 to 2.5 stroke thickness
  opacity: number;            // 0.2 to 0.95 alpha intensity

  noiseSeed: number;          // Integer PRNG seed & phase offset
}

export type CrossoverStrategy = 'uniform' | 'blend' | 'singlePoint';

export interface EvolutionSettings {
  populationSize: number;
  mutationRate: number;
  mutationVariance: number;
  crossoverStrategy: CrossoverStrategy;
}

export interface LineageRecord {
  generation: number;
  genomes: Genome[];
  selectedIds: string[];
  timestamp: number;
}
