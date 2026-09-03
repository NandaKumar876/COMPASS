from engine.models import Proposal, Constraints


def filter_proposals(proposals: list[Proposal], constraints: Constraints) -> list[Proposal]:
    result = proposals
    if constraints.region:
        result = [p for p in result if p.region == constraints.region]
    if constraints.sector:
        result = [p for p in result if p.sector == constraints.sector]
    if constraints.min_beneficiaries:
        result = [p for p in result if p.beneficiaries >= constraints.min_beneficiaries]
    return result
