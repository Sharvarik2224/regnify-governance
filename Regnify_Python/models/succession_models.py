from pydantic import BaseModel
from typing import List


# ----------------------------------------
# Input employee metrics
# ----------------------------------------

class EmployeeMetrics(BaseModel):
    name: str
    completion_ratio: float
    avg_delay_days: float
    attendance_percent: float
    escalation_count: int
    warning_count: int
    manager_rating: float
    performance_trend: float
    task_consistency: float


# ----------------------------------------
# Request for generating succession pipeline
# ----------------------------------------

class PipelineRequest(BaseModel):
    role: str   # manager or site_head
    employees: List[EmployeeMetrics]


# ----------------------------------------
# Individual ranked candidate
# ----------------------------------------

class PipelineCandidate(BaseModel):
    rank: int
    name: str
    leadership_score: float
    succession_score: float
    track: str
    explanation: str


# ----------------------------------------
# Final pipeline response
# ----------------------------------------

class PipelineResponse(BaseModel):
    role_target: str
    pipeline: List[PipelineCandidate]