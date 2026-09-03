import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Weights, AllocationResult, PersonaKey, Proposal } from '../types';
import { proposals as seedProposals } from '../data/proposals';
import { DEFAULT_WEIGHTS, DEFAULT_BUDGET } from '../data/objectives';
import { allocate as clientSolver } from '../engine/solver';
import { api } from '../api/client';

export function useAllocation() {
  const [proposals, setProposals] = useState<Proposal[]>(seedProposals);
  const [weights, setWeights] = useState<Weights>({ ...DEFAULT_WEIGHTS });
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [activePersona, setActivePersona] = useState<PersonaKey | null>(null);
  const [serverResult, setServerResult] = useState<AllocationResult | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load proposals from FastAPI on mount
  useEffect(() => {
    let isMounted = true;
    api
      .getProposals()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setProposals(data);
          setIsBackendConnected(true);
        }
      })
      .catch(() => {
        // Fallback silently to client seed proposals
        if (isMounted) setIsBackendConnected(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute immediate client result for 0ms slider latency
  const localResult: AllocationResult = useMemo(
    () => clientSolver(proposals, weights, budget),
    [proposals, weights, budget]
  );

  // Debounced live sync to FastAPI backend /allocate endpoint
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeout = setTimeout(() => {
      api
        .allocate(weights, budget)
        .then((res) => {
          if (!controller.signal.aborted) {
            setServerResult(res);
            setIsBackendConnected(true);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setIsBackendConnected(false);
          }
        });
    }, 80);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [weights, budget]);

  const applyPersona = useCallback((key: PersonaKey, personaWeights: Weights) => {
    setActivePersona(key);
    setWeights({ ...personaWeights });
  }, []);

  const updateWeight = useCallback((key: keyof Weights, value: number) => {
    setActivePersona(null);
    setWeights((prev) => ({ ...prev, [key]: value }));
  }, []);

  const result = serverResult || localResult;

  return {
    weights,
    setWeights: updateWeight,
    setFullWeights: setWeights,
    budget,
    setBudget,
    result,
    activePersona,
    applyPersona,
    proposals,
    isBackendConnected,
  };
}
