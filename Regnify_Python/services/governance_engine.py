class GovernanceEngine:

    def manager_layer(self, ai_risk_level, manager_decision, justification):

        conflict = False
        justification_required = False
        justification_valid = True
        message = "Manager decision aligned with AI recommendation."

        # -----------------------------
        # CONFLICT RULES
        # -----------------------------

        if ai_risk_level == "HIGH" and manager_decision == "APPROVE":
            conflict = True

        if ai_risk_level == "LOW" and manager_decision == "TERMINATE":
            conflict = True

        if ai_risk_level == "MEDIUM" and manager_decision == "APPROVE":
            conflict = True

        # -----------------------------
        # JUSTIFICATION REQUIRED
        # -----------------------------

        if conflict:

            justification_required = True

            if justification is None or len(justification) < 15:

                justification_valid = False
                message = "Manager justification insufficient."

            else:

                justification_valid = True
                message = "Conflict detected but justification accepted."

        # -----------------------------
        # FINAL RESULT
        # -----------------------------

        result = {

            "ai_risk_level": ai_risk_level,
            "manager_decision": manager_decision,
            "conflict_detected": conflict,
            "justification_required": justification_required,
            "justification_valid": justification_valid,
            "manager_justification": justification,
            "message": message

        }

        return result