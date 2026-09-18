import React from 'react';
import { Genome } from '../types/genome';
import { OrganismCanvas } from './OrganismCanvas';
import { X } from 'lucide-react';

interface FormDetailsModalProps {
  form: Genome | null;
  formIndex: number;
  onClose: () => void;
}

export const FormDetailsModal: React.FC<FormDetailsModalProps> = ({
  form,
  formIndex,
  onClose,
}) => {
  if (!form) return null;

  const formNumStr = (formIndex + 1).toString().padStart(2, '0');
  const parentText = form.parentIds[0]
    ? `${form.parentIds[0].slice(0, 7)} × ${form.parentIds[1]?.slice(0, 7) || ''}`
    : 'FOUNDING WILD-TYPE';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-none flex items-center justify-center p-6 font-mono text-white select-none animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-black border border-white/20 p-8 flex flex-col gap-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="font-display text-sm tracking-[0.25em] uppercase text-white">
            FORM {formNumStr}
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Preview */}
        <div className="w-full aspect-square max-w-[240px] mx-auto bg-black flex items-center justify-center p-2">
          <OrganismCanvas
            genome={form}
            width={240}
            height={240}
            animate={true}
            options={{
              brightnessMultiplier: 1.25,
              visibleCount: 1,
            }}
          />
        </div>

        {/* Mathematical Parameters Grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs border-t border-b border-white/10 py-5 text-white/70">
          <div className="flex justify-between tracking-widest">
            <span className="text-white/40">GENERATION</span>
            <span className="text-white">{form.generation.toString().padStart(2, '0')}</span>
          </div>
          <div className="flex justify-between tracking-widest">
            <span className="text-white/40">SYMMETRY</span>
            <span className="text-white">{form.symmetry}</span>
          </div>
          <div className="flex justify-between tracking-widest">
            <span className="text-white/40">BRANCHES</span>
            <span className="text-white">{form.branches}</span>
          </div>
          <div className="flex justify-between tracking-widest">
            <span className="text-white/40">DEPTH</span>
            <span className="text-white">{form.recursionDepth}</span>
          </div>
          <div className="flex justify-between tracking-widest">
            <span className="text-white/40">CURVATURE</span>
            <span className="text-white">{form.curvature.toFixed(2)}</span>
          </div>
          <div className="flex justify-between tracking-widest">
            <span className="text-white/40">HARMONIC</span>
            <span className="text-white">{form.harmonicFrequency.toFixed(1)}</span>
          </div>
          <div className="col-span-2 flex justify-between tracking-widest border-t border-white/5 pt-2">
            <span className="text-white/40">LINEAGE</span>
            <span className="text-white text-[11px] font-mono">{parentText}</span>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="font-display text-xs tracking-[0.2em] text-white hover:text-white/70 border border-white/20 hover:border-white/60 px-5 py-2 transition-colors uppercase cursor-pointer"
          >
            CLOSE
          </button>
        </div>

      </div>
    </div>
  );
};
