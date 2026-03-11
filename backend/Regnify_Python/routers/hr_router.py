from fastapi import APIRouter
from services.hr_governance_engine import HRGovernanceEngine

router = APIRouter()

engine = HRGovernanceEngine()


@router.post("/hr-review")
def hr_review(data: dict):

    employee = data["employee_data"]

    ai_risk_level = data["ai_risk_level"]

    manager_conflict = data["manager_conflict"]

    manager_result = data["manager_result"]

    # --------------------------------
    # Evaluate HR policies
    # --------------------------------

    violations = engine.evaluate_policies(employee)

    # --------------------------------
    # Governance risk score
    # --------------------------------

    score = engine.compute_governance_score(
        ai_risk_level,
        manager_conflict,
        violations
    )

    recommendation = engine.hr_recommendation(score)

    # --------------------------------
    # HR review object
    # --------------------------------

    hr_report = {

        "policy_violations": violations,

        "violation_count": len(violations),

        "governance_risk_score": score,

        "hr_recommendation": recommendation,

        "next_step": "SITE_HEAD_REVIEW"

    }

    return {

        "ai_analysis": {
            "risk_level": ai_risk_level
        },

        "manager_review": manager_result,

        "hr_review": hr_report

    }