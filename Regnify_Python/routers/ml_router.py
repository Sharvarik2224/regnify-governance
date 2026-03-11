from fastapi import APIRouter
from models.request_models import EmployeeData
from models.response_models import RiskResponse
from services.ml_service import MLService
from services.xai_service import XAIService

import pandas as pd

router = APIRouter()

ml_service = MLService()
xai_service = XAIService()

@router.post("/predict-risk", response_model=RiskResponse)
def predict(employee: EmployeeData):

    emp_dict = employee.dict()

    # compute risk probability using same formula as colab

    risk_probability = ml_service.calculate_risk_probability(emp_dict)

    risk_score = round(risk_probability * 100, 2)

    if risk_score < 30:
        level = "LOW"
    elif risk_score < 65:
        level = "MEDIUM"
    else:
        level = "HIGH"

    df = pd.DataFrame([emp_dict])

    shap_values = ml_service.explainer.shap_values(df)

    if isinstance(shap_values, list):
        shap_vals = shap_values[1][0]
    else:
        shap_vals = shap_values[0, :, 1]

    factors, explainability = xai_service.explain(
        shap_vals,
        list(df.columns)
    )

    return {

        "risk_score": risk_score,
        "risk_level": level,
        "top_risk_factors": factors,
        "explainability": explainability
    }


