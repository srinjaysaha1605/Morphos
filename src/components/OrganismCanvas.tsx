import React, { useRef, useEffect } from 'react';
import { Genome } from '../types/genome';
import { renderOrganismCanvas, RenderOptions } from '../utils/renderer';

interface OrganismCanvasProps {
  genome: Genome;
  width?: number;
  height?: number;
  animate?: boolean;
  options?: RenderOptions;
  className?: string;
  onClick?: () => void;
}

export const OrganismCanvas: React.FC<OrganismCanvasProps> = ({
  genome,
  width = 280,
  height = 280,
  animate = true,
  options = {},
  className = '',
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPR device displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let animationFrameId: number;
    let startTime = performance.now();

    const render = (time: number) => {
      const elapsed = animate ? time - startTime : 0;
      renderOrganismCanvas(ctx, width, height, genome, {
        time: elapsed,
        ...options,
      });

      if (animate) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render(performance.now());

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [genome, width, height, animate, JSON.stringify(options)]);

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ width: '100%', height: '100%', aspectRatio: `${width}/${height}` }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          background: '#000000',
        }}
      />
    </div>
  );
};
