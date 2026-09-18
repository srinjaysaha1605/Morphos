import React, { useRef, useEffect, useState } from 'react';
import { specimenAudio } from '../utils/audio';

interface LandingPageProps {
  onEnterLab: () => void;
}

interface Point2D {
  x: number;
  y: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterLab }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let startTime = performance.now();
    let transitionStartTime: number | null = null;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Render loop
    const render = (now: number) => {
      const elapsed = (now - startTime) * 0.001; // seconds

      if (isTransitioning && transitionStartTime === null) {
        transitionStartTime = now;
      }

      let transitionProgress = 0;
      if (transitionStartTime !== null) {
        transitionProgress = Math.min(1.0, (now - transitionStartTime) / 1100);
      }

      const width = window.innerWidth;
      const height = window.innerHeight;
      const minDim = Math.min(width, height);
      const centerX = width / 2;
      const centerY = height / 2;

      // Clear dark canvas
      ctx.save();
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Expansion and rotation dynamics for cinematic transition
      const expandScale = 1 + Math.pow(transitionProgress, 2.5) * 4.5;
      const baseScale = minDim * 0.22 * expandScale;
      const rotSpeed = 0.05 + transitionProgress * 1.5;
      const rotation = elapsed * rotSpeed;

      // Opacity fadeout near the end of expansion transition
      const alphaMultiplier = Math.max(0, 1 - Math.pow(transitionProgress, 3));

      // Polar base parameters
      const R = baseScale;
      const A = 0.28 + (isHovered ? 0.05 : 0);
      const B = 0.14;
      const n = 7; // Main symmetry order
      const m = 1.6180339887; // Golden ratio irrational multiplier for controlled asymmetry
      const phi = 0.4;
      const psi = 1.2;
      const k = 0.04; // Logarithmic growth

      const totalFolds = 7;
      const angleStep = (Math.PI * 2) / totalFolds;

      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);

      // 1. POLAR MANIFOLD BASAL GEOMETRY
      for (let fold = 0; fold < totalFolds; fold++) {
        ctx.save();
        ctx.rotate(fold * angleStep);

        // Sinusoidal & Logarithmic deformation function:
        // r(theta) = R * [1 + A*sin(n*theta + phi) + B*sin(m*theta^2 + psi)] * e^(k*theta / 2PI)
        const steps = 140;
        const points: Point2D[] = [];

        for (let i = 0; i <= steps; i++) {
          const theta = (i / steps) * Math.PI * 2;

          const harmonicA = A * Math.sin(n * theta + phi + elapsed * 0.4);
          const harmonicB = B * Math.sin(m * theta * theta + psi + elapsed * 0.2);
          const logSpiral = Math.exp((k * theta) / (Math.PI * 2));

          const r = R * (1 + harmonicA + harmonicB) * logSpiral;

          const x = r * Math.cos(theta);
          const y = r * Math.sin(theta);

          points.push({ x, y });
        }

        // Draw main polar logarithmic strand
        ctx.beginPath();
        ctx.strokeStyle = `rgba(245, 245, 245, ${0.75 * alphaMultiplier})`;
        ctx.lineWidth = 1.2;
        ctx.lineCap = 'round';

        for (let p = 0; p < points.length; p++) {
          if (p === 0) ctx.moveTo(points[p].x, points[p].y);
          else ctx.lineTo(points[p].x, points[p].y);
        }
        ctx.stroke();

        // 2. RECURSIVE BRANCHING FROM MANIFOLD NODE POINTS
        const nodeInterval = 14;
        for (let p = nodeInterval; p < points.length - nodeInterval; p += nodeInterval) {
          const pt = points[p];
          const tangentAngle = Math.atan2(
            points[p + 1].y - points[p - 1].y,
            points[p + 1].x - points[p - 1].x
          );

          // Recursive branch generator
          const drawSubBranch = (
            bx: number,
            by: number,
            angle: number,
            len: number,
            depth: number
          ) => {
            if (depth > 4 || len < 1.5) return;

            const endX = bx + len * Math.cos(angle);
            const endY = by + len * Math.sin(angle);

            // Sub-curve curvature
            const midX = (bx + endX) / 2 + Math.sin(depth + elapsed) * len * 0.2;
            const midY = (by + endY) / 2 + Math.cos(depth + elapsed) * len * 0.2;

            ctx.beginPath();
            const bAlpha = Math.max(0.1, (0.6 - depth * 0.1) * alphaMultiplier);
            ctx.strokeStyle = `rgba(240, 240, 240, ${bAlpha})`;
            ctx.lineWidth = Math.max(0.4, 1.2 * Math.pow(0.7, depth));

            ctx.moveTo(bx, by);
            ctx.quadraticCurveTo(midX, midY, endX, endY);
            ctx.stroke();

            // Asymmetric child angles using irrational golden ratio step
            const childAngle1 = angle + 0.42 + (depth * 0.08);
            const childAngle2 = angle - 0.38 - (depth * 0.05);

            drawSubBranch(endX, endY, childAngle1, len * 0.65, depth + 1);
            drawSubBranch(endX, endY, childAngle2, len * 0.62, depth + 1);
          };

          drawSubBranch(pt.x, pt.y, tangentAngle + Math.PI / 3, R * 0.28, 1);
          drawSubBranch(pt.x, pt.y, tangentAngle - Math.PI / 3, R * 0.24, 1);
        }

        ctx.restore();
      }

      // Central Nucleus
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1.5, R * 0.06), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * alphaMultiplier})`;
      ctx.fill();

      ctx.restore();

      if (!isTransitioning || transitionProgress < 1.0) {
        animFrameId = requestAnimationFrame(render);
      } else {
        onEnterLab();
      }
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [isHovered, isTransitioning, onEnterLab]);

  const handleClick = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    specimenAudio.init();
    specimenAudio.triggerEvolutionPulse();
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed inset-0 w-screen h-screen bg-[#000000] text-white font-mono flex flex-col justify-between items-center p-8 select-none cursor-pointer overflow-hidden z-50"
    >
      {/* Header Title */}
      <div className="pt-6 z-10 text-center animate-fadeIn">
        <h1 className="font-display text-sm sm:text-base tracking-[0.4em] font-light uppercase text-white/90">
          MORPHOS
        </h1>
      </div>

      {/* Main Procedural Structure Canvas */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full block bg-[#000000]"
        />
      </div>

      {/* Philosophical Quote */}
      <div className="pb-8 z-10 text-center animate-fadeIn">
        <p className="font-mono text-xs sm:text-sm tracking-[0.25em] text-white/60 font-light uppercase">
          “From simple rules, infinite worlds unfold.”
        </p>
      </div>
    </div>
  );
};
