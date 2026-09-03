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
