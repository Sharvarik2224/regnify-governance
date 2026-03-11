import re


class ManagerGovernanceEngine:


    # ------------------------------
    # Conflict Detection
    # ------------------------------

    def detect_conflict(self, ai_risk, manager_decision):

        if ai_risk == "HIGH" and manager_decision == "ACCEPT":
            return True

        if ai_risk == "LOW" and manager_decision == "REJECT":
            return True

        return False


    # ------------------------------
    # Justification Validation
    # ------------------------------

    def validate_justification(self, text):

        score = 0

        words = text.split()

        # Rule 1: minimum detail
        if len(words) >= 20:
            score += 0.4

        # Rule 2: performance context keywords
        performance_keywords = [
            "project", "performance", "delivery",
            "client", "improvement", "training",
            "task", "learning"
        ]

        if any(word in text.lower() for word in performance_keywords):
            score += 0.3

        # Rule 3: AI factor reference
        ai_factors = [
            "attendance", "delay", "escalation",
            "warning", "task"
        ]

        if any(word in text.lower() for word in ai_factors):
            score += 0.3

        valid = score >= 0.6

        return valid, round(score, 2)


    # ------------------------------
    # Attachment Validation
    # ------------------------------

    def validate_evidence(self, attachments):

        if attachments and len(attachments) > 0:
            return True

        return False


    # ------------------------------
    # Final Governance Object
    # ------------------------------

    def build_governance_result(
        self,
        ai_risk,
        manager_decision,
        conflict,
        justification_valid,
        evidence_provided,
        score
    ):

        if not conflict:

            return {
                "ai_risk_level": ai_risk,
                "manager_decision": manager_decision,
                "conflict_detected": False,
                "justification_required": False,
                "justification_valid": True,
                "evidence_provided": False,
                "validation_score": 1.0,
                "governance_status": "ALIGNED",
                "next_step": "HR_REVIEW"
            }

        if not justification_valid:

            return {
                "ai_risk_level": ai_risk,
                "manager_decision": manager_decision,
                "conflict_detected": True,
                "justification_required": True,
                "justification_valid": False,
                "evidence_provided": evidence_provided,
                "validation_score": score,
                "governance_status": "CONFLICT_INVALID",
                "next_step": "HOLD"
            }

        if not evidence_provided:

            return {
                "ai_risk_level": ai_risk,
                "manager_decision": manager_decision,
                "conflict_detected": True,
                "justification_required": True,
                "justification_valid": True,
                "evidence_provided": False,
                "validation_score": score,
                "governance_status": "CONFLICT_PENDING_EVIDENCE",
                "next_step": "HOLD"
            }

        return {
            "ai_risk_level": ai_risk,
            "manager_decision": manager_decision,
            "conflict_detected": True,
            "justification_required": True,
            "justification_valid": True,
            "evidence_provided": True,
            "validation_score": score,
            "governance_status": "CONFLICT_RESOLVED",
            "next_step": "HR_REVIEW"
        }