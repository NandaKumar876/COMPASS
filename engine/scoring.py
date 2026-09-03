from engine.models import Proposal, Region, Weights

DIMENSIONS = ["impact", "efficiency", "equity", "alignment", "feasibility"]


def compute_raw_scores(
    proposals: list[Proposal], regions: dict[str, Region], focus_areas: dict[str, float]
) -> dict[str, dict[str, float]]:
    raw = {}
    for p in proposals:
        region = regions[p.region]
        impact_raw = p.beneficiaries * p.outcome_depth
        efficiency_raw = impact_raw / p.budget if p.budget else 0.0
        equity_raw = region.need_index * (1 - region.saturation)
        alignment_raw = focus_areas.get(p.sector, 0.0)
        feasibility_raw = 0.5 * p.partner_track_record + 0.5 * p.budget_realism
        raw[p.id] = {
            "impact": impact_raw,
            "efficiency": efficiency_raw,
            "equity": equity_raw,
            "alignment": alignment_raw,
            "feasibility": feasibility_raw,
        }
    return raw


def normalize(raw_scores: dict[str, dict[str, float]]) -> dict[str, dict[str, float]]:
    if not raw_scores:
        return {}
    mins = {d: min(v[d] for v in raw_scores.values()) for d in DIMENSIONS}
    maxs = {d: max(v[d] for v in raw_scores.values()) for d in DIMENSIONS}
    normed = {}
    for pid, vals in raw_scores.items():
        normed[pid] = {}
        for d in DIMENSIONS:
            lo, hi = mins[d], maxs[d]
            normed[pid][d] = (vals[d] - lo) / (hi - lo) if hi > lo else 1.0
    return normed


def weighted_scores(normed: dict[str, dict[str, float]], weights: Weights) -> dict[str, float]:
    out = {}
    for pid, vals in normed.items():
        out[pid] = (
            weights.impact * vals["impact"]
            + weights.efficiency * vals["efficiency"]
            + weights.equity * vals["equity"]
            + weights.alignment * vals["alignment"]
            + weights.feasibility * vals["feasibility"]
        )
    return out


def score_proposals(
    proposals: list[Proposal], regions: dict[str, Region], focus_areas: dict[str, float], weights: Weights
) -> dict[str, float]:
    raw = compute_raw_scores(proposals, regions, focus_areas)
    normed = normalize(raw)
    return weighted_scores(normed, weights)
