from fastapi import FastAPI

from routers import ml_router
from routers import governance_router
from routers import hr_router
from routers import sitehead_router
from routers import orchestrator_router


app = FastAPI(
    title="Regnify AI Governance Engine"
)

@app.get("/")
def home():
    return {
        "message": "Regnify AI Governance Engine Running",
        "status": "OK"
    }

app.include_router(
    ml_router.router,
    prefix="/ml",
    tags=["ML Risk Engine"]
)


app.include_router(
    governance_router.router,
    prefix="/governance",
    tags=["Governance Engine"]
)

app.include_router(
    hr_router.router,
    prefix="/governance",
    tags=["HR Governance"]
)

app.include_router(
    sitehead_router.router,
    prefix="/governance",
    tags=["Site Head Governance"]
)

app.include_router(
    orchestrator_router.router,
    prefix="/governance",
    tags=["Governance Orchestrator"]
)