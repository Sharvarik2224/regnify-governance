import uuid

def create_case(employee_id):

    case_id = "REG-" + str(uuid.uuid4())[:8]

    case = {
        "case_id": case_id,
        "employee_id": employee_id,
        "status": "CREATED",
        "stage": "AI_EVALUATION"
    }

    return case