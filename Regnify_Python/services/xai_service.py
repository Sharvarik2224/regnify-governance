import pandas as pd


class XAIService:

    FEATURE_LABELS = {

        "completion_ratio": "task completion performance",
        "avg_delay_days": "task delay behaviour",
        "attendance_percent": "attendance record",
        "escalation_count": "number of escalations",
        "warning_count": "disciplinary warnings",
        "manager_rating": "manager evaluation",
        "performance_trend": "recent performance trend",
        "task_consistency": "task consistency"

    }

    # --------------------------------------------------
    # CONTEXTUAL EXPLANATION TEMPLATES
    # --------------------------------------------------

    FEATURE_CONTEXT = {

        "completion_ratio": {
            "increase": (
                "Lower task completion rates indicate productivity concerns "
                "and incomplete deliverables during the probation period."
            ),
            "decrease": (
                "Strong task completion performance indicates that assigned work "
                "is consistently being delivered on time."
            )
        },

        "avg_delay_days": {
            "increase": (
                "Frequent delays in task completion suggest reliability issues "
                "in meeting delivery timelines."
            ),
            "decrease": (
                "Low task delay patterns indicate that the employee is delivering "
                "assigned work within expected timelines."
            )
        },

        "attendance_percent": {
            "increase": (
                "Attendance levels below expected probation standards may reduce "
                "engagement and operational reliability."
            ),
            "decrease": (
                "Strong attendance consistency indicates reliable participation "
                "in assigned work responsibilities."
            )
        },

        "escalation_count": {
            "increase": (
                "Higher escalation frequency indicates operational or behavioural "
                "concerns requiring managerial attention."
            ),
            "decrease": (
                "Low escalation levels suggest stable task execution without "
                "significant operational conflicts."
            )
        },

        "warning_count": {
            "increase": (
                "Multiple disciplinary warnings indicate behavioural concerns "
                "during the probation evaluation period."
            ),
            "decrease": (
                "Minimal or no disciplinary warnings indicate stable professional "
                "conduct during probation."
            )
        },

        "manager_rating": {
            "increase": (
                "Lower manager evaluations suggest concerns in work quality "
                "or collaboration performance."
            ),
            "decrease": (
                "Strong manager evaluations indicate positive supervision feedback."
            )
        },

        "performance_trend": {
            "increase": (
                "Declining performance trends suggest reduced consistency "
                "in recent work output."
            ),
            "decrease": (
                "Improving performance trends indicate increasing stability "
                "in task delivery."
            )
        },

        "task_consistency": {
            "increase": (
                "Inconsistent task performance indicates variability "
                "in delivery quality."
            ),
            "decrease": (
                "High task consistency reflects stable and predictable "
                "performance behaviour."
            )
        }

    }

    # --------------------------------------------------
    # MAIN EXPLANATION ENGINE
    # --------------------------------------------------

    def explain(self, shap_values, feature_names):

        shap_series = pd.Series(
            shap_values,
            index=feature_names
        )

        # rank features by importance
        ranked = shap_series.abs().sort_values(ascending=False)

        top_features = ranked.head(3)

        risk_drivers = []
        explanations = []

        confidence_score = 0

        for feature in top_features.index:

            value = shap_series[feature]

            label = self.FEATURE_LABELS.get(feature, feature)

            direction = "risk_increase" if value > 0 else "risk_decrease"

            confidence_score += abs(value)

            # structured driver output
            risk_drivers.append({

                "factor": label,
                "impact": round(float(value), 4),
                "direction": direction

            })

            # contextual explanation
            context = self.FEATURE_CONTEXT.get(feature)

            if context:

                if value > 0:
                    explanation = (
                        f"{label.capitalize()} contributed to increasing the probation risk. "
                        f"{context['increase']}"
                    )
                else:
                    explanation = (
                        f"{label.capitalize()} helped reduce the overall probation risk. "
                        f"{context['decrease']}"
                    )

            else:

                # fallback explanation
                if value > 0:
                    explanation = (
                        f"{label.capitalize()} contributed to increasing the probation risk."
                    )
                else:
                    explanation = (
                        f"{label.capitalize()} helped reduce the overall probation risk."
                    )

            explanations.append(explanation)

        # --------------------------------------------------
        # CREATE SINGLE NARRATIVE EXPLANATION
        # --------------------------------------------------

        narrative_explanation = " ".join(explanations)

        # --------------------------------------------------
        # CONFIDENCE ESTIMATION
        # --------------------------------------------------

        if confidence_score > 0.30:
            confidence = "HIGH"
        elif confidence_score > 0.15:
            confidence = "MEDIUM"
        else:
            confidence = "LOW"

        # --------------------------------------------------
        # GOVERNANCE NOTE
        # --------------------------------------------------

        governance_note = (
            "The AI model identified the above performance indicators as the "
            "primary contributors influencing the probation risk assessment. "
            "These signals should be reviewed alongside managerial observations "
            "and organizational probation policies during the governance decision process."
        )

        explainability_output = {

            "prediction_summary": {

                "confidence_level": confidence,
                "driver_count": len(risk_drivers)

            },

            "risk_drivers": risk_drivers,

            "human_explanation_summary": narrative_explanation,

            "governance_note": governance_note

        }

        return top_features.to_dict(), explainability_output