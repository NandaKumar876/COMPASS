import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Weights, AllocationResult, PersonaKey, Proposal } from '../types';
import { proposals as localProposals } from '../data/proposals';
import { DEFAULT_WEIGHTS, DEFAULT_BUDGET } from '../data/objectives';
import { allocate } from '../engine/solver';
import { getProposals } from '../api/client';

export function useAllocation() {
  const [proposals, setProposals] = useState<Proposal[]>(localProposals);
  const [weights, setWeightsState] = useState<Weights>({ ...DEFAULT_WEIGHTS });
  const [budget, setBudgetState] = useState(DEFAULT_BUDGET);
  const [activePersona, setActivePersona] = useState<PersonaKey | null>(null);
  const [queryResult, setQueryResult] = useState<AllocationResult | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Load the canonical proposal set from the backend once on mount.
  // Falls back to the bundled local data if the backend is unreachable,
  // so the demo never hard-fails on a dead network.
  useEffect(() => {
    let cancelled = false;
    getProposals()
      .then((fetched) => {
        if (!cancelled && fetched.length > 0) {
          setProposals(fetched);
          setIsBackendConnected(true);
        }
      })
      .catch(() => {
        // stay on localProposals, isBackendConnected stays false
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const localResult: AllocationResult = useMemo(
    () => allocate(proposals, weights, budget),
    [proposals, weights, budget]
  );

  // A backend-driven query result (from POST /query) overrides the instant
  // local re-solve until the user moves a slider or picks a persona again.
  const result = queryResult ?? localResult;

  const applyPersona = useCallback((key: PersonaKey, personaWeights: Weights) => {
    setActivePersona(key);
    setQueryResult(null);
    setWeightsState({ ...personaWeights });
  }, []);

  const updateWeight = useCallback((key: keyof Weights, value: number) => {
    setActivePersona(null);
    setQueryResult(null);
    setWeightsState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setBudget = useCallback((value: number) => {
    setQueryResult(null);
    setBudgetState(value);
  }, []);

  const applyQueryResult = useCallback((newWeights: Weights, allocation: AllocationResult) => {
    setActivePersona(null);
    setWeightsState(newWeights);
    setQueryResult(allocation);
  }, []);

  return {
    weights,
    setWeights: updateWeight,
    budget,
    setBudget,
    result,
    activePersona,
    applyPersona,
    applyQueryResult,
    proposals,
    isBackendConnected,
  };
}
