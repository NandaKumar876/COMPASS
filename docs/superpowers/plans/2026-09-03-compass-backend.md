# COMPASS Backend (engine + ai + api) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full COMPASS backend — optimizer engine, Groq AI narration layer, seed data, and FastAPI service — as a standalone Python service consumed by the existing React frontend.

**Architecture:** Three isolated Python packages composed only by `api/main.py`: `engine/` (pure functions, no I/O, no LLM calls — scoring, greedy knapsack solver, constraints filtering, counterfactual rescue) and `ai/` (Groq LLM calls only — narrates facts the engine already computed, never invents numbers). `api/` owns all file I/O (seed data loading) and HTTP wiring. Tests mock the Groq client everywhere so the suite never needs a live network call or a real API key.

**Tech Stack:** Python 3.10+, FastAPI, Pydantic v2, pytest + unittest.mock, Groq SDK, python-dotenv, venv + pip.

**Spec:** `COMPASS_MASTER_REFERENCE.md` (repo root) and `BACKEND_HANDOFF_SPEC.md` (repo root) — this plan implements the "Yash" (engine) and "Tamo" (ai) sections plus the shared `api/` layer.

## Global Constraints

- `engine/` never imports from `ai/`. `ai/` never imports from `engine/`. Only `api/main.py` imports both.
- The solver computes every number, score, and ranking. The LLM (`ai/`) only turns already-computed facts into sentences — it never invents a rupee value, score, or ranking.
- Determinism: identical `(proposals, weights, budget)` must always produce the identical funded set, in the identical order. Ties broken by ascending proposal `id`.
- All Groq calls use `temperature=0.0`.
- CORS allowed origins are exactly `http://localhost:5173` and `http://127.0.0.1:5173`.
- `GROQ_API_KEY` is read from the environment via `python-dotenv` + `.env` — never hardcoded, never committed (`.env` is gitignored).
- Solver is greedy-only this pass. ILP/PuLP is explicitly out of scope (tracked as a future stretch, not built here).
- Sectors are a fixed enum: `education | healthcare | environment | community`.
- Python 3.10+, dependencies managed via `venv` + `requirements.txt` (no poetry/pipenv).

---

### Task 1: Project Scaffolding

**Files:**
- Create: `requirements.txt`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `pyproject.toml`
- Create: `engine/__init__.py`, `ai/__init__.py`, `api/__init__.py`
- Create: `tests/__init__.py`, `tests/engine/__init__.py`, `tests/ai/__init__.py`, `tests/api/__init__.py`, `tests/data/__init__.py`

**Interfaces:**
- Produces: an importable `engine`, `ai`, `api` package layout that every later task builds inside, and a working pytest collection root.

- [ ] **Step 1: Create the package directory skeleton**

```bash
mkdir -p engine ai api data scripts tests/engine tests/ai tests/api tests/data
touch engine/__init__.py ai/__init__.py api/__init__.py
touch tests/__init__.py tests/engine/__init__.py tests/ai/__init__.py tests/api/__init__.py tests/data/__init__.py
```

- [ ] **Step 2: Write `requirements.txt`**

```
fastapi>=0.115,<0.116
uvicorn[standard]>=0.32,<0.33
pydantic>=2.9,<3.0
python-dotenv>=1.0,<2.0
groq>=0.11,<1.0
pytest>=8.3,<9.0
httpx>=0.27,<0.28
python-multipart>=0.0.12,<0.1
```

- [ ] **Step 3: Write `.env.example`**

```
GROQ_API_KEY=your_groq_api_key_here
```

- [ ] **Step 4: Write `.gitignore`**

```
venv/
__pycache__/
*.pyc
.env
*.egg-info/
.pytest_cache/
.env.local
```

- [ ] **Step 5: Write `pyproject.toml`**

```toml
[tool.pytest.ini_options]
pythonpath = ["."]
testpaths = ["tests"]
```

- [ ] **Step 6: Create venv and install dependencies**

```bash
python -m venv venv
source venv/Scripts/activate
pip install -r requirements.txt
```

- [ ] **Step 7: Verify the environment**

Run: `python -c "import fastapi, pydantic, groq, dotenv; print('ok')"`
Expected: prints `ok` with no import errors.

Run: `pytest --collect-only`
Expected: exits 0 (no tests collected yet is fine — just confirms pytest + pythonpath config works).

- [ ] **Step 8: Commit**

```bash
git add requirements.txt .env.example .gitignore pyproject.toml engine ai api tests
git commit -m "chore: scaffold backend project structure"
```

---

### Task 2: `engine/models.py` — Shared Data Models

**Files:**
- Create: `engine/models.py`
- Test: `tests/engine/test_models.py`

**Interfaces:**
- Produces: `Proposal`, `Region`, `Weights`, `Constraints` pydantic models — imported by every other engine and ai task, and by `api/schemas.py`.

- [ ] **Step 1: Write the failing test**

```python
# tests/engine/test_models.py
import pytest
from pydantic import ValidationError
from engine.models import Proposal, Region, Weights, Constraints


def test_proposal_valid():
    p = Proposal(
        id="P001", title="Test", partner="Org", sector="education",
        region="Odisha", budget=1000000, beneficiaries=500,
        outcome_depth=0.7, expected_outcome="Better schools",
        timeline_months=12, partner_track_record=0.8, budget_realism=0.9,
    )
    assert p.must_fund is False
    assert p.sector == "education"


def test_proposal_invalid_sector_rejected():
    with pytest.raises(ValidationError):
        Proposal(
            id="P002", title="Test", partner="Org", sector="agriculture",
            region="Odisha", budget=1000000, beneficiaries=500,
            outcome_depth=0.7, expected_outcome="x",
            partner_track_record=0.8, budget_realism=0.9,
        )


def test_region_weights_constraints():
    r = Region(name="Odisha", saturation=0.2, need_index=0.85, population=46000000)
    w = Weights(impact=0.3, efficiency=0.25, equity=0.2, alignment=0.15, feasibility=0.1)
    c = Constraints()
    assert r.name == "Odisha"
    assert w.impact == 0.3
    assert c.region is None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/engine/test_models.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'engine.models'`

- [ ] **Step 3: Write the implementation**

```python
# engine/models.py
from typing import Literal, Optional
from pydantic import BaseModel

Sector = Literal["education", "healthcare", "environment", "community"]


class Proposal(BaseModel):
    id: str
    title: str
    partner: str
    sector: Sector
    region: str
    budget: float
    beneficiaries: int
    outcome_depth: float
    expected_outcome: str
    timeline_months: Optional[int] = None
    partner_track_record: float
    budget_realism: float
    must_fund: bool = False


class Region(BaseModel):
    name: str
    saturation: float
    need_index: float
    population: int


class Weights(BaseModel):
    impact: float
    efficiency: float
    equity: float
    alignment: float
    feasibility: float


class Constraints(BaseModel):
    region: Optional[str] = None
    sector: Optional[Sector] = None
    min_beneficiaries: Optional[int] = None
    budget_cap: Optional[float] = None
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/engine/test_models.py -v`
Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
git add engine/models.py tests/engine/test_models.py
git commit -m "feat: add engine data models"
```

---

### Task 3: `engine/scoring.py` — Scoring Model

**Files:**
- Create: `engine/scoring.py`
- Create: `tests/engine/conftest.py`
- Test: `tests/engine/test_scoring.py`

**Interfaces:**
- Consumes: `Proposal`, `Region`, `Weights` from `engine/models.py` (Task 2).
- Produces: `compute_raw_scores(proposals, regions, focus_areas) -> dict[str, dict[str, float]]`, `normalize(raw) -> dict[str, dict[str, float]]`, `weighted_scores(normed, weights) -> dict[str, float]`, `score_proposals(proposals, regions, focus_areas, weights) -> dict[str, float]` — `score_proposals` is consumed by `engine/solver.py` (Task 5) and `api/main.py` (Task 15).

- [ ] **Step 1: Write the shared test fixtures**

```python
# tests/engine/conftest.py
import pytest
from engine.models import Proposal, Region, Weights


@pytest.fixture
def sample_proposals():
    return [
        Proposal(
            id="P001", title="A", partner="Org1", sector="education",
            region="Odisha", budget=1000000, beneficiaries=1000,
            outcome_depth=0.8, expected_outcome="x",
            partner_track_record=0.9, budget_realism=0.9, must_fund=False,
        ),
        Proposal(
            id="P002", title="B", partner="Org2", sector="healthcare",
            region="Bihar", budget=2000000, beneficiaries=500,
            outcome_depth=0.5, expected_outcome="y",
            partner_track_record=0.6, budget_realism=0.7, must_fund=False,
        ),
        Proposal(
            id="P003", title="C", partner="Org3", sector="environment",
            region="Odisha", budget=500000, beneficiaries=200,
            outcome_depth=0.9, expected_outcome="z",
            partner_track_record=0.95, budget_realism=0.85, must_fund=True,
        ),
    ]


@pytest.fixture
def sample_regions():
    return {
        "Odisha": Region(name="Odisha", saturation=0.2, need_index=0.85, population=46000000),
        "Bihar": Region(name="Bihar", saturation=0.15, need_index=0.9, population=124000000),
    }


@pytest.fixture
def sample_focus_areas():
    return {"education": 1.0, "healthcare": 0.8, "environment": 0.6, "community": 0.5}


@pytest.fixture
def sample_weights():
    return Weights(impact=0.3, efficiency=0.25, equity=0.2, alignment=0.15, feasibility=0.1)
```

- [ ] **Step 2: Write the failing test**

```python
# tests/engine/test_scoring.py
import pytest
from engine.scoring import compute_raw_scores, normalize, weighted_scores, score_proposals


def test_compute_raw_scores(sample_proposals, sample_regions, sample_focus_areas):
    raw = compute_raw_scores(sample_proposals, sample_regions, sample_focus_areas)
    assert raw["P001"]["impact"] == 1000 * 0.8
    assert raw["P001"]["efficiency"] == (1000 * 0.8) / 1000000
    assert raw["P001"]["equity"] == 0.85 * (1 - 0.2)
    assert raw["P001"]["alignment"] == 1.0
    assert raw["P001"]["feasibility"] == 0.5 * 0.9 + 0.5 * 0.9


def test_normalize_produces_0_to_1_range(sample_proposals, sample_regions, sample_focus_areas):
    raw = compute_raw_scores(sample_proposals, sample_regions, sample_focus_areas)
    normed = normalize(raw)
    for vals in normed.values():
        for v in vals.values():
            assert 0.0 <= v <= 1.0
    best_impact_id = max(raw, key=lambda k: raw[k]["impact"])
    assert normed[best_impact_id]["impact"] == 1.0


def test_weighted_scores_sums_correctly(sample_proposals, sample_regions, sample_focus_areas, sample_weights):
    raw = compute_raw_scores(sample_proposals, sample_regions, sample_focus_areas)
    normed = normalize(raw)
    scores = weighted_scores(normed, sample_weights)
    for pid, vals in normed.items():
        expected = (
            sample_weights.impact * vals["impact"]
            + sample_weights.efficiency * vals["efficiency"]
            + sample_weights.equity * vals["equity"]
            + sample_weights.alignment * vals["alignment"]
            + sample_weights.feasibility * vals["feasibility"]
        )
        assert scores[pid] == pytest.approx(expected)


def test_score_proposals_end_to_end(sample_proposals, sample_regions, sample_focus_areas, sample_weights):
    scores = score_proposals(sample_proposals, sample_regions, sample_focus_areas, sample_weights)
    assert set(scores.keys()) == {"P001", "P002", "P003"}
    for v in scores.values():
        assert 0.0 <= v <= 1.0
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pytest tests/engine/test_scoring.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'engine.scoring'`

- [ ] **Step 4: Write the implementation**

```python
# engine/scoring.py
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pytest tests/engine/test_scoring.py -v`
Expected: 4 passed

- [ ] **Step 6: Commit**

```bash
git add engine/scoring.py tests/engine/conftest.py tests/engine/test_scoring.py
git commit -m "feat: add scoring model with min-max normalization"
```

---

### Task 4: `engine/constraints.py` — Constraint Filtering

**Files:**
- Create: `engine/constraints.py`
- Test: `tests/engine/test_constraints.py`

**Interfaces:**
- Consumes: `Proposal`, `Constraints` from `engine/models.py`; `sample_proposals` fixture from `tests/engine/conftest.py`.
- Produces: `filter_proposals(proposals, constraints) -> list[Proposal]` — consumed by `api/main.py` (Task 15) before scoring/solving.

- [ ] **Step 1: Write the failing test**

```python
# tests/engine/test_constraints.py
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/engine/test_constraints.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'engine.constraints'`

- [ ] **Step 3: Write the implementation**

```python
# engine/constraints.py
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/engine/test_constraints.py -v`
Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
git add engine/constraints.py tests/engine/test_constraints.py
git commit -m "feat: add constraint filtering"
```

---

### Task 5: `engine/solver.py` — Greedy Knapsack Solver + Totals

**Files:**
- Create: `engine/solver.py`
- Test: `tests/engine/test_solver.py`

**Interfaces:**
- Consumes: `Proposal` from `engine/models.py`; `sample_proposals` fixture from `tests/engine/conftest.py`.
- Produces: `allocate_greedy(proposals, scores, budget) -> tuple[list[Proposal], float]`, `compute_totals(funded, unfunded, spent, scores) -> dict` — both consumed by `api/main.py` (Task 15); `compute_totals`'s output dict shape is exactly the `/allocate` response body (`funded`, `unfunded`, `totals`, `coverage`, `concentration`, `per_project_score`, `sector_split`).

- [ ] **Step 1: Write the failing test**

```python
# tests/engine/test_solver.py
import pytest
from engine.solver import allocate_greedy, compute_totals


def test_must_fund_always_included(sample_proposals):
    scores = {"P001": 0.5, "P002": 0.9, "P003": 0.3}
    funded, spent = allocate_greedy(sample_proposals, scores, budget=500000)
    assert "P003" in {p.id for p in funded}


def test_budget_respected(sample_proposals):
    scores = {"P001": 0.9, "P002": 0.8, "P003": 0.5}
    funded, spent = allocate_greedy(sample_proposals, scores, budget=1500000)
    assert spent <= 1500000


def test_determinism(sample_proposals):
    scores = {"P001": 0.7, "P002": 0.7, "P003": 0.7}
    funded1, spent1 = allocate_greedy(sample_proposals, scores, budget=3500000)
    funded2, spent2 = allocate_greedy(sample_proposals, scores, budget=3500000)
    assert [p.id for p in funded1] == [p.id for p in funded2]
    assert spent1 == spent2


def test_higher_ratio_funded_first_when_budget_tight(sample_proposals):
    scores = {"P001": 0.9, "P002": 0.4, "P003": 0.1}
    funded, spent = allocate_greedy(sample_proposals, scores, budget=1500000)
    funded_ids = {p.id for p in funded}
    assert "P001" in funded_ids
    assert "P002" not in funded_ids


def test_compute_totals_shape(sample_proposals):
    scores = {"P001": 0.9, "P002": 0.4, "P003": 0.1}
    funded = [sample_proposals[0], sample_proposals[2]]
    unfunded = [sample_proposals[1]]
    result = compute_totals(funded, unfunded, spent=1500000, scores=scores)
    assert result["funded"] == ["P001", "P003"]
    assert result["unfunded"] == ["P002"]
    assert result["totals"]["count"] == 2
    assert result["totals"]["spent"] == 1500000
    assert result["totals"]["beneficiaries"] == 1000 + 200
    assert result["coverage"] == {"Odisha": 2}
    assert result["concentration"] == pytest.approx(1.0)
    assert result["sector_split"]["education"] == 1
    assert result["sector_split"]["environment"] == 1
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/engine/test_solver.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'engine.solver'`

- [ ] **Step 3: Write the implementation**

```python
# engine/solver.py
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/engine/test_solver.py -v`
Expected: 5 passed

- [ ] **Step 5: Commit**

```bash
git add engine/solver.py tests/engine/test_solver.py
git commit -m "feat: add greedy knapsack solver and totals aggregation"
```

---

### Task 6: `engine/counterfactual.py` — Rescue Logic

**Files:**
- Create: `engine/counterfactual.py`
- Test: `tests/engine/test_counterfactual.py`

**Interfaces:**
- Consumes: `Proposal` from `engine/models.py`; `sample_proposals` fixture.
- Produces: `rescue(target, funded, scores, budget, spent) -> dict` with shape `{"type": "already_fits"}` or `{"type": "swap", "drop": list[str], "or_add_budget": float}` — consumed by `api/main.py` (Task 15) `/explain` route.

- [ ] **Step 1: Write the failing test**

```python
# tests/engine/test_counterfactual.py
from engine.counterfactual import rescue


def test_already_fits_returns_that_type(sample_proposals):
    target = sample_proposals[1]  # P002, budget 2,000,000
    scores = {"P001": 0.5, "P002": 0.5, "P003": 0.5}
    funded = [sample_proposals[0]]  # P001 only, spent 1,000,000
    result = rescue(target, funded, scores, budget=5000000, spent=1000000)
    assert result["type"] == "already_fits"


def test_swap_finds_minimal_drop_set(sample_proposals):
    target = sample_proposals[1]  # P002, budget 2,000,000
    scores = {"P001": 0.9, "P002": 0.5, "P003": 0.9}
    funded = [sample_proposals[0], sample_proposals[2]]  # P001 (1M) + P003 must_fund (0.5M), spent 1.5M
    result = rescue(target, funded, scores, budget=1500000, spent=1500000)
    assert result["type"] == "swap"
    assert "P003" not in result["drop"]
    assert result["drop"] == ["P001"]
    assert result["or_add_budget"] == 2000000
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/engine/test_counterfactual.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'engine.counterfactual'`

- [ ] **Step 3: Write the implementation**

```python
# engine/counterfactual.py
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/engine/test_counterfactual.py -v`
Expected: 2 passed

- [ ] **Step 5: Commit**

```bash
git add engine/counterfactual.py tests/engine/test_counterfactual.py
git commit -m "feat: add counterfactual rescue logic"
```

---

### Task 7: Seed Data — `data/regions.json`, `data/objectives.json`, `data/proposals.json`

**Files:**
- Create: `data/regions.json`
- Create: `data/objectives.json`
- Create: `scripts/generate_seed_data.py`
- Create: `data/proposals.json` (generated by the script)
- Test: `tests/data/test_seed_data.py`

**Interfaces:**
- Consumes: `Proposal`, `Region` from `engine/models.py` (Task 2) for validation only.
- Produces: three JSON files under `data/` that `api/data_loader.py` (Task 15) loads at request time.

- [ ] **Step 1: Write `data/regions.json`**

```json
[
  { "name": "Odisha", "saturation": 0.20, "need_index": 0.85, "population": 46000000 },
  { "name": "Bihar", "saturation": 0.15, "need_index": 0.90, "population": 124000000 },
  { "name": "Uttar Pradesh", "saturation": 0.25, "need_index": 0.88, "population": 231000000 },
  { "name": "Rajasthan", "saturation": 0.30, "need_index": 0.75, "population": 81000000 },
  { "name": "Madhya Pradesh", "saturation": 0.22, "need_index": 0.80, "population": 85000000 },
  { "name": "Chhattisgarh", "saturation": 0.18, "need_index": 0.82, "population": 29000000 },
  { "name": "Jharkhand", "saturation": 0.17, "need_index": 0.84, "population": 38000000 },
  { "name": "West Bengal", "saturation": 0.35, "need_index": 0.65, "population": 99000000 },
  { "name": "Tamil Nadu", "saturation": 0.60, "need_index": 0.40, "population": 77000000 },
  { "name": "Karnataka", "saturation": 0.55, "need_index": 0.45, "population": 68000000 },
  { "name": "Maharashtra", "saturation": 0.70, "need_index": 0.35, "population": 123000000 },
  { "name": "Gujarat", "saturation": 0.65, "need_index": 0.38, "population": 71000000 },
  { "name": "Assam", "saturation": 0.25, "need_index": 0.78, "population": 35000000 },
  { "name": "Kerala", "saturation": 0.58, "need_index": 0.30, "population": 35000000 },
  { "name": "Punjab", "saturation": 0.45, "need_index": 0.50, "population": 30000000 }
]
```

- [ ] **Step 2: Write `data/objectives.json`**

```json
{
  "focus_areas": { "education": 1.0, "healthcare": 0.8, "environment": 0.6, "community": 0.5 },
  "default_weights": {
    "impact": 0.3,
    "efficiency": 0.25,
    "equity": 0.2,
    "alignment": 0.15,
    "feasibility": 0.1
  }
}
```

- [ ] **Step 3: Write the seed proposal generator script**

```python
# scripts/generate_seed_data.py
import json
import random
from pathlib import Path

random.seed(42)

SECTORS = ["education", "healthcare", "environment", "community"]
REGIONS = [
    "Odisha", "Bihar", "Uttar Pradesh", "Rajasthan", "Madhya Pradesh",
    "Chhattisgarh", "Jharkhand", "West Bengal", "Tamil Nadu", "Karnataka",
    "Maharashtra", "Gujarat", "Assam", "Kerala", "Punjab",
]
PARTNERS = [
    "Pratham Education Foundation", "Gram Vikas Foundation", "Akshaya Patra",
    "CRY India", "Smile Foundation", "Goonj", "SEWA", "Naandi Foundation",
    "Gram Oorja Foundation", "New Dawn Trust", "Barefoot College",
    "Magic Bus India", "HelpAge India", "WaterAid India", "Aravind Eye Care",
]
SECTOR_TITLES = {
    "education": [
        "Digital classrooms for {region}", "Solar-powered schools, {region}",
        "Girl-child scholarship program, {region}", "Teacher training initiative, {region}",
    ],
    "healthcare": [
        "Mobile health clinics, {region}", "Maternal health outreach, {region}",
        "Child nutrition program, {region}", "Rural telemedicine network, {region}",
    ],
    "environment": [
        "Solar micro-grids, {region}", "Watershed restoration, {region}",
        "Clean cookstove distribution, {region}", "Community forestry, {region}",
    ],
    "community": [
        "Livelihood skilling center, {region}", "Women's self-help groups, {region}",
        "Safe drinking water access, {region}", "Disaster resilience program, {region}",
    ],
}

proposals = []
for i in range(1, 46):
    sector = SECTORS[(i - 1) % 4]
    region = REGIONS[(i - 1) % len(REGIONS)]
    partner = PARTNERS[(i - 1) % len(PARTNERS)]
    title = random.choice(SECTOR_TITLES[sector]).format(region=region)
    budget = random.randint(8, 60) * 100000
    beneficiaries = random.randint(500, 50000)
    proposals.append({
        "id": f"P{i:03d}",
        "title": title,
        "partner": partner,
        "sector": sector,
        "region": region,
        "budget": budget,
        "beneficiaries": beneficiaries,
        "outcome_depth": round(random.uniform(0.2, 0.9), 2),
        "expected_outcome": f"{title} reaching approximately {beneficiaries} beneficiaries",
        "timeline_months": random.choice([6, 9, 12, 18, 24]),
        "partner_track_record": round(random.uniform(0.4, 0.95), 2),
        "budget_realism": round(random.uniform(0.4, 0.95), 2),
        "must_fund": i in (1, 15),
    })

out = Path(__file__).parent.parent / "data" / "proposals.json"
out.write_text(json.dumps(proposals, indent=2))
print(f"wrote {len(proposals)} proposals to {out}")
```

- [ ] **Step 4: Run the script**

Run: `python scripts/generate_seed_data.py`
Expected: prints `wrote 45 proposals to .../data/proposals.json` and the file exists.

- [ ] **Step 5: Write the failing test**

```python
# tests/data/test_seed_data.py
import json
from pathlib import Path
from engine.models import Proposal, Region

DATA_DIR = Path(__file__).parent.parent.parent / "data"


def test_proposals_json_valid_and_45_entries():
    proposals = json.loads((DATA_DIR / "proposals.json").read_text())
    assert len(proposals) == 45
    parsed = [Proposal(**p) for p in proposals]
    ids = [p.id for p in parsed]
    assert len(ids) == len(set(ids))


def test_regions_json_valid():
    regions = json.loads((DATA_DIR / "regions.json").read_text())
    parsed = {r["name"]: Region(**r) for r in regions}
    assert len(parsed) >= 10


def test_every_proposal_region_exists_in_regions():
    proposals = json.loads((DATA_DIR / "proposals.json").read_text())
    regions = json.loads((DATA_DIR / "regions.json").read_text())
    region_names = {r["name"] for r in regions}
    for p in proposals:
        assert p["region"] in region_names


def test_objectives_json_has_all_sectors():
    objectives = json.loads((DATA_DIR / "objectives.json").read_text())
    for sector in ("education", "healthcare", "environment", "community"):
        assert sector in objectives["focus_areas"]
    assert sum(objectives["default_weights"].values()) == 1.0
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pytest tests/data/test_seed_data.py -v`
Expected: 4 passed (this validates data already generated in Step 4 — it should pass immediately since the files already exist; this is the acceptance check for the seed data, not a red/green TDD cycle).

- [ ] **Step 7: Commit**

```bash
git add data/regions.json data/objectives.json data/proposals.json scripts/generate_seed_data.py tests/data/test_seed_data.py
git commit -m "feat: add seed data (45 proposals, 15 regions, objectives)"
```

---

### Task 8: `ai/groq_client.py` — Groq Wrapper + Defensive JSON Parsing

**Files:**
- Create: `ai/groq_client.py`
- Test: `tests/ai/test_groq_client.py`

**Interfaces:**
- Produces: `get_client() -> Groq`, `call_groq(system_prompt, user_message, model="llama3-70b-8192", json_mode=True) -> str`, `safe_json_parse(raw: str) -> dict | list` — all consumed by every module in Task 10-14.

- [ ] **Step 1: Write the failing test**

```python
# tests/ai/test_groq_client.py
from unittest.mock import MagicMock, patch
import ai.groq_client as gc


def test_get_client_reads_api_key_from_env(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "fake-key")
    gc._client = None
    with patch("ai.groq_client.Groq") as MockGroq:
        gc.get_client()
        MockGroq.assert_called_once_with(api_key="fake-key")
    gc._client = None


def test_call_groq_uses_json_mode_by_default(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "fake-key")
    gc._client = None
    mock_response = MagicMock()
    mock_response.choices[0].message.content = '{"ok": true}'
    with patch("ai.groq_client.Groq") as MockGroq:
        MockGroq.return_value.chat.completions.create.return_value = mock_response
        result = gc.call_groq("system", "user")
        call_kwargs = MockGroq.return_value.chat.completions.create.call_args.kwargs
        assert call_kwargs["response_format"] == {"type": "json_object"}
        assert call_kwargs["temperature"] == 0.0
        assert result == '{"ok": true}'
    gc._client = None


def test_call_groq_plain_text_mode(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "fake-key")
    gc._client = None
    mock_response = MagicMock()
    mock_response.choices[0].message.content = "plain sentence"
    with patch("ai.groq_client.Groq") as MockGroq:
        MockGroq.return_value.chat.completions.create.return_value = mock_response
        result = gc.call_groq("system", "user", json_mode=False)
        call_kwargs = MockGroq.return_value.chat.completions.create.call_args.kwargs
        assert "response_format" not in call_kwargs
        assert result == "plain sentence"
    gc._client = None


def test_safe_json_parse_plain_json():
    assert gc.safe_json_parse('{"a": 1}') == {"a": 1}


def test_safe_json_parse_strips_markdown_fences():
    raw = '```json\n{"a": 1}\n```'
    assert gc.safe_json_parse(raw) == {"a": 1}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/ai/test_groq_client.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'ai.groq_client'`

- [ ] **Step 3: Write the implementation**

```python
# ai/groq_client.py
import json
import os
from groq import Groq

_client = None


def get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.environ["GROQ_API_KEY"]
        _client = Groq(api_key=api_key)
    return _client


def call_groq(
    system_prompt: str, user_message: str, model: str = "llama3-70b-8192", json_mode: bool = True
) -> str:
    client = get_client()
    kwargs = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "temperature": 0.0,
        "max_tokens": 1024,
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}
    response = client.chat.completions.create(**kwargs)
    return response.choices[0].message.content


def safe_json_parse(raw: str):
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        clean = raw.strip()
        if clean.startswith("```json"):
            clean = clean[len("```json"):]
        elif clean.startswith("```"):
            clean = clean[len("```"):]
        if clean.endswith("```"):
            clean = clean[:-3]
        return json.loads(clean.strip())
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/ai/test_groq_client.py -v`
Expected: 5 passed

- [ ] **Step 5: Commit**

```bash
git add ai/groq_client.py tests/ai/test_groq_client.py
git commit -m "feat: add Groq client wrapper with defensive JSON parsing"
```

---

### Task 9: `ai/prompts.py` — All Prompt Templates

**Files:**
- Create: `ai/prompts.py`
- Test: `tests/ai/test_prompts.py`

**Interfaces:**
- Produces: `PROMPTS: dict[str, str]` with keys `intake_system`, `explain_system`, `explain_user`, `nl_query_system`, `redflags_system`, `summary_system` — consumed by Tasks 10-14.

- [ ] **Step 1: Write the failing test**

```python
# tests/ai/test_prompts.py
from ai.prompts import PROMPTS

REQUIRED_KEYS = [
    "intake_system", "explain_system", "explain_user",
    "nl_query_system", "redflags_system", "summary_system",
]


def test_all_required_prompts_present_and_nonempty():
    for key in REQUIRED_KEYS:
        assert key in PROMPTS
        assert isinstance(PROMPTS[key], str)
        assert len(PROMPTS[key].strip()) > 0


def test_explain_user_has_facts_placeholder():
    assert "{facts}" in PROMPTS["explain_user"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/ai/test_prompts.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'ai.prompts'`

- [ ] **Step 3: Write the implementation**

```python
# ai/prompts.py
PROMPTS = {
    "intake_system": """You are a data extraction assistant. Extract CSR proposal fields as JSON only.
Output MUST be valid JSON matching this schema exactly:
{
  "id": string,
  "title": string,
  "partner": string,
  "sector": "education" | "healthcare" | "environment" | "community",
  "region": string,
  "budget": number | null,
  "beneficiaries": number | null,
  "outcome_depth": number (0.0-1.0),
  "expected_outcome": string,
  "timeline_months": number | null,
  "partner_track_record": number (0.0-1.0),
  "budget_realism": number (0.0-1.0),
  "must_fund": false
}
Rules:
- If a field is missing or unclear, use null. NEVER guess a budget number.
- outcome_depth: 0.2 = awareness campaign, 0.9 = life-changing intervention.
- Output ONLY the JSON object. No explanation, no markdown fences.""",

    "explain_system": """You are a funding decision narrator. Write exactly ONE sentence explaining a funding decision.
Use ONLY the facts provided. Do not add any numbers, scores, or rupee values that are
not in the facts dict. Do not use markdown. Output a plain string (not JSON).""",

    "explain_user": (
        "Decision facts: {facts}\n"
        "Write one natural sentence explaining why this project was funded or rejected, "
        "based on the status field. If rejected and rescue data is present, append the rescue suggestion."
    ),

    "nl_query_system": """You are a parameter parser for a CSR fund allocation optimizer.
Parse the user's natural language goal into a JSON weight and constraint object.
Output ONLY valid JSON with this exact schema:
{
  "weights": {
    "impact": float,
    "efficiency": float,
    "equity": float,
    "alignment": float,
    "feasibility": float
  },
  "constraints": {
    "region": string | null,
    "budget_cap": number | null,
    "min_beneficiaries": number | null,
    "sector": string | null
  }
}
All weight values must be floats between 0 and 1, and they must sum to 1.0.
No explanation. No prose. No markdown fences. JSON only.""",

    "redflags_system": """You are a CSR proposal quality checker. Analyze the proposal and return a JSON array
of red flags. Each flag must have this shape:
{ "flag": "vague_outcome" | "budget_unrealistic" | "missing_metrics" | "no_timeline" | "weak_partner", "reason": string }
Return an empty array [] if the proposal looks solid.
Output ONLY valid JSON. No markdown fences. No prose.""",

    "summary_system": """You are a CSR program officer writing a board summary. Write exactly one paragraph
summarizing the funded portfolio. Use ONLY the allocation data provided. Do not invent
any projects, numbers, or rupee amounts not in the data. Plain English. No markdown.""",
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/ai/test_prompts.py -v`
Expected: 2 passed

- [ ] **Step 5: Commit**

```bash
git add ai/prompts.py tests/ai/test_prompts.py
git commit -m "feat: add all Groq prompt templates"
```

---

### Task 10: `ai/intake.py` — Document Extraction

**Files:**
- Create: `ai/intake.py`
- Test: `tests/ai/test_intake.py`

**Interfaces:**
- Consumes: `call_groq`, `safe_json_parse` from `ai/groq_client.py` (Task 8); `PROMPTS` from `ai/prompts.py` (Task 9).
- Produces: `extract_proposal(raw_text: str, proposal_id: str) -> dict`, `compute_confidence(data: dict) -> float` — consumed by `api/main.py` `/intake` route (Task 15).

- [ ] **Step 1: Write the failing test**

```python
# tests/ai/test_intake.py
import json
from unittest.mock import patch
from ai.intake import extract_proposal, compute_confidence


def test_compute_confidence_all_fields_present():
    data = {
        "title": "x", "partner": "y", "sector": "education", "region": "Odisha",
        "budget": 100, "beneficiaries": 50, "outcome_depth": 0.5,
        "expected_outcome": "z", "timeline_months": 12,
        "partner_track_record": 0.8, "budget_realism": 0.8,
    }
    assert compute_confidence(data) == 1.0


def test_compute_confidence_missing_fields():
    data = {
        "title": "x", "partner": None, "sector": "education", "region": "Odisha",
        "budget": None, "beneficiaries": 50, "outcome_depth": 0.5,
        "expected_outcome": "z", "timeline_months": None,
        "partner_track_record": 0.8, "budget_realism": 0.8,
    }
    assert compute_confidence(data) == round(8 / 11, 2)


def test_extract_proposal_calls_groq_and_assigns_id():
    fake_json = json.dumps({
        "title": "Solar micro-grids", "partner": "Gram Oorja", "sector": "environment",
        "region": "Jharkhand", "budget": 2400000, "beneficiaries": 4000,
        "outcome_depth": 0.75, "expected_outcome": "24/7 power",
        "timeline_months": 10, "partner_track_record": 0.88, "budget_realism": 0.85,
    })
    with patch("ai.intake.call_groq", return_value=fake_json) as mock_call:
        result = extract_proposal("raw proposal text", "EX001")
        mock_call.assert_called_once()
        assert result["id"] == "EX001"
        assert result["must_fund"] is False
        assert result["confidence"] == 1.0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/ai/test_intake.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'ai.intake'`

- [ ] **Step 3: Write the implementation**

```python
# ai/intake.py
from ai.groq_client import call_groq, safe_json_parse
from ai.prompts import PROMPTS

REQUIRED_FIELDS = [
    "title", "partner", "sector", "region", "budget", "beneficiaries",
    "outcome_depth", "expected_outcome", "timeline_months",
    "partner_track_record", "budget_realism",
]


def extract_proposal(raw_text: str, proposal_id: str) -> dict:
    result = call_groq(PROMPTS["intake_system"], raw_text, model="llama3-70b-8192")
    data = safe_json_parse(result)
    data["id"] = proposal_id
    data.setdefault("must_fund", False)
    data["confidence"] = compute_confidence(data)
    return data


def compute_confidence(data: dict) -> float:
    filled = sum(1 for field in REQUIRED_FIELDS if data.get(field) is not None)
    return round(filled / len(REQUIRED_FIELDS), 2)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/ai/test_intake.py -v`
Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
git add ai/intake.py tests/ai/test_intake.py
git commit -m "feat: add AI intake extraction with confidence scoring"
```

---

### Task 11: `ai/explain.py` — Decision Narrator

**Files:**
- Create: `ai/explain.py`
- Test: `tests/ai/test_explain.py`

**Interfaces:**
- Consumes: `Proposal`, `Region` from `engine/models.py`; `call_groq` from `ai/groq_client.py`; `PROMPTS` from `ai/prompts.py`.
- Produces: `build_facts(project, region, is_funded, scores, budget, spent, focus_areas, rescue=None) -> dict`, `explain_decision(facts: dict) -> str` — both consumed by `api/main.py` `/explain` route (Task 15).

- [ ] **Step 1: Write the failing test**

```python
# tests/ai/test_explain.py
from unittest.mock import patch
from engine.models import Proposal, Region
from ai.explain import build_facts, explain_decision


def _proposal():
    return Proposal(
        id="P017", title="Solar classrooms", partner="Gram Vikas", sector="education",
        region="Odisha", budget=2400000, beneficiaries=3200, outcome_depth=0.7,
        expected_outcome="x", partner_track_record=0.8, budget_realism=0.9,
    )


def test_build_facts_funded():
    p = _proposal()
    region = Region(name="Odisha", saturation=0.2, need_index=0.85, population=46000000)
    scores = {"P017": 0.9, "P002": 0.5, "P003": 0.3}
    facts = build_facts(
        p, region, is_funded=True, scores=scores, budget=5000000, spent=2400000,
        focus_areas={"education": 1.0},
    )
    assert facts["status"] == "funded"
    assert facts["efficiency_percentile"] == 100
    assert facts["underserved"] is True
    assert facts["aligned"] is True
    assert facts["budget_gap"] is None


def test_build_facts_rejected_computes_budget_gap():
    p = _proposal()
    region = Region(name="Odisha", saturation=0.2, need_index=0.85, population=46000000)
    scores = {"P017": 0.3, "P002": 0.9}
    facts = build_facts(
        p, region, is_funded=False, scores=scores, budget=3000000, spent=2900000,
        focus_areas={"education": 1.0},
        rescue={"drop": ["P014"], "or_add_budget": 2300000},
    )
    assert facts["status"] == "rejected"
    assert facts["budget_gap"] == 2400000 - (3000000 - 2900000)
    assert facts["rescue"]["drop"] == ["P014"]


def test_explain_decision_calls_groq_plain_text():
    with patch("ai.explain.call_groq", return_value="Funded — top decile.") as mock_call:
        result = explain_decision({"status": "funded"})
        mock_call.assert_called_once()
        assert result == "Funded — top decile."
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/ai/test_explain.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'ai.explain'`

- [ ] **Step 3: Write the implementation**

```python
# ai/explain.py
import json
from engine.models import Proposal, Region
from ai.groq_client import call_groq
from ai.prompts import PROMPTS


def build_facts(
    project: Proposal,
    region: Region,
    is_funded: bool,
    scores: dict,
    budget: float,
    spent: float,
    focus_areas: dict,
    rescue: dict | None = None,
) -> dict:
    all_scores = sorted(scores.values(), reverse=True)
    rank = all_scores.index(scores[project.id])
    percentile = round(100 * (1 - rank / len(all_scores)))
    facts = {
        "status": "funded" if is_funded else "rejected",
        "efficiency_percentile": percentile,
        "region": project.region,
        "underserved": region.need_index > 0.5 and region.saturation < 0.5,
        "sector": project.sector,
        "aligned": focus_areas.get(project.sector, 0) >= 0.5,
        "budget_gap": None,
        "rescue": None,
    }
    if not is_funded:
        remaining = budget - spent
        gap = project.budget - remaining
        facts["budget_gap"] = round(gap) if gap > 0 else None
        facts["rescue"] = rescue
    return facts


def explain_decision(facts: dict) -> str:
    system = PROMPTS["explain_system"]
    user = PROMPTS["explain_user"].format(facts=json.dumps(facts))
    return call_groq(system, user, model="llama3-70b-8192", json_mode=False)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/ai/test_explain.py -v`
Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
git add ai/explain.py tests/ai/test_explain.py
git commit -m "feat: add decision narrator with fact-based grounding"
```

---

### Task 12: `ai/nl_query.py` — Natural-Language Query Parsing

**Files:**
- Create: `ai/nl_query.py`
- Test: `tests/ai/test_nl_query.py`

**Interfaces:**
- Consumes: `call_groq`, `safe_json_parse` from `ai/groq_client.py`; `PROMPTS` from `ai/prompts.py`.
- Produces: `parse_nl_query(text: str) -> dict` with shape `{"weights": {...}, "constraints": {...}}` — consumed by `api/main.py` `/query` route (Task 15).

- [ ] **Step 1: Write the failing test**

```python
# tests/ai/test_nl_query.py
import json
import pytest
from unittest.mock import patch
from ai.nl_query import parse_nl_query


def test_parse_nl_query_normalizes_weights():
    fake = json.dumps({
        "weights": {"impact": 0.6, "efficiency": 1.0, "equity": 0.2, "alignment": 0.1, "feasibility": 0.1},
        "constraints": {"region": "Tamil Nadu", "budget_cap": 3000000, "min_beneficiaries": 100000, "sector": None},
    })
    with patch("ai.nl_query.call_groq", return_value=fake):
        result = parse_nl_query("cheapest way to reach 100k children in Tamil Nadu under 30L")
        total = sum(result["weights"].values())
        assert total == pytest.approx(1.0)
        assert result["constraints"]["region"] == "Tamil Nadu"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/ai/test_nl_query.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'ai.nl_query'`

- [ ] **Step 3: Write the implementation**

```python
# ai/nl_query.py
from ai.groq_client import call_groq, safe_json_parse
from ai.prompts import PROMPTS


def parse_nl_query(text: str) -> dict:
    result = call_groq(PROMPTS["nl_query_system"], text, model="llama3-8b-8192")
    parsed = safe_json_parse(result)
    total = sum(parsed["weights"].values())
    if total > 0:
        parsed["weights"] = {k: v / total for k, v in parsed["weights"].items()}
    return parsed
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/ai/test_nl_query.py -v`
Expected: 1 passed

- [ ] **Step 5: Commit**

```bash
git add ai/nl_query.py tests/ai/test_nl_query.py
git commit -m "feat: add NL query parsing with weight normalization"
```

---

### Task 13: `ai/redflags.py` — Red Flag Detection

**Files:**
- Create: `ai/redflags.py`
- Test: `tests/ai/test_redflags.py`

**Interfaces:**
- Consumes: `call_groq`, `safe_json_parse` from `ai/groq_client.py`; `PROMPTS` from `ai/prompts.py`.
- Produces: `check_redflags(proposal: dict) -> list[dict]` — consumed by `api/main.py` `/intake` route (Task 15).

- [ ] **Step 1: Write the failing test**

```python
# tests/ai/test_redflags.py
import json
from unittest.mock import patch
from ai.redflags import check_redflags


def test_check_redflags_returns_list():
    fake = json.dumps([{"flag": "vague_outcome", "reason": "no metrics"}])
    with patch("ai.redflags.call_groq", return_value=fake):
        result = check_redflags({"title": "x"})
        assert result == [{"flag": "vague_outcome", "reason": "no metrics"}]


def test_check_redflags_empty_when_clean():
    with patch("ai.redflags.call_groq", return_value="[]"):
        result = check_redflags({"title": "solid proposal"})
        assert result == []
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/ai/test_redflags.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'ai.redflags'`

- [ ] **Step 3: Write the implementation**

```python
# ai/redflags.py
import json
from ai.groq_client import call_groq, safe_json_parse
from ai.prompts import PROMPTS


def check_redflags(proposal: dict) -> list[dict]:
    result = call_groq(PROMPTS["redflags_system"], f"Proposal: {json.dumps(proposal)}", model="llama3-8b-8192")
    return safe_json_parse(result)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/ai/test_redflags.py -v`
Expected: 2 passed

- [ ] **Step 5: Commit**

```bash
git add ai/redflags.py tests/ai/test_redflags.py
git commit -m "feat: add red flag detection"
```

---

### Task 14: `ai/summary.py` — Executive Summary

**Files:**
- Create: `ai/summary.py`
- Test: `tests/ai/test_summary.py`

**Interfaces:**
- Consumes: `call_groq` from `ai/groq_client.py`; `PROMPTS` from `ai/prompts.py`.
- Produces: `generate_summary(allocation_summary: dict) -> str` — consumed by `api/main.py` `/summary` route (Task 15).

- [ ] **Step 1: Write the failing test**

```python
# tests/ai/test_summary.py
from unittest.mock import patch
from ai.summary import generate_summary


def test_generate_summary_calls_groq_plain_text():
    with patch("ai.summary.call_groq", return_value="The portfolio funds 23 projects...") as mock_call:
        result = generate_summary({"totals": {"count": 23}})
        mock_call.assert_called_once()
        assert result.startswith("The portfolio")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/ai/test_summary.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'ai.summary'`

- [ ] **Step 3: Write the implementation**

```python
# ai/summary.py
import json
from ai.groq_client import call_groq
from ai.prompts import PROMPTS


def generate_summary(allocation_summary: dict) -> str:
    user = (
        f"Allocation summary data: {json.dumps(allocation_summary)}\n"
        "Write a concise board-ready paragraph summarizing this funded portfolio, "
        "the total reach, geographic spread, and how it aligns with organizational objectives."
    )
    return call_groq(PROMPTS["summary_system"], user, model="llama3-70b-8192", json_mode=False)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/ai/test_summary.py -v`
Expected: 1 passed

- [ ] **Step 5: Commit**

```bash
git add ai/summary.py tests/ai/test_summary.py
git commit -m "feat: add executive summary generator"
```

---

### Task 15: `api/` — FastAPI Wiring (schemas, data loader, main)

**Files:**
- Create: `api/schemas.py`
- Create: `api/data_loader.py`
- Create: `api/main.py`
- Create: `tests/api/conftest.py`
- Test: `tests/api/test_main.py`

**Interfaces:**
- Consumes: everything from Tasks 2-14 (`engine.models`, `engine.scoring`, `engine.solver`, `engine.constraints`, `engine.counterfactual`, `ai.explain`, `ai.nl_query`, `ai.intake`, `ai.redflags`, `ai.summary`).
- Produces: the running FastAPI app (`api.main.app`) with routes `GET /proposals`, `POST /allocate`, `POST /explain`, `POST /query`, `POST /intake`, `POST /summary` — this is the final integration point; nothing else depends on it.

**Design note:** the spec's `/intake` says "multipart with files OR JSON `{raw_text}`". To keep one clean endpoint signature, this task implements `raw_text` as an optional multipart **form field** alongside optional file uploads (both flow through `multipart/form-data`), rather than accepting a second content-type. This is a deliberate simplification, not a gap — both use cases (files, or a single pasted text block) are still fully supported.

- [ ] **Step 1: Write `api/data_loader.py`**

```python
# api/data_loader.py
import json
from functools import lru_cache
from pathlib import Path
from engine.models import Proposal, Region

DATA_DIR = Path(__file__).parent.parent / "data"


@lru_cache
def load_proposals() -> list[Proposal]:
    raw = json.loads((DATA_DIR / "proposals.json").read_text())
    return [Proposal(**p) for p in raw]


@lru_cache
def load_regions() -> dict[str, Region]:
    raw = json.loads((DATA_DIR / "regions.json").read_text())
    return {r["name"]: Region(**r) for r in raw}


@lru_cache
def load_objectives() -> dict:
    return json.loads((DATA_DIR / "objectives.json").read_text())
```

- [ ] **Step 2: Write `api/schemas.py`**

```python
# api/schemas.py
from pydantic import BaseModel
from engine.models import Weights, Constraints


class AllocateRequest(BaseModel):
    weights: Weights
    budget: float
    constraints: Constraints = Constraints()


class AllocationState(BaseModel):
    funded: list[str]
    spent: float


class ExplainRequest(BaseModel):
    project_id: str
    weights: Weights
    budget: float
    allocation_state: AllocationState


class QueryRequest(BaseModel):
    text: str


class SummaryRequest(BaseModel):
    totals: dict
    sector_split: dict
    concentration: float
```

- [ ] **Step 3: Write `api/main.py`**

```python
# api/main.py
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from engine.models import Weights, Constraints
from engine.scoring import score_proposals
from engine.solver import allocate_greedy, compute_totals
from engine.constraints import filter_proposals
from engine.counterfactual import rescue
from ai.explain import build_facts, explain_decision
from ai.nl_query import parse_nl_query
from ai.intake import extract_proposal
from ai.redflags import check_redflags
from ai.summary import generate_summary

from api.data_loader import load_proposals, load_regions, load_objectives
from api.schemas import AllocateRequest, ExplainRequest, QueryRequest, SummaryRequest

load_dotenv()

app = FastAPI(title="COMPASS Allocation API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _run_allocation(weights: Weights, budget: float, constraints: Constraints):
    proposals = load_proposals()
    regions = load_regions()
    focus_areas = load_objectives()["focus_areas"]
    filtered = filter_proposals(proposals, constraints)
    scores = score_proposals(filtered, regions, focus_areas, weights)
    funded, spent = allocate_greedy(filtered, scores, budget)
    funded_ids = {p.id for p in funded}
    unfunded = [p for p in filtered if p.id not in funded_ids]
    return compute_totals(funded, unfunded, spent, scores)


@app.get("/proposals")
def get_proposals():
    return [p.model_dump() for p in load_proposals()]


@app.post("/allocate")
def allocate(req: AllocateRequest):
    return _run_allocation(req.weights, req.budget, req.constraints)


@app.post("/explain")
def explain(req: ExplainRequest):
    proposals = {p.id: p for p in load_proposals()}
    regions = load_regions()
    focus_areas = load_objectives()["focus_areas"]
    filtered = list(proposals.values())
    scores = score_proposals(filtered, regions, focus_areas, req.weights)

    target = proposals[req.project_id]
    is_funded = req.project_id in req.allocation_state.funded
    rescue_data = None
    if not is_funded:
        funded_proposals = [proposals[pid] for pid in req.allocation_state.funded if pid in proposals]
        rescue_data = rescue(target, funded_proposals, scores, req.budget, req.allocation_state.spent)
        if rescue_data.get("type") != "swap":
            rescue_data = None

    facts = build_facts(
        target, regions[target.region], is_funded, scores, req.budget,
        req.allocation_state.spent, focus_areas, rescue=rescue_data,
    )
    reason = explain_decision(facts)
    return {
        "project_id": req.project_id,
        "status": facts["status"],
        "reason": reason,
        "rescue": rescue_data,
    }


@app.post("/query")
def query(req: QueryRequest):
    parsed = parse_nl_query(req.text)
    weights = Weights(**parsed["weights"])
    c = parsed["constraints"]
    constraints = Constraints(
        region=c.get("region"), sector=c.get("sector"), min_beneficiaries=c.get("min_beneficiaries"),
    )
    budget = c.get("budget_cap") or 50_000_000
    result = _run_allocation(weights, budget, constraints)
    return {
        "parsed_weights": parsed["weights"],
        "parsed_constraints": parsed["constraints"],
        "allocation": result,
    }


@app.post("/intake")
async def intake(
    files: list[UploadFile] | None = File(default=None),
    raw_text: str | None = Form(default=None),
):
    texts = []
    if files:
        for f in files:
            content = await f.read()
            texts.append(content.decode("utf-8", errors="ignore"))
    elif raw_text:
        texts.append(raw_text)

    extracted = []
    for i, text in enumerate(texts, start=1):
        data = extract_proposal(text, f"EX{i:03d}")
        data["redflags"] = check_redflags(data)
        extracted.append(data)
    return {"extracted": extracted}


@app.post("/summary")
def summary(req: SummaryRequest):
    text = generate_summary(req.model_dump())
    return {"summary": text}
```

- [ ] **Step 4: Write the test fixture that fakes GROQ_API_KEY for every api test**

```python
# tests/api/conftest.py
import pytest


@pytest.fixture(autouse=True)
def set_fake_groq_key(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
```

- [ ] **Step 5: Write the failing test**

```python
# tests/api/test_main.py
from unittest.mock import patch
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

WEIGHTS = {"impact": 0.3, "efficiency": 0.25, "equity": 0.2, "alignment": 0.15, "feasibility": 0.1}


def test_get_proposals_returns_45():
    resp = client.get("/proposals")
    assert resp.status_code == 200
    assert len(resp.json()) == 45


def test_allocate_returns_valid_shape_and_respects_budget():
    resp = client.post("/allocate", json={"weights": WEIGHTS, "budget": 10000000, "constraints": {}})
    assert resp.status_code == 200
    data = resp.json()
    assert data["totals"]["spent"] <= 10000000
    assert set(data.keys()) >= {
        "funded", "unfunded", "totals", "coverage", "concentration", "per_project_score", "sector_split",
    }


def test_allocate_is_deterministic():
    body = {"weights": WEIGHTS, "budget": 10000000, "constraints": {}}
    r1 = client.post("/allocate", json=body).json()
    r2 = client.post("/allocate", json=body).json()
    assert r1["funded"] == r2["funded"]


def test_explain_endpoint_mocked_groq():
    alloc = client.post("/allocate", json={"weights": WEIGHTS, "budget": 10000000, "constraints": {}}).json()
    project_id = alloc["funded"][0]
    with patch("api.main.explain_decision", return_value="Funded — good fit."):
        resp = client.post("/explain", json={
            "project_id": project_id,
            "weights": WEIGHTS,
            "budget": 10000000,
            "allocation_state": {"funded": alloc["funded"], "spent": alloc["totals"]["spent"]},
        })
        assert resp.status_code == 200
        assert resp.json()["status"] == "funded"
        assert resp.json()["reason"] == "Funded — good fit."


def test_query_endpoint_mocked_groq():
    fake_parsed = {
        "weights": {"impact": 0.3, "efficiency": 0.5, "equity": 0.1, "alignment": 0.05, "feasibility": 0.05},
        "constraints": {"region": None, "budget_cap": 5000000, "min_beneficiaries": None, "sector": None},
    }
    with patch("api.main.parse_nl_query", return_value=fake_parsed):
        resp = client.post("/query", json={"text": "cheapest way to reach 100k"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["parsed_constraints"]["budget_cap"] == 5000000
        assert "allocation" in data


def test_intake_endpoint_mocked_groq():
    with patch("api.main.extract_proposal", return_value={
        "id": "EX001", "title": "x", "sector": "education", "confidence": 0.9,
    }), patch("api.main.check_redflags", return_value=[]):
        resp = client.post("/intake", data={"raw_text": "some proposal text"})
        assert resp.status_code == 200
        assert resp.json()["extracted"][0]["id"] == "EX001"


def test_summary_endpoint_mocked_groq():
    with patch("api.main.generate_summary", return_value="A great portfolio."):
        resp = client.post("/summary", json={
            "totals": {"count": 5, "spent": 1000000, "beneficiaries": 5000, "states": 3},
            "sector_split": {"education": 2, "healthcare": 1, "environment": 1, "community": 1},
            "concentration": 0.3,
        })
        assert resp.status_code == 200
        assert resp.json()["summary"] == "A great portfolio."
```

- [ ] **Step 6: Run test to verify it fails**

Run: `pytest tests/api/test_main.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'api.main'` (or import errors for the not-yet-created modules)

- [ ] **Step 7: Run test to verify it passes**

(Implementation was written in Steps 1-3 above, ahead of the test, because the FastAPI app must exist as one coherent unit before it's testable — this task's TDD cycle is "write app + write tests together, then verify green," which is the correct adaptation for a wiring task with no isolated pure-function logic of its own.)

Run: `pytest tests/api/test_main.py -v`
Expected: 7 passed

- [ ] **Step 8: Run the full test suite**

Run: `pytest -v`
Expected: all tests across `tests/engine`, `tests/ai`, `tests/data`, `tests/api` pass (should be ~40 tests total).

- [ ] **Step 9: Smoke-test the running server**

```bash
uvicorn api.main:app --reload --port 8000
```

In another terminal: `curl http://localhost:8000/proposals` — expect a 200 with 45 proposals as JSON.

- [ ] **Step 10: Commit**

```bash
git add api/schemas.py api/data_loader.py api/main.py tests/api/conftest.py tests/api/test_main.py
git commit -m "feat: wire FastAPI endpoints for allocate/explain/query/intake/summary"
```

---

## After This Plan

Once all 15 tasks are green, the backend runs standalone via `uvicorn api.main:app --reload --port 8000` and serves everything the frontend's `web/src/api/` client (documented in `COMPASS_MASTER_REFERENCE.md`) expects. Remaining out-of-scope items, tracked as stretch work, not part of this plan:
- ILP/PuLP background reconciliation (Tier 2 solver)
- Wiring the actual React frontend against this API (frontend branch already exists separately)
- Combining backend + frontend into `main` (a merge, done via the git commands provided outside this plan — no git actions are taken by the assistant)
