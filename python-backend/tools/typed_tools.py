"""
Tara — Typed Tools Interface for Core Mock & Switches (Prompt 14)

All tools declare:
- risk_tier: 1 (Autonomous), 2 (Human Approval Required), 3 (Mandatory Handover)
- reversibility: REVERSIBLE, IRREVERSIBLE, NOT_APPLICABLE
- required_permissions: e.g. ["device:read"], ["money:move"], ["ticket:create"]
- audit_logged: True

MONEY-MOVING ACTIONS CANNOT EXECUTE WITHOUT RECORDED HUMAN APPROVAL.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List, Callable
from enum import Enum
import time
import uuid
import logging

from agent.policy_rag import get_policy_rag
from services.corebank_mock import (
    get_device_status as cbs_get_device_status,
    resync_device_config as cbs_resync_device_config,
    book_replacement as cbs_book_replacement,
    issue_compensation as cbs_issue_compensation,
    process_refund as cbs_process_refund,
    raise_dispute as cbs_raise_dispute,
    get_merchant_ledger as cbs_get_merchant_ledger,
    CompensationRequest, ReplacementRequest, ResyncRequest, DisputeRequest, RefundRequest,
    generate_approval_token
)

logger = logging.getLogger("tara-tools")


class RiskTier(int, Enum):
    TIER_1_AUTONOMOUS = 1
    TIER_2_APPROVAL_REQUIRED = 2
    TIER_3_HUMAN_HANDOVER = 3


class Reversibility(str, Enum):
    REVERSIBLE = "REVERSIBLE"
    IRREVERSIBLE = "IRREVERSIBLE"
    READ_ONLY = "READ_ONLY"
    NOT_APPLICABLE = "NOT_APPLICABLE"



@dataclass
class ToolExecutionResult:
    tool_name: str
    status: str  # SUCCESS, APPROVAL_PENDING, ESCALATED, FAILED
    risk_tier: RiskTier
    reversibility: Reversibility
    data: Dict[str, Any]
    audit_id: str
    requires_approval: bool = False
    approval_request_id: Optional[str] = None
    policy_citation: Optional[str] = None


# In-memory approval requests store
PENDING_APPROVALS: Dict[str, Dict[str, Any]] = {}
AUDIT_TRAIL: List[Dict[str, Any]] = []


def record_audit(tool_name: str, args: Dict[str, Any], result: str, tier: RiskTier):
    audit_entry = {
        "audit_id": f"AUDIT-{uuid.uuid4().hex[:10].upper()}",
        "timestamp": time.time(),
        "tool": tool_name,
        "risk_tier": tier.value,
        "args": args,
        "result_status": result
    }
    AUDIT_TRAIL.append(audit_entry)
    return audit_entry["audit_id"]


# ─── Tool 1: get_device_status (Tier 1) ─────────────────
def tool_get_device_status(device_id: str) -> ToolExecutionResult:
    data = cbs_get_device_status(device_id)
    aid = record_audit("get_device_status", {"device_id": device_id}, "SUCCESS", RiskTier.TIER_1_AUTONOMOUS)
    return ToolExecutionResult(
        tool_name="get_device_status",
        status="SUCCESS",
        risk_tier=RiskTier.TIER_1_AUTONOMOUS,
        reversibility=Reversibility.READ_ONLY,
        data=data,
        audit_id=aid
    )


# ─── Tool 2: run_device_diagnostic (Tier 1) ─────────────
def tool_run_device_diagnostic(device_id: str) -> ToolExecutionResult:
    status = cbs_get_device_status(device_id)
    diagnostic = {
        "device_id": device_id,
        "gsm_signal_strength": status.get("network_signal_dbm", -74),
        "battery_health": "OPTIMAL" if status.get("battery_pct", 80) > 30 else "LOW",
        "mqtt_socket_alive": status.get("mqtt_connected", True),
        "audio_codec_driver_healthy": status.get("audio_subsystem_ok", True),
        "recommended_action": "OTA_RESYNC" if not status.get("audio_subsystem_ok", True) else "NO_ACTION"
    }
    aid = record_audit("run_device_diagnostic", {"device_id": device_id}, "SUCCESS", RiskTier.TIER_1_AUTONOMOUS)
    return ToolExecutionResult(
        tool_name="run_device_diagnostic",
        status="SUCCESS",
        risk_tier=RiskTier.TIER_1_AUTONOMOUS,
        reversibility=Reversibility.READ_ONLY,
        data=diagnostic,
        audit_id=aid
    )


# ─── Tool 3: resync_device_config (Tier 1) ──────────────
def tool_resync_device_config(device_id: str) -> ToolExecutionResult:
    req = ResyncRequest(device_id=device_id, mqtt_resync=True, audio_resync=True)
    res = cbs_resync_device_config(device_id, req)
    aid = record_audit("resync_device_config", {"device_id": device_id}, "SUCCESS", RiskTier.TIER_1_AUTONOMOUS)
    return ToolExecutionResult(
        tool_name="resync_device_config",
        status="SUCCESS",
        risk_tier=RiskTier.TIER_1_AUTONOMOUS,
        reversibility=Reversibility.REVERSIBLE,
        data=res,
        audit_id=aid
    )


# ─── Tool 4: book_technician (Tier 1) ───────────────────
def tool_book_technician(merchant_id: str, device_id: str, reason: str, pincode: str = "110001") -> ToolExecutionResult:
    req = ReplacementRequest(
        device_id=device_id,
        merchant_id=merchant_id,
        reason=reason,
        delivery_pincode=pincode,
        urgency="EXPRESS"
    )
    res = cbs_book_replacement(device_id, req)
    aid = record_audit("book_technician", {"merchant_id": merchant_id, "device_id": device_id}, "SUCCESS", RiskTier.TIER_1_AUTONOMOUS)
    return ToolExecutionResult(
        tool_name="book_technician",
        status="SUCCESS",
        risk_tier=RiskTier.TIER_1_AUTONOMOUS,
        reversibility=Reversibility.REVERSIBLE,
        data=res,
        audit_id=aid
    )


# ─── Tool 5: send_merchant_message (Tier 1) ─────────────
def tool_send_merchant_message(merchant_id: str, message_text: str, language: str = "hi") -> ToolExecutionResult:
    aid = record_audit("send_merchant_message", {"merchant_id": merchant_id, "lang": language}, "SUCCESS", RiskTier.TIER_1_AUTONOMOUS)
    return ToolExecutionResult(
        tool_name="send_merchant_message",
        status="SUCCESS",
        risk_tier=RiskTier.TIER_1_AUTONOMOUS,
        reversibility=Reversibility.NOT_APPLICABLE,
        data={"sent": True, "merchant_id": merchant_id, "message": message_text, "lang": language},
        audit_id=aid
    )


# ─── Tool 6: get_settlement_breakdown (Tier 1) ──────────
def tool_get_settlement_breakdown(merchant_id: str) -> ToolExecutionResult:
    ledger = cbs_get_merchant_ledger(merchant_id)
    aid = record_audit("get_settlement_breakdown", {"merchant_id": merchant_id}, "SUCCESS", RiskTier.TIER_1_AUTONOMOUS)
    return ToolExecutionResult(
        tool_name="get_settlement_breakdown",
        status="SUCCESS",
        risk_tier=RiskTier.TIER_1_AUTONOMOUS,
        reversibility=Reversibility.READ_ONLY,
        data=ledger,
        audit_id=aid
    )


# ─── Tool 7: check_tat_clock (Tier 1) ───────────────────
def tool_check_tat_clock(transaction_or_settlement_id: str, elapsed_hours: float) -> ToolExecutionResult:
    tat_limit = 24.0  # T+1 RBI Harmonisation limit
    overdue = elapsed_hours > tat_limit
    hours_over = max(0.0, elapsed_hours - tat_limit)
    aid = record_audit("check_tat_clock", {"id": transaction_or_settlement_id, "elapsed": elapsed_hours}, "SUCCESS", RiskTier.TIER_1_AUTONOMOUS)
    return ToolExecutionResult(
        tool_name="check_tat_clock",
        status="SUCCESS",
        risk_tier=RiskTier.TIER_1_AUTONOMOUS,
        reversibility=Reversibility.READ_ONLY,
        data={
            "id": transaction_or_settlement_id,
            "elapsed_hours": elapsed_hours,
            "tat_limit_hours": tat_limit,
            "is_overdue": overdue,
            "hours_overdue": round(hours_over, 1),
            "statutory_compensation_per_day_inr": 100.0,
            "policy_rule": "RBI/2019-20/67 DPSS.CO.PD Clause 2.1.B"
        },
        audit_id=aid
    )


# ─── Tool 8: propose_compensation (Tier 2: Approval Required) ───
def tool_propose_compensation(
    merchant_id: str,
    amount_inr: float,
    reason: str,
    policy_citation: Optional[str] = None
) -> ToolExecutionResult:
    """
    CRITICAL TIER 2 TOOL: Does NOT disburse money directly.
    Creates an Ops Approval Request with policy verification.
    """
    rag = get_policy_rag()
    
    # Verify policy backing
    if not policy_citation:
        check = rag.verify_compensation_claim(reason, amount_inr)
        if not check["valid"]:
            aid = record_audit("propose_compensation", {"merchant_id": merchant_id, "amount": amount_inr}, "UNSOURCED_REJECTED", RiskTier.TIER_2_APPROVAL_REQUIRED)
            return ToolExecutionResult(
                tool_name="propose_compensation",
                status="ESCALATED",
                risk_tier=RiskTier.TIER_3_HUMAN_HANDOVER,
                reversibility=Reversibility.IRREVERSIBLE,
                requires_approval=False,
                data={
                    "error": "UNSOURCED_COMPENSATION_VIOLATION",
                    "reason": "Compensation amount has no verifiable regulatory policy chunk.",
                    "action_taken": "Escalated to human supervisor without commitment."
                },
                audit_id=aid
            )
        policy_citation = check["citation"]

    # Generate approval request ID
    req_id = f"APPR-COMP-{uuid.uuid4().hex[:8].upper()}"
    approval_obj = {
        "approval_id": req_id,
        "type": "COMPENSATION_PAYOUT",
        "merchant_id": merchant_id,
        "amount_inr": amount_inr,
        "reason": reason,
        "policy_citation": policy_citation,
        "status": "PENDING_APPROVAL",
        "created_at": time.time(),
        "signed_token": None
    }
    PENDING_APPROVALS[req_id] = approval_obj
    aid = record_audit("propose_compensation", {"req_id": req_id, "amount": amount_inr}, "APPROVAL_PENDING", RiskTier.TIER_2_APPROVAL_REQUIRED)

    return ToolExecutionResult(
        tool_name="propose_compensation",
        status="APPROVAL_PENDING",
        risk_tier=RiskTier.TIER_2_APPROVAL_REQUIRED,
        reversibility=Reversibility.IRREVERSIBLE,
        requires_approval=True,
        approval_request_id=req_id,
        policy_citation=policy_citation,
        data={
            "approval_request_id": req_id,
            "merchant_id": merchant_id,
            "amount_inr": amount_inr,
            "policy_citation": policy_citation,
            "notice": "Money-moving action paused. Requires Ops click-to-approve token."
        },
        audit_id=aid
    )


# ─── Tool 9: propose_reversal (Tier 2) ───────────────────
def tool_propose_reversal(
    transaction_id: str,
    merchant_id: str,
    amount_inr: float,
    reason: str
) -> ToolExecutionResult:
    req_id = f"APPR-REV-{uuid.uuid4().hex[:8].upper()}"
    approval_obj = {
        "approval_id": req_id,
        "type": "CUSTOMER_REVERSAL",
        "transaction_id": transaction_id,
        "merchant_id": merchant_id,
        "amount_inr": amount_inr,
        "reason": reason,
        "policy_citation": "[NPCI/UPI/OC-89/2021-22] UDIR Clause 1.1 Duplicate Reversal",
        "status": "PENDING_APPROVAL",
        "created_at": time.time()
    }
    PENDING_APPROVALS[req_id] = approval_obj
    aid = record_audit("propose_reversal", {"req_id": req_id, "amount": amount_inr}, "APPROVAL_PENDING", RiskTier.TIER_2_APPROVAL_REQUIRED)

    return ToolExecutionResult(
        tool_name="propose_reversal",
        status="APPROVAL_PENDING",
        risk_tier=RiskTier.TIER_2_APPROVAL_REQUIRED,
        reversibility=Reversibility.IRREVERSIBLE,
        requires_approval=True,
        approval_request_id=req_id,
        data={
            "approval_request_id": req_id,
            "transaction_id": transaction_id,
            "amount_inr": amount_inr,
            "notice": "Reversal prepared. Awaiting ops approval."
        },
        audit_id=aid
    )


# ─── Tool 10: raise_dispute (Tier 1) ────────────────────
def tool_raise_dispute(transaction_id: str, merchant_id: str, amount_inr: float, dispute_type: str) -> ToolExecutionResult:
    req = DisputeRequest(
        transaction_id=transaction_id,
        merchant_id=merchant_id,
        dispute_type=dispute_type,
        amount_inr=amount_inr
    )
    res = cbs_raise_dispute(req)
    aid = record_audit("raise_dispute", {"transaction_id": transaction_id}, "SUCCESS", RiskTier.TIER_1_AUTONOMOUS)
    return ToolExecutionResult(
        tool_name="raise_dispute",
        status="SUCCESS",
        risk_tier=RiskTier.TIER_1_AUTONOMOUS,
        reversibility=Reversibility.REVERSIBLE,
        data=res,
        audit_id=aid
    )


# ─── Tool 11: close_case (Tier 1) ───────────────────────
def tool_close_case(case_id: str, resolution_summary: str, outcome_verified: bool) -> ToolExecutionResult:
    if not outcome_verified:
        raise ValueError("Cannot close case without verified telemetry or settlement recovery.")

    aid = record_audit("close_case", {"case_id": case_id, "verified": outcome_verified}, "SUCCESS", RiskTier.TIER_1_AUTONOMOUS)
    return ToolExecutionResult(
        tool_name="close_case",
        status="SUCCESS",
        risk_tier=RiskTier.TIER_1_AUTONOMOUS,
        reversibility=Reversibility.NOT_APPLICABLE,
        data={"case_id": case_id, "closed": True, "summary": resolution_summary},
        audit_id=aid
    )


# ─── Tool 12: escalate_to_human (Tier 3) ────────────────
def tool_escalate_to_human(case_brief: Dict[str, Any]) -> ToolExecutionResult:
    aid = record_audit("escalate_to_human", {"brief_id": case_brief.get("case_id")}, "ESCALATED", RiskTier.TIER_3_HUMAN_HANDOVER)
    return ToolExecutionResult(
        tool_name="escalate_to_human",
        status="ESCALATED",
        risk_tier=RiskTier.TIER_3_HUMAN_HANDOVER,
        reversibility=Reversibility.NOT_APPLICABLE,
        data={
            "escalated": True,
            "case_brief": case_brief,
            "routing": "OPS_TIER_3_SUPERVISOR_QUEUE"
        },
        audit_id=aid
    )
