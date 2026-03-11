from fastapi import APIRouter
from services.sitehead_governance_engine import SiteHeadGovernanceEngine

router = APIRouter()

engine = SiteHeadGovernanceEngine()


@router.post("/sitehead-review")
def sitehead_review(data: dict):

    ai_analysis = data["ai_analysis"]
    manager_review = data["manager_review"]
    hr_review = data["hr_review"]

    site_head_decision = data["site_head_decision"]

    hr_recommendation = hr_review["hr_recommendation"]
    governance_score = hr_review["governance_risk_score"]

    # -------------------------------
    # Conflict Detection
    # -------------------------------

    conflict = engine.detect_conflict(
        site_head_decision,
        hr_recommendation
    )

    # -------------------------------
    # Decision Routing
    # -------------------------------

    next_step = engine.route_decision(conflict)

    sitehead_report = {

        "decision": site_head_decision,
        "conflict_detected": conflict,
        "governance_risk_score": governance_score,
        "next_step": next_step

    }

    return {

        "ai_analysis": ai_analysis,
        "manager_review": manager_review,
        "hr_review": hr_review,
        "site_head_review": sitehead_report

    }