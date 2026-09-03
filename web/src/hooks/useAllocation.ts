import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Weights, AllocationResult, PersonaKey } from '../types';
import { proposals } from '../data/proposals';
import { DEFAULT_WEIGHTS, DEFAULT_BUDGET } from '../data/objectives';
import { allocate } from '../engine/solver';

export function useAllocation() {
  const [weights, setWeights] = useState<Weights>({ ...DEFAULT_WEIGHTS });
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [activePersona, setActivePersona] = useState<PersonaKey | null>(null);

  const result: AllocationResult = useMemo(
    () => allocate(proposals, weights, budget),
    [weights, budget]
  );

  const applyPersona = useCallback((key: PersonaKey, personaWeights: Weights) => {
    setActivePersona(key);
    setWeights({ ...personaWeights });
  }, []);

  const updateWeight = useCallback((key: keyof Weights, value: number) => {
    setActivePersona(null);
    setWeights((prev) => ({ ...prev, [key]: value }));
  }, []);

  return {
    weights,
    setWeights: updateWeight,
    budget,
    setBudget,
    result,
    activePersona,
    applyPersona,
    proposals,
  };
}
