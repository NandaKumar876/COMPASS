import type { Weights, Persona } from '../types';

export const focusAreas: Record<string, number> = {
  education: 1.0,
  healthcare: 0.8,
  environment: 0.6,
  community: 0.5,
};

export const DEFAULT_WEIGHTS: Weights = {
  impact: 0.3,
  efficiency: 0.25,
  equity: 0.2,
  alignment: 0.15,
  feasibility: 0.1,
};

export const DEFAULT_BUDGET = 50_000_000; // ₹5 Crore

export const PERSONAS: Persona[] = [
  {
    key: 'MAX_REACH',
    label: 'Maximum Reach',
    description: 'Maximise the number of lives touched',
    icon: '◎',
    color: '#6366A0',
    weights: { impact: 0.5, efficiency: 0.3, equity: 0.1, alignment: 0.05, feasibility: 0.05 },
  },
  {
    key: 'DEEP_IMPACT',
    label: 'Deepest Impact',
    description: 'Biggest change per individual life',
    icon: '◆',
    color: '#7CB07F',
    weights: { impact: 0.6, efficiency: 0.1, equity: 0.1, alignment: 0.1, feasibility: 0.1 },
  },
  {
    key: 'EQUITY_FIRST',
    label: 'Equity First',
    description: 'Widest regional spread of impact',
    icon: '⬡',
    color: '#E8A849',
    weights: { impact: 0.2, efficiency: 0.15, equity: 0.5, alignment: 0.1, feasibility: 0.05 },
  },
  {
    key: 'CFO_MODE',
    label: 'CFO Mode',
    description: 'Best impact-per-rupee, risk-averse',
    icon: '▣',
    color: '#D4725C',
    weights: { impact: 0.2, efficiency: 0.5, equity: 0.1, alignment: 0.1, feasibility: 0.1 },
  },
];
