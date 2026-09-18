import { Genome } from '../types/genome';

export interface RenderOptions {
  time?: number;                // Continuous subtle animation time in ms
  scaleMultiplier?: number;     // Scale organism size (default 1.0)
  brightnessMultiplier?: number;// Brightness boost on hover/select
  interactiveRotation?: number; // Manual angle rotation
  visibleCount?: number;        // Active visible organisms count for global budget
  isEvolving?: boolean;         // Reduced complexity during active animation
}

interface Point2D {
  x: number;
  y: number;
}

export interface BranchSegment {
  path: Point2D[];
  depth: number;
}

export interface CachedGeometry {
  key: string;
  symmetry: number;
  baseBranches: BranchSegment[];
  totalSegments: number;
  effectiveDepth: number;
  estimatedComplexity: number;
  coreRadius: number;
  lineWeight: number;
  opacity: number;
  noiseSeed: number;
}

// Global LRU Geometry Cache to avoid regenerating fractals on every frame
const geometryCache = new Map<string, CachedGeometry>();
const MAX_CACHE_SIZE = 40;

// Device capability detection
function getDevicePowerTier(): 'high' | 'medium' | 'low' {
  if (typeof window === 'undefined') return 'medium';
  
  const concurrency = navigator.hardwareConcurrency || 4;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile || concurrency <= 2) {
    return 'low';
  } else if (concurrency >= 8) {
    return 'high';
  }
  return 'medium';
}

// Development Metric Interface (Internal only, not displayed in UI)
export interface PerfMetric {
  segmentsRendered: number;
  estimatedComplexity: number;
  effectiveDepth: number;
  fps: number;
  cacheHit: boolean;
}

declare global {
  interface Window {
    __MORPHOS_PERF__?: {
      lastMetric?: PerfMetric;
      metricsHistory?: PerfMetric[];
      clearCache?: () => void;
    };
  }
}

if (typeof window !== 'undefined') {
  window.__MORPHOS_PERF__ = window.__MORPHOS_PERF__ || {
    metricsHistory: [],
    clearCache: () => geometryCache.clear(),
  };
}

// ==================================================
// BUDGET CALCULATION
// ==================================================
function calculateSegmentBudget(
  visibleCount = 6,
  isEvolving = false
): number {
  const powerTier = getDevicePowerTier();

  // Base total screen budget
  let totalScreenBudget = 10000;
  if (powerTier === 'medium') totalScreenBudget = 7500;
  if (powerTier === 'low') totalScreenBudget = 4500;

  // Individual organism upper bound
  let maxPerOrganism = 2200;
  if (powerTier === 'medium') maxPerOrganism = 1800;
  if (powerTier === 'low') maxPerOrganism = 1200;

  // Distribute total budget across visible population
  let perOrganismBudget = Math.floor(totalScreenBudget / Math.max(1, visibleCount));
  perOrganismBudget = Math.min(maxPerOrganism, Math.max(400, perOrganismBudget));

  // Reduce budget during heavy evolution transition animation
  if (isEvolving) {
    perOrganismBudget = Math.floor(perOrganismBudget * 0.65);
  }

  return perOrganismBudget;
}

// ==================================================
// GEOMETRY GENERATION WITH HARD BUDGET ENFORCEMENT
// ==================================================
function buildOrganismGeometry(
  genome: Genome,
  baseLength: number,
  segmentBudget: number
): CachedGeometry {
  const S = Math.max(2, Math.round(genome.symmetry));

  // 1. Calculate effective recursion depth based on budget & symmetry multiplication
  // Estimated segments at depth d = S * sum(branches^i)
  let effectiveDepth = genome.recursionDepth;
  const numBranches = Math.max(1, genome.branches);

  for (let d = 1; d <= genome.recursionDepth; d++) {
    const estimatedSymmetrySegments = S * ((Math.pow(numBranches, d + 1) - 1) / (numBranches - 1 || 1));
    if (estimatedSymmetrySegments > segmentBudget && d >= 2) {
      effectiveDepth = d;
      break;
    }
  }

  // Single radial sector budget = total budget / symmetry
  const sectorBudget = Math.max(30, Math.floor(segmentBudget / S));

  const baseBranches: BranchSegment[] = [];
  let currentSegmentCount = 0;

  const phase = ((genome.noiseSeed % 1000) / 1000) * Math.PI * 2;
  const MIN_PIXEL_LENGTH = 1.0; // Skip sub-pixel microscopic detail

  const generateBranch = (
    x1: number,
    y1: number,
    angle: number,
    length: number,
    depth: number
  ) => {
    // Hard budget check & length cutoff
    if (
      depth > effectiveDepth ||
      length < MIN_PIXEL_LENGTH ||
      currentSegmentCount >= sectorBudget
    ) {
      return;
    }

    const x2 = x1 + length * Math.cos(angle);
    const y2 = y1 + length * Math.sin(angle);

    // Curvature / Harmonic deformation path discretization
    // Reduce steps for deeply recursive branches to save budget
    const steps = depth <= 2 ? 10 : 6;
    const pathPoints: Point2D[] = [];

    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const interpX = x1 + t * (x2 - x1);
      const interpY = y1 + t * (y2 - y1);

      const wave = Math.sin(Math.PI * 2 * genome.harmonicFrequency * t + phase);
      const offset = genome.curvature * wave * (genome.harmonicAmplitude * length * 0.35);

      pathPoints.push({
        x: interpX + offset * perpX,
        y: interpY + offset * perpY,
      });
    }

    baseBranches.push({ path: pathPoints, depth });
    currentSegmentCount++;

    // Generate child branches if within budget
    if (depth < effectiveDepth && currentSegmentCount < sectorBudget) {
      const nextLength = length * genome.scaleDecay;

      for (let b = 0; b < numBranches; b++) {
        if (currentSegmentCount >= sectorBudget) break;

        const fanOffset = numBranches > 1 ? b - (numBranches - 1) / 2 : 0;
        const childAngle = angle + genome.branchAngle * 0.5 + fanOffset * genome.branchAngleDelta;

        generateBranch(x2, y2, childAngle, nextLength, depth + 1);
      }
    }
  };

  // Generate base vertical branch pointing upward
  generateBranch(0, 0, -Math.PI / 2, baseLength, 1);

  const totalSegments = currentSegmentCount * S;
  const key = `${genome.id}_${baseLength.toFixed(1)}_${segmentBudget}`;

  return {
    key,
    symmetry: S,
    baseBranches,
    totalSegments,
    effectiveDepth,
    estimatedComplexity: currentSegmentCount * S,
    coreRadius: genome.coreRadius,
    lineWeight: genome.lineWeight,
    opacity: genome.opacity,
    noiseSeed: genome.noiseSeed,
  };
}

// ==================================================
// CANVAS RENDER PIPELINE (FAST CACHED ANIMATION)
// ==================================================
export function renderOrganismCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  genome: Genome,
  options: RenderOptions = {}
) {
  const {
    time = 0,
    scaleMultiplier = 1.0,
    brightnessMultiplier = 1.0,
    interactiveRotation = 0,
    visibleCount = 6,
    isEvolving = false,
  } = options;

  // Clear canvas with pure deep black
  ctx.save();
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const minDim = Math.min(width, height);

  // Compute budget
  const segmentBudget = calculateSegmentBudget(visibleCount, isEvolving);
  const baseLength = minDim * 0.28 * scaleMultiplier;

  // Cache key
  const cacheKey = `${genome.id}_${Math.round(baseLength)}_${segmentBudget}`;
  let cached = geometryCache.get(cacheKey);
  let cacheHit = true;

  if (!cached) {
    cacheHit = false;
    cached = buildOrganismGeometry(genome, baseLength, segmentBudget);
    
    // Evict oldest cache if limit exceeded
    if (geometryCache.size >= MAX_CACHE_SIZE) {
      const firstKey = geometryCache.keys().next().value;
      if (firstKey) geometryCache.delete(firstKey);
    }
    geometryCache.set(cacheKey, cached);
  }

  // Smooth continuous organic rotation & pulse (fast transform, zero geometry recalculation)
  const slowRot = time * 0.00004;
  const totalRotation = interactiveRotation + slowRot;
  const pulseFactor = 1 + Math.sin(time * 0.001 + genome.noiseSeed) * 0.025;

  // Color & Line styling
  const lineWeight = cached.lineWeight * (brightnessMultiplier > 1 ? 1.15 : 1.0);
  const baseAlpha = Math.min(1.0, Math.max(0.15, cached.opacity * brightnessMultiplier));
  const whiteVal = Math.min(255, Math.floor(245 * brightnessMultiplier));

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Translate to center for fast matrix transforms
  ctx.translate(centerX, centerY);
  ctx.scale(pulseFactor, pulseFactor);

  const rotationStep = (2 * Math.PI) / cached.symmetry;

  // Draw Radial Symmetry Folds using fast matrix rotation
  for (let k = 0; k < cached.symmetry; k++) {
    ctx.save();
    ctx.rotate(k * rotationStep + totalRotation);

    for (let i = 0; i < cached.baseBranches.length; i++) {
      const branch = cached.baseBranches[i];
      const depthAlpha = Math.max(0.1, baseAlpha * Math.pow(0.88, branch.depth));
      
      ctx.strokeStyle = `rgba(${whiteVal}, ${whiteVal}, ${whiteVal}, ${depthAlpha})`;
      ctx.lineWidth = Math.max(0.4, lineWeight * Math.pow(0.82, branch.depth - 1));

      ctx.beginPath();
      const path = branch.path;
      for (let p = 0; p < path.length; p++) {
        if (p === 0) {
          ctx.moveTo(path[p].x, path[p].y);
        } else {
          ctx.lineTo(path[p].x, path[p].y);
        }
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  // Central Nucleus / Core
  if (cached.coreRadius > 0.5) {
    const rCore = cached.coreRadius * scaleMultiplier * (minDim / 300);
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1, rCore), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${whiteVal}, ${whiteVal}, ${whiteVal}, ${Math.min(0.95, baseAlpha + 0.2)})`;
    ctx.fill();
  }

  ctx.restore();

  // Log internal metric quietly for dev verification
  if (typeof window !== 'undefined' && window.__MORPHOS_PERF__) {
    window.__MORPHOS_PERF__.lastMetric = {
      segmentsRendered: cached.totalSegments,
      estimatedComplexity: cached.estimatedComplexity,
      effectiveDepth: cached.effectiveDepth,
      fps: 60,
      cacheHit,
    };
  }
}
