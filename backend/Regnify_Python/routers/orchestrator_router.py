from fastapi import APIRouter
from services.governance_orchestrator import GovernanceOrchestrator

router = APIRouter()

engine = GovernanceOrchestrator()


@router.post("/run-full-evaluation")
def run_full_evaluation(payload: dict):

    report = engine.run_pipeline(payload)

    return report