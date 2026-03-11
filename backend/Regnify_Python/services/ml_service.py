import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import shap


class MLService:

    def __init__(self):

        self.model = None
        self.explainer = None

        self.train_model()

    # -------------------------------
    # SYNTHETIC DATA GENERATION
    # -------------------------------

    def generate_data(self):

        N = 3000

        data = pd.DataFrame({

            "completion_ratio": np.random.uniform(0.4, 1.0, N),
            "avg_delay_days": np.random.uniform(0, 10, N),
            "attendance_percent": np.random.uniform(55, 100, N),
            "escalation_count": np.random.randint(0, 6, N),
            "warning_count": np.random.randint(0, 4, N),
            "manager_rating": np.random.uniform(1, 5, N),
            "performance_trend": np.random.uniform(-1, 1, N),
            "task_consistency": np.random.uniform(0.3, 1.0, N)

        })

        # manager bias noise
        manager_noise = np.random.normal(0, 0.3, len(data))
        data["manager_rating"] = np.clip(data["manager_rating"] + manager_noise, 1, 5)

        # -----------------------
        # BASE RISK FORMULA
        # -----------------------

        risk = (
            (1 - data["completion_ratio"]) * 0.25 +
            (data["avg_delay_days"] / 10) * 0.15 +
            (1 - data["attendance_percent"] / 100) * 0.20 +
            (data["escalation_count"] / 5) * 0.15 +
            (data["warning_count"] / 3) * 0.10 +
            (1 - data["manager_rating"] / 5) * 0.05 +
            (-data["performance_trend"]) * 0.05 +
            (1 - data["task_consistency"]) * 0.05
        )

        # policy thresholds

        risk += np.where(data["attendance_percent"] < 70, 0.15, 0)
        risk += np.where(data["avg_delay_days"] > 6, 0.10, 0)
        risk += np.where(data["escalation_count"] > 3, 0.10, 0)
        risk += np.where(data["warning_count"] >= 2, 0.10, 0)

        # interaction effect

        interaction = np.where(
            (data["attendance_percent"] < 75) &
            (data["avg_delay_days"] > 5),
            0.10,
            0
        )

        risk += interaction

        # hidden factors

        hidden_risk = np.random.uniform(0, 0.15, len(data))
        risk += hidden_risk

        # behavioural noise

        noise = np.random.normal(0, 0.05, len(data))
        risk += noise

        # sigmoid probability

        risk_probability = 1 / (1 + np.exp(-5 * (risk - 0.5)))

        data["risk_probability"] = risk_probability

        # create label

        data["probation_fail"] = (risk_probability > 0.6).astype(int)

        return data

    # -------------------------------
    # TRAIN MODEL
    # -------------------------------

    def train_model(self):

        data = self.generate_data()

        X = data.drop(["probation_fail", "risk_probability"], axis=1)
        y = data["probation_fail"]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=0.2
        )

        self.model = RandomForestClassifier(
            n_estimators=200,
            max_depth=8,
            class_weight="balanced"
        )

        self.model.fit(X_train, y_train)

        self.explainer = shap.TreeExplainer(self.model)

    # -------------------------------
    # RISK FORMULA FOR NEW EMPLOYEE
    # -------------------------------

    def calculate_risk_probability(self, emp):

        completion_ratio = emp["completion_ratio"]
        avg_delay_days = emp["avg_delay_days"]
        attendance_percent = emp["attendance_percent"]
        escalation_count = emp["escalation_count"]
        warning_count = emp["warning_count"]
        manager_rating = emp["manager_rating"]
        performance_trend = emp["performance_trend"]
        task_consistency = emp["task_consistency"]

        risk = (
            (1 - completion_ratio) * 0.25 +
            (avg_delay_days / 10) * 0.15 +
            (1 - attendance_percent / 100) * 0.20 +
            (escalation_count / 5) * 0.15 +
            (warning_count / 3) * 0.10 +
            (1 - manager_rating / 5) * 0.05 +
            (-performance_trend) * 0.05 +
            (1 - task_consistency) * 0.05
        )

        # policy thresholds

        if attendance_percent < 70:
            risk += 0.15

        if avg_delay_days > 6:
            risk += 0.10

        if escalation_count > 3:
            risk += 0.10

        if warning_count >= 2:
            risk += 0.10

        # interaction effect

        if attendance_percent < 75 and avg_delay_days > 5:
            risk += 0.10

        # -----------------------
        # SAME RANDOM FACTORS AS TRAINING
        # -----------------------

        hidden_risk = np.random.uniform(0, 0.15)
        risk += hidden_risk

        noise = np.random.normal(0, 0.05)
        risk += noise

        # sigmoid probability

        risk_probability = 1 / (1 + np.exp(-5 * (risk - 0.5)))

        return risk_probability