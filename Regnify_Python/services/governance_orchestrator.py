from services.ml_service import MLService
from services.xai_service import XAIService
from services.manager_governance_engine import ManagerGovernanceEngine
from services.hr_governance_engine import HRGovernanceEngine
from services.sitehead_governance_engine import SiteHeadGovernanceEngine
import pandas as pd


class GovernanceOrchestrator:

    def __init__(self):

        self.ml_service = MLService()
        self.xai_service = XAIService()
        self.manager_engine = ManagerGovernanceEngine()
        self.hr_engine = HRGovernanceEngine()
        self.sitehead_engine = SiteHeadGovernanceEngine()

    # ---------------------------------
    # FULL PIPELINE
    # ---------------------------------

    def run_pipeline(self, payload):

        employee = payload["employee_data"]
        manager_decision = payload["manager_decision"]
        justification_text = payload.get("justification_text", "")
        attachments = payload.get("attachments", [])
        site_head_decision = payload["site_head_decision"]

        # --------------------------------
        # STEP 1 AI RISK
        # --------------------------------

        risk_probability = self.ml_service.calculate_risk_probability(employee)

        risk_score = round(risk_probability * 100, 2)

        if risk_score < 30:
            risk_level = "LOW"
        elif risk_score < 65:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"

        df = pd.DataFrame([employee])

        shap_values = self.ml_service.explainer.shap_values(df)

        if isinstance(shap_values, list):
            shap_vals = shap_values[1][0]
        else:
            shap_vals = shap_values[0, :, 1]

        factors, explanations = self.xai_service.explain(
            shap_vals,
            list(df.columns)
        )

        ai_report = {

            "risk_score": risk_score,
            "risk_level": risk_level,
            "top_risk_factors": factors,
            "explanations": explanations

        }

        # --------------------------------
        # STEP 2 MANAGER GOVERNANCE
        # --------------------------------

        conflict = self.manager_engine.detect_conflict(
            risk_level,
            manager_decision
        )

        justification_valid = False
        evidence_provided = False
        validation_score = 0

        if conflict:

            justification_valid, validation_score = \
                self.manager_engine.validate_justification(
                    justification_text
                )

            evidence_provided = \
                self.manager_engine.validate_evidence(
                    attachments
                )

        manager_report = {

            "decision": manager_decision,
            "conflict_detected": conflict,
            "justification_valid": justification_valid,
            "evidence_provided": evidence_provided,
            "validation_score": validation_score

        }

        # --------------------------------
        # STEP 3 HR GOVERNANCE
        # --------------------------------

        violations = self.hr_engine.evaluate_policies(employee)

        governance_score = self.hr_engine.compute_governance_score(
            risk_level,
            conflict,
            violations
        )

        hr_recommendation = self.hr_engine.hr_recommendation(
            governance_score
        )

        hr_report = {

            "policy_violations": violations,
            "violation_count": len(violations),
            "governance_risk_score": governance_score,
            "hr_recommendation": hr_recommendation

        }

        # --------------------------------
        # STEP 4 SITE HEAD GOVERNANCE
        # --------------------------------

        conflict_sitehead = self.sitehead_engine.detect_conflict(
            site_head_decision,
            hr_recommendation
        )

        next_step = self.sitehead_engine.route_decision(
            conflict_sitehead
        )

        sitehead_report = {

            "decision": site_head_decision,
            "conflict_detected": conflict_sitehead,
            "next_step": next_step

        }

        # --------------------------------
        # FINAL REPORT
        # --------------------------------

        governance_report = {

            "ai_analysis": ai_report,

            "manager_review": manager_report,

            "hr_review": hr_report,

            "site_head_review": sitehead_report

        }

        return governance_report