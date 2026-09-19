import React, { useState, useEffect, useCallback } from 'react';
import { Genome, EvolutionSettings, LineageRecord } from './types/genome';
import {
  generateRandomGenome,
  crossoverGenomes,
  mutateGenome,
} from './utils/genetics';
import { Header } from './components/Header';
import { BottomControl } from './components/BottomControl';
import { MinimalCanvasArea } from './components/MinimalCanvasArea';
import { FormDetailsModal } from './components/FormDetailsModal';
import { LandingPage } from './components/LandingPage';
import { specimenAudio } from './utils/audio';

export default function App() {
  // Navigation View State
  const [showLanding, setShowLanding] = useState<boolean>(true);

  // Evolution & Population State
  const [generation, setGeneration] = useState<number>(1);
  const [population, setPopulation] = useState<Genome[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isEvolving, setIsEvolving] = useState(false);
  const [detailedForm, setDetailedForm] = useState<{ form: Genome; index: number } | null>(null);

  // Lineage Ancestry History Tracking
  const [lineageHistory, setLineageHistory] = useState<LineageRecord[]>([]);

  // Fixed Minimal Evolution Parameters
  const settings: EvolutionSettings = {
    populationSize: 6,
    mutationRate: 0.25,
    mutationVariance: 0.16,
    crossoverStrategy: 'uniform',
  };

  const createPopulation = (generationNumber = 1): Genome[] =>
    Array.from({ length: settings.populationSize }, () =>
      generateRandomGenome(generationNumber)
    );

  // Seed Generation 01 on mount
  useEffect(() => {
    setPopulation(createPopulation());
  }, []);

  useEffect(() => {
    const selectedGenome = population.find((genome) =>
      selectedIds.includes(genome.id)
    );

    if (selectedGenome) {
      // Background custom music is handled by the audio utility; no per-genome synth tone here.
    }
  }, [population, selectedIds]);

  // Evolve Next Generation Core Action
  const handleEvolve = useCallback(() => {
    if (population.length === 0 || isEvolving || selectedIds.length === 0) return;

    setIsEvolving(true);
    specimenAudio.triggerEvolutionPulse();

    setLineageHistory((prev) => [
      ...prev,
      {
        generation,
        genomes: population,
        selectedIds,
        timestamp: Date.now(),
      },
    ]);

    setTimeout(() => {
      const nextGen = generation + 1;
      setGeneration(nextGen);

      const selectedForms = population.filter((f) => selectedIds.includes(f.id));
      const newPop: Genome[] = [];

      for (let i = 0; i < settings.populationSize; i++) {
        let parentA: Genome;
        let parentB: Genome;

        if (selectedForms.length >= 2) {
          const idxA = Math.floor(Math.random() * selectedForms.length);
          let idxB = Math.floor(Math.random() * selectedForms.length);
          while (idxB === idxA && selectedForms.length > 1) {
            idxB = Math.floor(Math.random() * selectedForms.length);
          }
          parentA = selectedForms[idxA];
          parentB = selectedForms[idxB];
        } else {
          parentA = selectedForms[0];
          parentB = selectedForms[0];
        }

        const childCross = crossoverGenomes(parentA, parentB, settings.crossoverStrategy, nextGen);
        const childMutated = mutateGenome(childCross, settings.mutationRate, settings.mutationVariance);
        newPop.push(childMutated);
      }

      setPopulation(newPop);
      setSelectedIds([]);
    }, 900);

    setTimeout(() => {
      setIsEvolving(false);
    }, 2200);
  }, [population, selectedIds, generation, isEvolving]);

  // Toggle Selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Reset to Generation 01
  const handleReset = () => {
    setPopulation(createPopulation());
    setGeneration(1);
    setSelectedIds([]);
    setLineageHistory([]);
  };

  const handleEnterLab = () => {
    specimenAudio.setMuted(false);
    setShowLanding(false);
  };

  if (showLanding) {
    return <LandingPage onEnterLab={handleEnterLab} />;
  }

  return (
    <div className="h-screen w-screen bg-[#000000] text-white font-mono flex flex-col justify-between overflow-hidden select-none">
      <Header generation={generation} onReset={handleReset} />

      <MinimalCanvasArea
        population={population}
        selectedIds={selectedIds}
        isEvolving={isEvolving}
        onToggleSelect={handleToggleSelect}
        onShowDetails={(form, index) => setDetailedForm({ form, index })}
        onHoverIndexChange={(idx) => setHoveredIndex(idx)}
      />

      <BottomControl
        selectedCount={selectedIds.length}
        hoveredIndex={hoveredIndex}
        isEvolving={isEvolving}
        onEvolve={handleEvolve}
      />

      {detailedForm && (
        <FormDetailsModal
          form={detailedForm.form}
          formIndex={detailedForm.index}
          onClose={() => setDetailedForm(null)}
        />
      )}
    </div>
  );
}
