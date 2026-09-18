import React from 'react';

interface HeaderProps {
  generation: number;
  onReset?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ generation, onReset }) => {
  return (
    <header className="w-full px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between select-none bg-[#000000] text-white z-20 gap-2 border-b border-white/5 sm:border-none">
      {/* Left: Brand + Info + Reset */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <span className="font-display text-xs sm:text-sm tracking-[0.25em] sm:tracking-[0.3em] font-light uppercase text-white/90">
          MORPHOS
        </span>

        {/* Info Exclamation Hover / Touch Tooltip */}
        <div className="relative group flex items-center">
          <button
            type="button"
            className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-white/30 text-[10px] font-mono text-white/50 group-hover:text-white group-hover:border-white/80 focus:border-white focus:text-white transition-colors cursor-help"
            aria-label="App Info"
          >
            !
          </button>

          {/* Tooltip Popup */}
          <div className="absolute top-full left-0 mt-2 w-64 sm:w-72 p-3.5 sm:p-4 bg-black border border-white/20 text-white/90 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-300 pointer-events-none z-50 font-mono text-xs shadow-2xl">
            <div className="font-display text-[10px] tracking-[0.25em] text-white uppercase mb-2">
              MORPHOS
            </div>
            <div className="text-[10px] sm:text-[11px] tracking-wider text-white/80 leading-relaxed uppercase mb-2">
              SHAPE IS SELECTED.<br />
              SELECTION CREATES THE NEXT GENERATION.
            </div>
            <div className="text-[9px] sm:text-[10px] tracking-wider text-white/40 leading-relaxed">
              Choose the forms you find interesting.<br />
              They will become the parents of the next generation.
            </div>
          </div>
        </div>

        {onReset && (
          <button
            onClick={onReset}
            className="font-mono text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] text-white/40 hover:text-white transition-colors uppercase cursor-pointer ml-1 sm:ml-3 px-1.5 py-0.5 border border-white/10 sm:border-none hover:border-white/30"
            title="RESET TO GENERATION 01"
          >
            RESET
          </button>
        )}
      </div>

      {/* Right: Generation Display with distinct spacing & responsive label */}
      <div className="font-mono text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.25em] text-white/60 shrink-0 text-right pl-2">
        <span className="hidden xs:inline sm:inline">GENERATION </span>
        <span className="xs:hidden sm:hidden">GEN </span>
        {generation.toString().padStart(2, '0')}
      </div>
    </header>
  );
};
