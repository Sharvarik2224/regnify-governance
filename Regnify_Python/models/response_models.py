from pydantic import BaseModel
from typing import Dict, List


class PredictionSummary(BaseModel):
    confidence_level: str
    driver_count: int


class RiskDriver(BaseModel):
    factor: str
    impact: float
    direction: str


class Explainability(BaseModel):
    prediction_summary: PredictionSummary
    risk_drivers: List[RiskDriver]
    human_explanation_summary: str
    governance_note: str


class RiskResponse(BaseModel):

    risk_score: float
    risk_level: str

    top_risk_factors: Dict[str, float]

    explainability: Explainability