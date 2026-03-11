class SiteHeadGovernanceEngine:

    # -------------------------------
    # Default decision suggestion
    # -------------------------------

    def suggested_decision(self, hr_recommendation):

        if hr_recommendation == "SAFE":
            return "APPROVE"

        if hr_recommendation == "REVIEW_REQUIRED":
            return "EXTEND_PROBATION"

        if hr_recommendation == "ESCALATE":
            return "TERMINATE"

        return "REVIEW"


    # -------------------------------
    # Conflict Detection
    # -------------------------------

    def detect_conflict(self, site_head_decision, hr_recommendation):

        conflict = False

        if hr_recommendation == "ESCALATE" and site_head_decision == "APPROVE":
            conflict = True

        if hr_recommendation == "SAFE" and site_head_decision == "TERMINATE":
            conflict = True

        if hr_recommendation == "REVIEW_REQUIRED" and site_head_decision == "APPROVE":
            conflict = True

        return conflict


    # -------------------------------
    # Decision Routing
    # -------------------------------

    def route_decision(self, conflict):

        if conflict:
            return "HR_RE_REVIEW"

        return "TRIGGER_DOCUMENTATION"