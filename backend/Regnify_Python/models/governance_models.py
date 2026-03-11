from pydantic import BaseModel
from typing import List, Optional


class ManagerFeedback(BaseModel):

    ai_risk_level: str
    manager_decision: str
    manager_comment: Optional[str] = None
    confidence_score: float


class JustificationSubmission(BaseModel):

    ai_risk_level: str
    manager_decision: str

    justification_text: str

    attachments: List[str]


class GovernanceResult(BaseModel):

    ai_risk_level: str
    manager_decision: str

    conflict_detected: bool

    justification_required: bool
    justification_valid: bool

    evidence_provided: bool

    validation_score: float

    governance_status: str

    next_step: str