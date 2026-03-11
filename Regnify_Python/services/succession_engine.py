class SuccessionEngine:

    # ---------------------------------------
    # Leadership score
    # ---------------------------------------

    def calculate_leadership_score(self, emp):

        weights = {
            "manager_rating": 0.30,
            "completion_ratio": 0.20,
            "task_consistency": 0.15,
            "performance_trend": 0.10,
            "attendance_percent": 0.10,
            "escalation_count": -0.10,
            "warning_count": -0.05
        }

        score = (
            emp["manager_rating"] * weights["manager_rating"] +
            emp["completion_ratio"] * weights["completion_ratio"] +
            emp["task_consistency"] * weights["task_consistency"] +
            emp["performance_trend"] * weights["performance_trend"] +
            (emp["attendance_percent"] / 100) * weights["attendance_percent"] +
            emp["escalation_count"] * weights["escalation_count"] +
            emp["warning_count"] * weights["warning_count"]
        )

        score = max(0, min(1, score))

        return score

    # ---------------------------------------
    # Succession score
    # ---------------------------------------

    def calculate_succession_score(self, leadership_score, emp):

        score = (
            leadership_score * 0.5 +
            emp["completion_ratio"] * 0.3 +
            (emp["manager_rating"] / 5) * 0.2
        )

        return score

    # ---------------------------------------
    # Determine intended role track
    # ---------------------------------------

    def determine_role_target(self, leadership_score):

        if leadership_score > 0.75:
            return "Site Head Track"

        elif leadership_score > 0.60:
            return "Manager Track"

        else:
            return "Individual Contributor Track"

    # ---------------------------------------
    # Explainable reasoning
    # ---------------------------------------

    def generate_explanation(self, emp):

        reasons = []

        if emp["manager_rating"] >= 4.5:
            reasons.append("Strong leadership rating")

        if emp["completion_ratio"] > 0.85:
            reasons.append("Excellent task completion")

        if emp["task_consistency"] > 0.75:
            reasons.append("High work consistency")

        if emp["performance_trend"] > 0.3:
            reasons.append("Improving performance trend")

        if emp["escalation_count"] > 2:
            reasons.append("Higher escalation history")

        if emp["warning_count"] > 0:
            reasons.append("Governance warnings present")

        if len(reasons) == 0:
            reasons.append("Balanced performance signals")

        return ", ".join(reasons)

    # ---------------------------------------
    # Generate ranked succession pipeline
    # ---------------------------------------

    def generate_pipeline(self, employees, role):

        results = []

        for emp in employees:

            emp_dict = emp.dict()

            leadership_score = self.calculate_leadership_score(emp_dict)

            succession_score = self.calculate_succession_score(
                leadership_score,
                emp_dict
            )

            track = self.determine_role_target(leadership_score)

            explanation = self.generate_explanation(emp_dict)

            results.append({
                "name": emp.name,
                "leadership_score": round(leadership_score, 3),
                "succession_score": round(succession_score, 3),
                "track": track,
                "explanation": explanation
            })

        # sort by score

        results = sorted(
            results,
            key=lambda x: x["succession_score"],
            reverse=True
        )

        # assign ranks

        for i, emp in enumerate(results):
            emp["rank"] = i + 1

        return {
            "role_target": role,
            "pipeline": results
        }