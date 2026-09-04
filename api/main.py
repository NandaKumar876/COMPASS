import asyncio
import io
from typing import get_args

from fastapi import FastAPI, UploadFile, File, Form
from pypdf import PdfReader
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from engine.models import Weights, Constraints, Proposal, Sector
from engine.scoring import score_proposals
from engine.solver import allocate_greedy, compute_totals
from engine.constraints import filter_proposals
from engine.counterfactual import rescue
from ai.explain import build_facts, explain_decision
from ai.nl_query import parse_nl_query
from ai.intake import extract_proposal
from ai.redflags import check_redflags
from ai.summary import generate_summary

from api.data_loader import load_proposals, load_regions, load_objectives, add_proposal, next_extracted_id
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


def _extract_text(filename: str, content: bytes) -> str:
    if filename.lower().endswith(".pdf"):
        reader = PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    return content.decode("utf-8", errors="ignore")


KNOWN_SECTORS = set(get_args(Sector))


def _extracted_to_proposal(data: dict, regions: dict) -> Proposal | None:
    """Turn a loosely-typed Groq extraction into a valid, scorable Proposal,
    filling safe defaults for anything missing/unrecognized so a messy
    document can't crash the optimizer or corrupt the region/sector keys it
    depends on."""
    region_raw = (data.get("region") or "").strip()
    region = next((r for r in regions if r.lower() == region_raw.lower()), None)
    if region is None:
        region = next((r for r in regions if region_raw and region_raw.lower() in r.lower()), None)
    if region is None:
        region = sorted(regions.keys())[0]

    sector = data.get("sector") if data.get("sector") in KNOWN_SECTORS else "community"

    try:
        return Proposal(
            id=data["id"],
            title=data.get("title") or f"Untitled proposal ({data['id']})",
            partner=data.get("partner") or "Unknown partner",
            sector=sector,
            region=region,
            budget=data.get("budget") or 1_000_000.0,
            beneficiaries=data.get("beneficiaries") or 100,
            outcome_depth=data.get("outcome_depth") if data.get("outcome_depth") is not None else 0.5,
            expected_outcome=data.get("expected_outcome") or "Not specified",
            timeline_months=data.get("timeline_months"),
            partner_track_record=(
                data.get("partner_track_record") if data.get("partner_track_record") is not None else 0.5
            ),
            budget_realism=data.get("budget_realism") if data.get("budget_realism") is not None else 0.5,
            must_fund=False,
        )
    except Exception:
        return None


@app.post("/intake")
async def intake(
    files: list[UploadFile] | None = File(default=None),
    raw_text: str | None = Form(default=None),
):
    texts = []
    if files:
        for f in files:
            content = await f.read()
            texts.append(_extract_text(f.filename or "", content))
    elif raw_text:
        texts.append(raw_text)

    def process_one(proposal_id: str, text: str) -> dict:
        data = extract_proposal(text, proposal_id)
        data["redflags"] = check_redflags(data)
        return data

    ids = [next_extracted_id() for _ in texts]
    extracted = await asyncio.gather(
        *(asyncio.to_thread(process_one, pid, text) for pid, text in zip(ids, texts))
    )

    regions = load_regions()
    for data in extracted:
        proposal = _extracted_to_proposal(data, regions)
        if proposal is not None:
            add_proposal(proposal)

    return {"extracted": list(extracted)}


@app.post("/summary")
def summary(req: SummaryRequest):
    text = generate_summary(req.model_dump())
    return {"summary": text}
