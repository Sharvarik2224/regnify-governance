from pydantic import BaseModel

class EmployeeData(BaseModel):

    completion_ratio: float
    avg_delay_days: float
    attendance_percent: float
    escalation_count: int
    warning_count: int
    manager_rating: float
    performance_trend: float
    task_consistency: float

