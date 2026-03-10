import pandas as pd


class XAIService:

    # Human readable feature labels
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

    def explain(self, shap_values, feature_names):

        shap_series = pd.Series(
            shap_values,
            index=feature_names
        )

        # Top 3 contributing factors
        top_features = shap_series.sort_values(
            ascending=False
        ).head(3)

        explanations = []

        for feature, value in top_features.items():

            label = self.FEATURE_LABELS.get(feature, feature)

            if value > 0:
                sentence = (
                    f"{label.capitalize()} increased the probation risk "
                    f"(impact: {round(value,3)})"
                )
            else:
                sentence = (
                    f"{label.capitalize()} helped reduce the probation risk "
                    f"(impact: {abs(round(value,3))})"
                )

            explanations.append(sentence)

        return top_features.to_dict(), explanations