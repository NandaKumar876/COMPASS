import type { Weights, AllocationResult, Proposal, ExplainResult } from '../types';

const API_BASE = 'http://localhost:8000';

export interface Constraints {
  region?: string | null;
  sector?: string | null;
  min_beneficiaries?: number | null;
}

export const api = {
  async getProposals(): Promise<Proposal[]> {
    const res = await fetch(`${API_BASE}/proposals`);
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    return res.json();
  },

  async allocate(
    weights: Weights,
    budget: number,
    constraints: Constraints = {}
  ): Promise<AllocationResult> {
    const res = await fetch(`${API_BASE}/allocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weights, budget, constraints }),
    });
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    return res.json();
  },

  async explain(
    projectId: string,
    weights: Weights,
    budget: number,
    allocationState: { funded: string[]; spent: number }
  ): Promise<ExplainResult> {
    const res = await fetch(`${API_BASE}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        weights,
        budget,
        allocation_state: allocationState,
      }),
    });
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    return res.json();
  },

  async query(text: string): Promise<{
    parsed_weights: Weights;
    parsed_constraints: Record<string, unknown>;
    allocation: AllocationResult;
  }> {
    const res = await fetch(`${API_BASE}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    return res.json();
  },

  async intake(formData: FormData): Promise<{ extracted: any[] }> {
    const res = await fetch(`${API_BASE}/intake`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    return res.json();
  },

  async summary(summaryData: {
    totals: { count: number; spent: number; beneficiaries: number; states: number };
    sector_split: Record<string, number>;
    concentration: number;
  }): Promise<{ summary: string }> {
    const res = await fetch(`${API_BASE}/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(summaryData),
    });
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    return res.json();
  },
};
