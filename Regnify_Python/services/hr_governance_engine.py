class HRGovernanceEngine:

    # -------------------------------------
    # Evaluate HR policy violations
    # -------------------------------------

    def evaluate_policies(self, employee):

        violations = []

        if employee["attendance_percent"] < 70:
            violations.append("LOW_ATTENDANCE")

        if employee["avg_delay_days"] > 6:
            violations.append("HIGH_DELAYS")

        if employee["escalation_count"] >= 3:
            violations.append("HIGH_ESCALATIONS")

        if employee["warning_count"] >= 2:
            violations.append("MULTIPLE_WARNINGS")

        return violations


    # -------------------------------------
    # Governance risk scoring
    # -------------------------------------

    def compute_governance_score(
        self,
        ai_risk_level,
        manager_conflict,
        policy_violations
    ):

        score = 0

        # AI severity
        if ai_risk_level == "HIGH":
            score += 2
        elif ai_risk_level == "MEDIUM":
            score += 1

        # Manager conflict
        if manager_conflict:
            score += 1

        # Policy violations
        score += len(policy_violations)

        return score


    # -------------------------------------
    # HR recommendation logic
    # -------------------------------------

    def hr_recommendation(self, score):

        if score < 3:
            return "SAFE"

        if score < 5:
            return "REVIEW_REQUIRED"

        return "ESCALATE"