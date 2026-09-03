from engine.models import Constraints
from engine.constraints import filter_proposals


def test_filter_by_region(sample_proposals):
    result = filter_proposals(sample_proposals, Constraints(region="Odisha"))
    assert {p.id for p in result} == {"P001", "P003"}


def test_filter_by_sector(sample_proposals):
    result = filter_proposals(sample_proposals, Constraints(sector="healthcare"))
    assert {p.id for p in result} == {"P002"}


def test_filter_by_min_beneficiaries(sample_proposals):
    result = filter_proposals(sample_proposals, Constraints(min_beneficiaries=600))
    assert {p.id for p in result} == {"P001"}


def test_no_constraints_returns_all(sample_proposals):
    result = filter_proposals(sample_proposals, Constraints())
    assert len(result) == 3
