from engine.models import Proposal


def rescue(
    target: Proposal, funded: list[Proposal], scores: dict[str, float], budget: float, spent: float
) -> dict:
    remaining = budget - spent
    gap = target.budget - remaining
    if gap <= 0:
        return {"type": "already_fits"}
    candidates = sorted(
        [p for p in funded if not p.must_fund],
        key=lambda p: scores[p.id] / p.budget if p.budget else 0.0,
    )
    dropped: list[Proposal] = []
    freed = 0.0
    for p in candidates:
        dropped.append(p)
        freed += p.budget
        if freed >= gap:
            break
    return {
        "type": "swap",
        "drop": [p.id for p in dropped],
        "or_add_budget": gap,
    }
