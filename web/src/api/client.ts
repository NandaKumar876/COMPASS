import type {
  Proposal,
  Weights,
  AllocationResult,
  ExplainResponse,
  QueryResponse,
  IntakeResponse,
  SummaryResponse,
} from '../types';

const BASE = '/api';

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

export async function getProposals(): Promise<Proposal[]> {
  const res = await fetch(`${BASE}/proposals`);
  if (!res.ok) throw new Error(`/proposals failed: ${res.status}`);
  return res.json();
}

export function explainProject(
  projectId: string,
  weights: Weights,
  budget: number,
  allocationState: { funded: string[]; spent: number }
): Promise<ExplainResponse> {
  return postJSON<ExplainResponse>('/explain', {
    project_id: projectId,
    weights,
    budget,
    allocation_state: allocationState,
  });
}

export function submitQuery(text: string): Promise<QueryResponse> {
  return postJSON<QueryResponse>('/query', { text });
}

export async function submitIntake(files?: File[], rawText?: string): Promise<IntakeResponse> {
  const form = new FormData();
  if (files) files.forEach((f) => form.append('files', f));
  if (rawText) form.append('raw_text', rawText);
  const res = await fetch(`${BASE}/intake`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`/intake failed: ${res.status}`);
  return res.json();
}

export function submitSummary(
  totals: AllocationResult['totals'],
  sectorSplit: AllocationResult['sector_split'],
  concentration: number
): Promise<SummaryResponse> {
  return postJSON<SummaryResponse>('/summary', {
    totals,
    sector_split: sectorSplit,
    concentration,
  });
}
