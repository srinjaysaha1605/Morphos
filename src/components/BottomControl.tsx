import React from 'react';

interface BottomControlProps {
  selectedCount: number;
  hoveredIndex: number | null;
  isEvolving: boolean;
  onEvolve: () => void;
}

export const BottomControl: React.FC<BottomControlProps> = ({
  selectedCount,
  hoveredIndex,
  isEvolving,
  onEvolve,
}) => {
  // Determine dynamic hint text
  let hintText = 'SELECT A FORM';
  if (hoveredIndex !== null) {
    hintText = 'CHOOSE A FORM';
  } else if (selectedCount === 1) {
    hintText = '1 FORM SELECTED';
  } else if (selectedCount > 1) {
    hintText = `${selectedCount} FORMS SELECTED`;
  }

  const canEvolve = selectedCount > 0 && !isEvolving;

  return (
    <footer className="w-full px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between select-none bg-[#000000] text-white/90 z-20 font-mono text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] border-t border-white/5 sm:border-none">
      {/* First-time Interaction Hint */}
      <div className="text-white/40 transition-opacity duration-300 truncate max-w-[50%]">
        {hintText}
      </div>

      {/* Main Evolve Action */}
      <button
        onClick={onEvolve}
        disabled={!canEvolve}
        className={`font-display text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.25em] uppercase transition-all duration-300 ${
          canEvolve
            ? 'text-white opacity-100 cursor-pointer hover:text-white/70 active:text-white/40'
            : 'text-white/30 opacity-30 cursor-not-allowed'
        }`}
      >
        {isEvolving ? 'EVOLVING...' : 'EVOLVE →'}
      </button>
    </footer>
  );
};
