from pydantic import BaseModel
from typing import Dict, List

class RiskResponse(BaseModel):

    risk_score: float
    risk_level: str
    top_risk_factors: Dict[str,float]
    explanation_sentences: List[str]