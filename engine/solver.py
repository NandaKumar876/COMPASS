from engine.models import Proposal


def allocate_greedy(
    proposals: list[Proposal], scores: dict[str, float], budget: float
) -> tuple[list[Proposal], float]:
    must = [p for p in proposals if p.must_fund]
    rest = [p for p in proposals if not p.must_fund]
    rest_sorted = sorted(
        rest,
        key=lambda p: (-(scores[p.id] / p.budget if p.budget else 0.0), p.id),
    )
    funded: list[Proposal] = []
    spent = 0.0
    for p in must:
        funded.append(p)
        spent += p.budget
    for p in rest_sorted:
        if spent + p.budget <= budget:
            funded.append(p)
            spent += p.budget
    return funded, spent


def compute_totals(
    funded: list[Proposal], unfunded: list[Proposal], spent: float, scores: dict[str, float]
) -> dict:
    coverage: dict[str, int] = {}
    sector_split = {"education": 0, "healthcare": 0, "environment": 0, "community": 0}
    for p in funded:
        coverage[p.region] = coverage.get(p.region, 0) + 1
        sector_split[p.sector] += 1
    total_funded = len(funded)
    concentration = sum((c / total_funded) ** 2 for c in coverage.values()) if total_funded else 0.0
    return {
        "funded": [p.id for p in funded],
        "unfunded": [p.id for p in unfunded],
        "totals": {
            "count": total_funded,
            "spent": spent,
            "beneficiaries": sum(p.beneficiaries for p in funded),
            "states": len(coverage),
        },
        "coverage": coverage,
        "concentration": round(concentration, 4),
        "per_project_score": {p.id: round(scores[p.id], 4) for p in funded + unfunded},
        "sector_split": sector_split,
    }
