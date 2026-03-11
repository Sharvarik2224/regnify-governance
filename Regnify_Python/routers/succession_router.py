from fastapi import APIRouter
from models.succession_models import EmployeeMetrics, PipelineRequest
from services.succession_engine import SuccessionEngine

router = APIRouter()

engine = SuccessionEngine()


# ----------------------------------------
# Evaluate single employee
# ----------------------------------------

@router.post("/succession-evaluate")
def evaluate_successor(emp: EmployeeMetrics):

    emp_dict = emp.dict()

    leadership_score = engine.calculate_leadership_score(emp_dict)

    succession_score = engine.calculate_succession_score(
        leadership_score,
        emp_dict
    )

    track = engine.determine_role_target(leadership_score)

    explanation = engine.generate_explanation(emp_dict)

    return {
        "name": emp.name,
        "leadership_score": round(leadership_score, 3),
        "succession_score": round(succession_score, 3),
        "track": track,
        "explanation": explanation
    }


# ----------------------------------------
# Generate ranked succession pipeline
# ----------------------------------------

@router.post("/succession-pipeline")
def generate_pipeline(request: PipelineRequest):

    result = engine.generate_pipeline(
        request.employees,
        request.role
    )

    return result