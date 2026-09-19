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
  const [hasEverSelected, setHasEverSelected] = useState<boolean>(false);
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

  // Seed Generation 01 on mount
  useEffect(() => {
    const initialPop: Genome[] = [];
    for (let i = 0; i < settings.populationSize; i++) {
      initialPop.push(generateRandomGenome(1));
    }
    setPopulation(initialPop);
  }, []);

  useEffect(() => {
    const selectedGenome = population.find((genome) =>
      selectedIds.includes(genome.id)
    );

    if (selectedGenome) {
      specimenAudio.updateSpecimenTone(selectedGenome);
    }
  }, [population, selectedIds]);

  // Evolve Next Generation Core Action
  const handleEvolve = useCallback(() => {
    if (population.length === 0 || isEvolving || selectedIds.length === 0) return;

    setIsEvolving(true);
    specimenAudio.triggerEvolutionPulse();

    // Record lineage history of current generation before evolving
    setLineageHistory((prev) => [
      ...prev,
      {
        generation,
        genomes: population,
        selectedIds,
        timestamp: Date.now(),
      },
    ]);

    // Sync actual genome creation with spatial convergence animation
    setTimeout(() => {
      const nextGen = generation + 1;
      setGeneration(nextGen);

      const selectedForms = population.filter((f) => selectedIds.includes(f.id));

      // Generate new offspring population mathematically descended from selected pool
      const newPop: Genome[] = [];
      for (let i = 0; i < settings.populationSize; i++) {
        let parentA: Genome;
        let parentB: Genome;

        if (selectedForms.length >= 2) {
          // Select two parents from the user-selected pool
          const idxA = Math.floor(Math.random() * selectedForms.length);
          let idxB = Math.floor(Math.random() * selectedForms.length);
          while (idxB === idxA && selectedForms.length > 1) {
            idxB = Math.floor(Math.random() * selectedForms.length);
          }
          parentA = selectedForms[idxA];
          parentB = selectedForms[idxB];
        } else {
          // Self-breeding with mutation when 1 form is selected
          parentA = selectedForms[0];
          parentB = selectedForms[0];
        }

        // Real uniform crossover & Gaussian mutation
        const childCross = crossoverGenomes(parentA, parentB, settings.crossoverStrategy, nextGen);
        const childMutated = mutateGenome(childCross, settings.mutationRate, settings.mutationVariance);
        newPop.push(childMutated);
      }

      setPopulation(newPop);
      setSelectedIds([]);
    }, 900);

    // Complete evolving state after full animation cycle
    setTimeout(() => {
      setIsEvolving(false);
    }, 2200);
  }, [population, selectedIds, generation, isEvolving]);

  // Toggle Selection
  const handleToggleSelect = (id: string) => {
    setHasEverSelected(true);
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
    const freshPop: Genome[] = [];
    for (let i = 0; i < settings.populationSize; i++) {
      freshPop.push(generateRandomGenome(1));
    }
    setPopulation(freshPop);
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
      
      {/* Quiet Header */}
      <Header
        generation={generation}
        onReset={handleReset}
      />

      {/* Main Canvas Area */}
      <MinimalCanvasArea
        population={population}
        generation={generation}
        selectedIds={selectedIds}
        isEvolving={isEvolving}
        hasEverSelected={hasEverSelected}
        onToggleSelect={handleToggleSelect}
        onShowDetails={(form, index) => setDetailedForm({ form, index })}
        onHoverIndexChange={(idx) => setHoveredIndex(idx)}
      />

      {/* Quiet Bottom Control Bar */}
      <BottomControl
        selectedCount={selectedIds.length}
        hoveredIndex={hoveredIndex}
        isEvolving={isEvolving}
        onEvolve={handleEvolve}
      />

      {/* Optional Details Modal */}
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
