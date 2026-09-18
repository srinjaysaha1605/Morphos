import React, { useState, useEffect } from 'react';
import { Genome } from '../types/genome';
import { OrganismCanvas } from './OrganismCanvas';

interface MinimalCanvasAreaProps {
  population: Genome[];
  generation: number;
  selectedIds: string[];
  isEvolving: boolean;
  hasEverSelected?: boolean;
  onToggleSelect: (id: string) => void;
  onShowDetails: (form: Genome, index: number) => void;
  onHoverIndexChange: (index: number | null) => void;
}

export const MinimalCanvasArea: React.FC<MinimalCanvasAreaProps> = ({
  population,
  generation,
  selectedIds,
  isEvolving,
  onToggleSelect,
  onShowDetails,
  onHoverIndexChange,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isFirstFragmenting, setIsFirstFragmenting] = useState(true);

  // Responsive mobile state tracking
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Animation phase for smooth evolution sequence
  const [animPhase, setAnimPhase] = useState<
    'idle' | 'fading' | 'converging' | 'transforming' | 'emerging' | 'settling'
  >('idle');

  // Trigger fragment animation on first load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFirstFragmenting(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Sync evolution stages with state
  useEffect(() => {
    if (isEvolving) {
      setAnimPhase('fading');
      const t1 = setTimeout(() => setAnimPhase('converging'), 400);
      const t2 = setTimeout(() => setAnimPhase('transforming'), 900);
      const t3 = setTimeout(() => setAnimPhase('emerging'), 1400);
      const t4 = setTimeout(() => setAnimPhase('settling'), 1800);
      const t5 = setTimeout(() => setAnimPhase('idle'), 2200);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(t5);
      };
    } else {
      setAnimPhase('idle');
    }
  }, [isEvolving]);

  const handleMouseEnter = (idx: number) => {
    setHoveredIdx(idx);
    onHoverIndexChange(idx);
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
    onHoverIndexChange(null);
  };

  return (
    <div className="flex-1 w-full bg-[#000000] relative overflow-hidden flex items-center justify-center p-3 sm:p-12 select-none">
      
      {/* Floating Organisms Spatial Container */}
      <div className="w-full h-full max-w-6xl max-h-[82vh] grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-14 md:gap-16 items-center justify-items-center my-auto z-10">
        {population.map((form, index) => {
          const isSelected = selectedIds.includes(form.id);
          const isHovered = hoveredIdx === index;
          const formNumStr = (index + 1).toString().padStart(2, '0');

          // Smooth transition transform styles for evolution phases
          let itemStyle: React.CSSProperties = {
            transition: 'all 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
          };

          if (isFirstFragmenting) {
            // Fragment from center outward on first load
            itemStyle.opacity = 0.2;
            itemStyle.transform = 'scale(0.4) translate(0px, 0px)';
          } else if (animPhase === 'fading') {
            if (!isSelected) {
              itemStyle.opacity = 0;
              itemStyle.transform = 'scale(0.5)';
            } else {
              itemStyle.opacity = 1;
              itemStyle.transform = 'scale(1.05)';
            }
          } else if (animPhase === 'converging') {
            if (!isSelected) {
              itemStyle.opacity = 0;
              itemStyle.transform = 'scale(0.1)';
            } else {
              // Selected forms converge into a tight, dense central focal point within the mobile/desktop viewport limits
              const cols = isMobile ? 2 : 3;
              const col = index % cols;
              const row = Math.floor(index / cols);

              // Responsive translation math strictly bounded for mobile & desktop frames:
              const dx = isMobile ? (0.5 - col) * 32 : (1 - col) * 110;
              const dy = isMobile ? (1 - row) * 45 : (0.5 - row) * 100;
              const scale = isMobile ? 0.32 : 0.38;

              itemStyle.opacity = 1;
              itemStyle.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
            }
          } else if (animPhase === 'transforming') {
            itemStyle.opacity = 0.85;
            itemStyle.transform = 'scale(0.75)';
          } else if (animPhase === 'emerging') {
            itemStyle.opacity = 0.95;
            itemStyle.transform = 'scale(1.05)';
          } else if (animPhase === 'settling') {
            itemStyle.opacity = 1;
            itemStyle.transform = 'scale(1)';
          } else {
            // Idle state
            itemStyle.opacity = selectedIds.length === 0 ? (isHovered ? 1 : 0.8) : isSelected ? 1 : isHovered ? 0.85 : 0.3;
            itemStyle.transform = isHovered || isSelected ? 'scale(1.08)' : 'scale(1)';
          }

          return (
            <div
              key={form.id}
              style={itemStyle}
              onClick={() => onToggleSelect(form.id)}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              className="group relative cursor-pointer flex flex-col items-center justify-center w-full max-w-[260px] aspect-square"
            >
              {/* Top Form Identifier Label (Visible on hover or when selected) */}
              <div
                className={`absolute -top-3 font-mono text-[10px] tracking-[0.2em] transition-opacity duration-300 ${
                  isHovered || isSelected ? 'opacity-100 text-white/80' : 'opacity-0 text-white/20'
                }`}
              >
                FORM {formNumStr}
              </div>

              {/* Seamless Canvas Specimen */}
              <div className="w-full h-full flex items-center justify-center p-1">
                <OrganismCanvas
                  genome={form}
                  width={260}
                  height={260}
                  animate={true}
                  options={{
                    brightnessMultiplier: isSelected ? 1.6 : isHovered ? 1.35 : 1.0,
                    scaleMultiplier: isSelected ? 1.05 : 0.95,
                    visibleCount: population.length,
                    isEvolving,
                  }}
                />
              </div>

              {/* Bottom Interaction Label */}
              <div
                className={`absolute -bottom-3 font-mono text-[9px] tracking-[0.2em] transition-opacity duration-300 flex items-center gap-3 ${
                  isHovered || isSelected ? 'opacity-100 text-white/70' : 'opacity-0 text-white/20'
                }`}
              >
                <span>{isSelected ? 'SELECTED' : 'SELECT'}</span>

                {/* Details Trigger */}
                {isHovered && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowDetails(form, index);
                    }}
                    className="hover:text-white text-white/40 transition-colors uppercase cursor-pointer"
                  >
                    DETAILS
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
