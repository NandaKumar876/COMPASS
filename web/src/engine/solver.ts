// ─── Client-side greedy solver ──────────────────────────────────────────────
// Mirrors backend logic for instant slider response. No network round-trip.

import type { Proposal, Weights, AllocationResult, Sector } from '../types';
import { regionMap } from '../data/regions';
import { focusAreas } from '../data/objectives';

// ─── Scoring ────────────────────────────────────────────────────────────────

interface ScoredProposal {
  proposal: Proposal;
  score: number;
  subScores: {
    impact: number;
    efficiency: number;
    equity: number;
    alignment: number;
    feasibility: number;
  };
}

function minMaxNormalize(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((v) => (v - min) / (max - min));
}

function scoreProposals(proposals: Proposal[], weights: Weights): ScoredProposal[] {
  // Compute raw sub-scores
  const impactRaw = proposals.map((p) => p.beneficiaries * p.outcome_depth);
  const efficiencyRaw = proposals.map((p, i) => impactRaw[i] / p.budget);
  const equityRaw = proposals.map((p) => {
    const region = regionMap[p.region];
    if (!region) return 0.5;
    return region.need_index * (1 - region.saturation);
  });
  const alignmentRaw = proposals.map((p) => focusAreas[p.sector] ?? 0.5);
  const feasibilityRaw = proposals.map(
    (p) => 0.5 * p.partner_track_record + 0.5 * p.budget_realism
  );

  // Normalize each dimension to [0, 1]
  const impactNorm = minMaxNormalize(impactRaw);
  const efficiencyNorm = minMaxNormalize(efficiencyRaw);
  const equityNorm = minMaxNormalize(equityRaw);
  const alignmentNorm = minMaxNormalize(alignmentRaw);
  const feasibilityNorm = minMaxNormalize(feasibilityRaw);

  // Normalize weights to sum to 1
  const wTotal =
    weights.impact + weights.efficiency + weights.equity + weights.alignment + weights.feasibility;
  const w = {
    impact: weights.impact / wTotal,
    efficiency: weights.efficiency / wTotal,
    equity: weights.equity / wTotal,
    alignment: weights.alignment / wTotal,
    feasibility: weights.feasibility / wTotal,
  };

  return proposals.map((p, i) => {
    const subScores = {
      impact: impactNorm[i],
      efficiency: efficiencyNorm[i],
      equity: equityNorm[i],
      alignment: alignmentNorm[i],
      feasibility: feasibilityNorm[i],
    };
    const score =
      w.impact * subScores.impact +
      w.efficiency * subScores.efficiency +
      w.equity * subScores.equity +
      w.alignment * subScores.alignment +
      w.feasibility * subScores.feasibility;

    return { proposal: p, score, subScores };
  });
}

// ─── Greedy Allocator ───────────────────────────────────────────────────────

export function allocate(
  proposals: Proposal[],
  weights: Weights,
  budget: number
): AllocationResult {
  const scored = scoreProposals(proposals, weights);

  // Must-fund projects go first
  const mustFund = scored.filter((s) => s.proposal.must_fund);
  const rest = scored
    .filter((s) => !s.proposal.must_fund)
    .sort((a, b) => {
      // Sort by score/budget ratio (efficiency-weighted greedy)
      const ratioA = a.score / a.proposal.budget;
      const ratioB = b.score / b.proposal.budget;
      if (Math.abs(ratioA - ratioB) < 1e-12) return a.proposal.id.localeCompare(b.proposal.id);
      return ratioB - ratioA;
    });

  const funded: ScoredProposal[] = [];
  let spent = 0;

  // Add must-fund
  for (const s of mustFund) {
    funded.push(s);
    spent += s.proposal.budget;
  }

  // Greedy fill
  for (const s of rest) {
    if (spent + s.proposal.budget <= budget) {
      funded.push(s);
      spent += s.proposal.budget;
    }
  }

  const fundedIds = new Set(funded.map((s) => s.proposal.id));
  const unfundedIds = proposals.filter((p) => !fundedIds.has(p.id)).map((p) => p.id);

  // Coverage: count funded projects per state
  const coverage: Record<string, number> = {};
  let totalBeneficiaries = 0;
  const sectorCount: Record<Sector, number> = {
    education: 0,
    healthcare: 0,
    environment: 0,
    community: 0,
  };

  for (const s of funded) {
    const region = s.proposal.region;
    coverage[region] = (coverage[region] || 0) + 1;
    totalBeneficiaries += s.proposal.beneficiaries;
    sectorCount[s.proposal.sector]++;
  }

  // Concentration: Herfindahl index
  const totalFunded = funded.length || 1;
  const shares = Object.values(coverage).map((c) => c / totalFunded);
  const concentration = shares.reduce((sum, s) => sum + s * s, 0);

  // Per-project scores
  const perProjectScore: Record<string, number> = {};
  for (const s of scored) {
    perProjectScore[s.proposal.id] = Math.round(s.score * 100) / 100;
  }

  return {
    funded: funded.map((s) => s.proposal.id),
    unfunded: unfundedIds,
    totals: {
      count: funded.length,
      spent,
      beneficiaries: totalBeneficiaries,
      states: Object.keys(coverage).length,
    },
    coverage,
    concentration,
    per_project_score: perProjectScore,
    sector_split: sectorCount,
  };
}
