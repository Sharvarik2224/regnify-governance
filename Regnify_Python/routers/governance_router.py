from fastapi import APIRouter

from models.governance_models import (
    ManagerFeedback,
    JustificationSubmission
)

from services.manager_governance_engine import ManagerGovernanceEngine

router = APIRouter()

engine = ManagerGovernanceEngine()


# -----------------------------------
# 1 Manager Feedback API
# -----------------------------------

@router.post("/manager-feedback")
def manager_feedback(data: ManagerFeedback):

    conflict = engine.detect_conflict(
        data.ai_risk_level,
        data.manager_decision
    )

    return {

        "ai_risk_level": data.ai_risk_level,
        "manager_decision": data.manager_decision,

        "conflict_detected": conflict,

        "justification_required": conflict,

        "next_step": "JUSTIFICATION_REQUIRED"
        if conflict
        else "HR_REVIEW"

    }


# -----------------------------------
# 2 Justification Validation API
# -----------------------------------

@router.post("/submit-justification")
def submit_justification(data: JustificationSubmission):

    conflict = engine.detect_conflict(
        data.ai_risk_level,
        data.manager_decision
    )

    valid, score = engine.validate_justification(
        data.justification_text
    )

    evidence = engine.validate_evidence(
        data.attachments
    )

    result = engine.build_governance_result(

        data.ai_risk_level,
        data.manager_decision,
        conflict,
        valid,
        evidence,
        score
    )

    return result