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
