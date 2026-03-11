import re


class ManagerGovernanceEngine:

    # --------------------------------------------------
    # Conflict Detection
    # --------------------------------------------------

    def detect_conflict(self, ai_risk, manager_decision):

        if ai_risk == "HIGH" and manager_decision == "ACCEPT":
            return True

        if ai_risk == "LOW" and manager_decision == "REJECT":
            return True

        return False


    # --------------------------------------------------
    # JUSTIFICATION STRENGTH EVALUATION
    # --------------------------------------------------

    def evaluate_justification_strength(self, text, attachments, ai_risk):

        text = text.lower()

        score = 0
        score_breakdown = {}

        words = re.findall(r'\w+', text)
        total_words = max(len(words), 1)

        # --------------------------------------------------
        # 1 DETAIL DEPTH
        # --------------------------------------------------

        if total_words >= 30:
            detail_score = 0.25
        elif total_words >= 15:
            detail_score = 0.15
        else:
            detail_score = 0.05

        score += detail_score
        score_breakdown["detail_depth"] = round(detail_score, 2)

        # --------------------------------------------------
        # 2 PERFORMANCE CONTEXT DENSITY
        # --------------------------------------------------

        performance_keywords = [
            "project", "performance", "delivery",
            "client", "training", "improvement",
            "task", "learning", "deadline"
        ]

        context_hits = sum(
            words.count(keyword) for keyword in performance_keywords
        )

        density = context_hits / total_words

        if density > 0.12:
            context_score = 0.25
        elif density > 0.07:
            context_score = 0.18
        elif density > 0.03:
            context_score = 0.10
        else:
            context_score = 0.05

        score += context_score
        score_breakdown["performance_context_density"] = round(context_score, 2)

        # --------------------------------------------------
        # 3 AI AWARENESS DENSITY
        # --------------------------------------------------

        ai_keywords = [
            "attendance",
            "delay",
            "escalation",
            "warning",
            "task",
            "risk",
            "model",
            "prediction"
        ]

        ai_hits = sum(
            words.count(keyword) for keyword in ai_keywords
        )

        ai_density = ai_hits / total_words

        if ai_density > 0.10:
            ai_score = 0.25
        elif ai_density > 0.05:
            ai_score = 0.18
        elif ai_density > 0.02:
            ai_score = 0.10
        else:
            ai_score = 0.05

        score += ai_score
        score_breakdown["ai_awareness_density"] = round(ai_score, 2)

        # --------------------------------------------------
        # 4 EVIDENCE CREDIBILITY
        # --------------------------------------------------

        evidence_score = 0

        if attachments:

            evidence_type_score = 0
            content_match_score = 0

            for file in attachments:

                file_lower = file.lower()

                # Evidence Type Score
                if "github.com" in file_lower or "gitlab.com" in file_lower:
                    evidence_type_score += 0.25

                elif "dashboard" in file_lower or "deploy" in file_lower:
                    evidence_type_score += 0.22

                elif file_lower.endswith(".pdf"):
                    evidence_type_score += 0.20

                elif file_lower.endswith(".png") or file_lower.endswith(".jpg"):
                    evidence_type_score += 0.10

                else:
                    evidence_type_score += 0.08

                # Evidence content alignment
                for keyword in performance_keywords + ai_keywords:
                    if keyword in file_lower:
                        content_match_score += 0.05

            evidence_score = min(
                evidence_type_score + content_match_score,
                0.25
            )

        score += evidence_score
        score_breakdown["evidence_credibility"] = round(evidence_score, 2)

        # --------------------------------------------------
        # OVERRIDE RISK MULTIPLIER
        # --------------------------------------------------

        if ai_risk == "HIGH":
            multiplier = 1.25
        elif ai_risk == "MEDIUM":
            multiplier = 1.10
        else:
            multiplier = 1.0

        adjusted_score = min(score * multiplier, 1)

        score_breakdown["risk_multiplier"] = multiplier

        # --------------------------------------------------
        # CLASSIFICATION
        # --------------------------------------------------

        if adjusted_score >= 0.7:
            strength = "STRONG"
        elif adjusted_score >= 0.4:
            strength = "MODERATE"
        else:
            strength = "WEAK"

        return round(adjusted_score, 2), strength, score_breakdown


    # --------------------------------------------------
    # GOVERNANCE RESULT BUILDER
    # --------------------------------------------------

    def build_governance_result(

        self,
        ai_risk,
        manager_decision,
        conflict,
        score,
        strength,
        evidence_provided,
        score_breakdown

    ):

        if not conflict:

            return {

                "ai_risk_level": ai_risk,
                "manager_decision": manager_decision,

                "conflict_detected": False,

                "justification_required": False,
                "justification_strength": "NOT_REQUIRED",

                "evidence_provided": False,

                "validation_score": 1.0,

                "score_breakdown": {},

                "governance_status": "ALIGNED",

                "next_step": "HR_REVIEW"

            }

        if strength == "WEAK":

            return {

                "ai_risk_level": ai_risk,
                "manager_decision": manager_decision,

                "conflict_detected": True,

                "justification_required": True,
                "justification_strength": strength,

                "evidence_provided": evidence_provided,

                "validation_score": score,

                "score_breakdown": score_breakdown,

                "governance_status": "CONFLICT_WEAK_JUSTIFICATION",

                "next_step": "HOLD"

            }

        if not evidence_provided:

            return {

                "ai_risk_level": ai_risk,
                "manager_decision": manager_decision,

                "conflict_detected": True,

                "justification_required": True,
                "justification_strength": strength,

                "evidence_provided": False,

                "validation_score": score,

                "score_breakdown": score_breakdown,

                "governance_status": "PENDING_EVIDENCE",

                "next_step": "HOLD"

            }

        return {

            "ai_risk_level": ai_risk,
            "manager_decision": manager_decision,

            "conflict_detected": True,

            "justification_required": True,
            "justification_strength": strength,

            "evidence_provided": True,

            "validation_score": score,

            "score_breakdown": score_breakdown,

            "governance_status": "CONFLICT_RESOLVED",

            "next_step": "HR_REVIEW"

        }