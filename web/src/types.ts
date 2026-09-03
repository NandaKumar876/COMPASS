// ─── COMPASS Type Definitions ───────────────────────────────────────────────

export type Sector = 'education' | 'healthcare' | 'environment' | 'community';

export interface Proposal {
  id: string;
  title: string;
  partner: string;
  sector: Sector;
  region: string;
  budget: number;
  beneficiaries: number;
  outcome_depth: number;
  expected_outcome: string;
  timeline_months: number;
  partner_track_record: number;
  budget_realism: number;
  must_fund: boolean;
}

export interface Weights {
  impact: number;
  efficiency: number;
  equity: number;
  alignment: number;
  feasibility: number;
}

export interface AllocationResult {
  funded: string[];
  unfunded: string[];
  totals: {
    count: number;
    spent: number;
    beneficiaries: number;
    states: number;
  };
  coverage: Record<string, number>;
  concentration: number;
  per_project_score: Record<string, number>;
  sector_split: Record<Sector, number>;
}

export interface ExplainResult {
  reason: string;
  rescue?: {
    drop: string[];
    or_add_budget: number;
  };
}

export type PersonaKey = 'MAX_REACH' | 'DEEP_IMPACT' | 'EQUITY_FIRST' | 'CFO_MODE';

export interface Persona {
  key: PersonaKey;
  label: string;
  description: string;
  icon: string;
  weights: Weights;
  color: string;
}

export interface Region {
  name: string;
  saturation: number;
  need_index: number;
  population: number;
}
