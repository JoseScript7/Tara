"""
Tara — Autonomy Ladder, Escalation Router & Approvals (Prompt 16)

Governs the 3-tier autonomy ladder:
- Tier 1: Autonomous execution (diagnostics, resync, explanation, notification)
- Tier 2: Semi-autonomous execution requiring 1-click human approval
          (produces HMAC-SHA256 signed token verified by Core Mock)
- Tier 3: Mandatory human handover (generates full Case Brief)

Triggers for Level 3 Escalation:
1. Low confidence (< 0.70)
2. Unsourced compensation / missing policy citation
3. Fraud indicators / chargeback dispute
4. Repeated failure (> 2 attempts on same device)
5. Severe merchant frustration / legal sentiment
"""

import time
import uuid
import logging
from typing import Dict, Any, Optional, List, Tuple

from tools.typed_tools import PENDING_APPROVALS, RiskTier
from services.corebank_mock import generate_approval_token, issue_compensation, CompensationRequest
from agent.second_brain import get_second_brain, TeamMemoryLesson

logger = logging.getLogger("tara-autonomy")


class EscalationTrigger:
    LOW_CONFIDENCE = "LOW_CONFIDENCE"
    UNSOURCED_POLICY = "UNSOURCED_POLICY"
    FRAUD_SUSPICION = "FRAUD_SUSPICION"
    REPEATED_FAILURE = "REPEATED_FAILURE"
    MERCHANT_FRUSTRATION = "MERCHANT_FRUSTRATION"
    MONETARY_EXCEEDS_TIER1 = "MONETARY_EXCEEDS_TIER1"


class AutonomyLadder:
    def __init__(self):
        self.second_brain = get_second_brain()

    def evaluate_escalation(
        self,
        action_name: str,
        confidence: float,
        policy_citation: Optional[str],
        sentiment_score: float,
        failure_count: int,
        amount_inr: float = 0.0
    ) -> Tuple[RiskTier, Optional[str]]:
        """
        Evaluates risk tier and triggers.
        Returns (RiskTier, trigger_reason)
        """
        # Hard Rule 1: High sentiment anger / legal threat -> Tier 3
        if sentiment_score < -0.6:
            return RiskTier.TIER_3_HUMAN_HANDOVER, EscalationTrigger.MERCHANT_FRUSTRATION

        # Hard Rule 2: Repeated failure > 2 -> Tier 3
        if failure_count >= 2:
            return RiskTier.TIER_3_HUMAN_HANDOVER, EscalationTrigger.REPEATED_FAILURE

        # Hard Rule 3: Low confidence -> Tier 3
        if confidence < 0.70:
            return RiskTier.TIER_3_HUMAN_HANDOVER, EscalationTrigger.LOW_CONFIDENCE

        # Hard Rule 4: Money-moving actions
        if action_name in ["propose_compensation", "issue_compensation", "propose_reversal", "refund"]:
            # If no policy citation, cannot even propose Tier 2 -> MUST escalate to Tier 3!
            if not policy_citation or "UNKNOWN" in policy_citation:
                return RiskTier.TIER_3_HUMAN_HANDOVER, EscalationTrigger.UNSOURCED_POLICY

            if amount_inr > 1000:
                return RiskTier.TIER_3_HUMAN_HANDOVER, EscalationTrigger.MONETARY_EXCEEDS_TIER1

            return RiskTier.TIER_2_APPROVAL_REQUIRED, None

        # Tier 1 autonomous
        return RiskTier.TIER_1_AUTONOMOUS, None

    def build_case_brief(
        self,
        case_id: str,
        merchant_id: str,
        trigger: str,
        what_happened: str,
        what_tara_tried: List[str],
        evidence: Dict[str, Any],
        recommended_action: str
    ) -> Dict[str, Any]:
        """
        Builds a comprehensive case brief for Tier 3 human handover
        """
        merchant_mem = self.second_brain.get_merchant_memory(merchant_id)
        
        brief = {
            "brief_id": f"BRIEF-{uuid.uuid4().hex[:8].upper()}",
            "case_id": case_id,
            "merchant_id": merchant_id,
            "created_at": time.time(),
            "escalation_trigger": trigger,
            "executive_summary": what_happened,
            "tara_actions_attempted": what_tara_tried,
            "telemetry_and_cbs_evidence": evidence,
            "recommended_next_step": recommended_action,
            "merchant_profile": {
                "preferred_language": merchant_mem.language,
                "preferred_channel": merchant_mem.preferred_channel,
                "past_issues_count": len(merchant_mem.past_issues),
                "frustration_incidents": len(merchant_mem.frustration_history)
            },
            "status": "OPEN_IN_OPS_QUEUE"
        }
        return brief

    def ops_approve_and_execute(
        self,
        approval_id: str,
        ops_user_id: str = "OPS_LEAD_NEHA"
    ) -> Dict[str, Any]:
        """
        Ops one-click approval:
        1. Generates HMAC signed token
        2. Calls Core Mock with signed token to move funds
        3. Updates request status
        4. Writes a lesson to Team Memory in Second Brain
        """
        if approval_id not in PENDING_APPROVALS:
            raise KeyError(f"Approval request {approval_id} not found")

        req = PENDING_APPROVALS[approval_id]
        if req["status"] != "PENDING_APPROVAL":
            return {"status": "ALREADY_PROCESSED", "req": req}

        merchant_id = req["merchant_id"]
        amount = req["amount_inr"]

        # 1. Generate signed token
        signed_token = generate_approval_token(merchant_id, amount)
        req["signed_token"] = signed_token

        # 2. Call Core Mock
        cbs_req = CompensationRequest(
            merchant_id=merchant_id,
            amount_inr=amount,
            reason=req["reason"],
            policy_citation=req.get("policy_citation", "Ops Authorized Manual Waiver"),
            approval_token=signed_token,
            approved_by=ops_user_id,
            tat_hours_elapsed=req.get("tat_hours_elapsed", 26.0)
        )
        cbs_res = issue_compensation(cbs_req)

        # 3. Update status
        req["status"] = "APPROVED_AND_EXECUTED"
        req["approved_by"] = ops_user_id
        req["executed_at"] = time.time()
        req["payout_id"] = cbs_res.get("payout_id")

        # 4. Record lesson in Second Brain
        lesson = TeamMemoryLesson(
            id=f"LESSON-{uuid.uuid4().hex[:8].upper()}",
            trigger_context=f"Payout request for {merchant_id} due to {req['reason']}",
            resolution=f"Approved ₹{amount} compensation payout",
            outcome=f"Authorized by {ops_user_id} under {req.get('policy_citation')}",
            source="human_override",
            confidence=1.0,
            tags=[req["type"], "approved_payout"]
        )
        self.second_brain.record_lesson(lesson)

        return {
            "status": "SUCCESS",
            "approval_id": approval_id,
            "signed_token": signed_token,
            "cbs_confirmation": cbs_res
        }

    def ops_reject(
        self,
        approval_id: str,
        rejection_reason: str,
        ops_user_id: str = "OPS_LEAD_NEHA"
    ) -> Dict[str, Any]:
        """Ops one-click rejection: updates status and records negative feedback"""
        if approval_id not in PENDING_APPROVALS:
            raise KeyError(f"Approval request {approval_id} not found")

        req = PENDING_APPROVALS[approval_id]
        req["status"] = "REJECTED_BY_OPS"
        req["rejected_by"] = ops_user_id
        req["rejection_reason"] = rejection_reason
        req["rejected_at"] = time.time()

        # Record override lesson in Second Brain
        lesson = TeamMemoryLesson(
            id=f"LESSON-{uuid.uuid4().hex[:8].upper()}",
            trigger_context=f"Rejected payout request for {req['merchant_id']}",
            resolution="Rejected proposal",
            outcome=f"Rejected by {ops_user_id}: {rejection_reason}",
            source="human_override",
            confidence=1.0,
            tags=[req["type"], "rejected_payout"]
        )
        self.second_brain.record_lesson(lesson)


        return {
            "status": "REJECTED",
            "approval_id": approval_id,
            "reason": rejection_reason
        }


# Singleton
_autonomy_ladder_instance: Optional[AutonomyLadder] = None

def get_autonomy_ladder() -> AutonomyLadder:
    global _autonomy_ladder_instance
    if _autonomy_ladder_instance is None:
        _autonomy_ladder_instance = AutonomyLadder()
    return _autonomy_ladder_instance
