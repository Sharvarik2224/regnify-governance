from fastapi import APIRouter

from models.governance_models import (
    ManagerFeedback,
    JustificationSubmission
)

from services.manager_governance_engine import ManagerGovernanceEngine


router = APIRouter()

engine = ManagerGovernanceEngine()


# --------------------------------------------------
# 1 Manager Feedback API
# --------------------------------------------------

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

        "next_step": (
            "JUSTIFICATION_REQUIRED"
            if conflict
            else "HR_REVIEW"
        )

    }


# --------------------------------------------------
# 2 Justification Strength Evaluation API
# --------------------------------------------------

@router.post("/submit-justification")
def submit_justification(data: JustificationSubmission):

    # Step 1: Detect conflict
    conflict = engine.detect_conflict(
        data.ai_risk_level,
        data.manager_decision
    )

    # Step 2: Evaluate justification strength
    score, strength, breakdown = engine.evaluate_justification_strength(
        data.justification_text,
        data.attachments,
        data.ai_risk_level   # ← REQUIRED CHANGE
    )

    # Step 3: Evidence presence
    evidence_provided = bool(data.attachments)

    # Step 4: Build governance decision
    result = engine.build_governance_result(

        data.ai_risk_level,
        data.manager_decision,
        conflict,
        score,
        strength,
        evidence_provided,
        breakdown

    )

    return result