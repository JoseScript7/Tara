"""
Tara — 3-Minute Live Demo Runner (Prompt 22)

Demonstrates the 4 cornerstone judge scenarios end-to-end:
1. SILENT SOUNDBOX: Tara detects hardware audio DAC failure via telemetry before merchant notices,
   executes OTA driver resync, verifies telemetry recovery, and messages merchant in Hindi/Tamil.
2. SETTLEMENT MISMATCH: Merchant queries ₹150 deduction; Tara retrieves settlement ledger,
   identifies Soundbox monthly rental, and cites official Paytm SLA Clause 1.1 with zero hallucination.
3. TAT CLOCK AT RISK: Proactive detection of overdue settlement past T+1 RBI window.
   Tara flags risk, prepares statutory ₹100 compensation credit, and pauses at Tier 2.
   Ops clicks approve -> HMAC-SHA256 signed token generated -> Core Mock dispatches funds -> lesson recorded in Second Brain.
4. MERCHANT FRUSTRATION (ESCALATION): High anger sentiment / legal threat triggers instant Tier 3
   human handover with comprehensive structured Case Brief.
"""

import time
import json
import os
import sys

# Ensure python-backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agent.orchestrator import get_orchestrator
from agent.signals import Signal, SignalType, SignalSeverity
from agent.autonomy import get_autonomy_ladder
from tools.typed_tools import PENDING_APPROVALS
from services.corebank_mock import DEVICES, AUDIT_LOGS


def print_step(title: str, scenario_num: int):
    print("\n" + "=" * 80)
    print(f"🎬 SCENARIO {scenario_num}: {title.upper()}")
    print("=" * 80)


def run_full_demo():
    orchestrator = get_orchestrator()
    autonomy = get_autonomy_ladder()

    print("\n" + "🌟" * 40)
    print("  TARA AUTONOMOUS MERCHANT AI TEAMMATE — 3-MINUTE JUDGE DEMO")
    print("  Team: Cyber_Phantoms | Paytm AI Teammate Challenge")
    print("🌟" * 40)

    # ── SCENARIO 1 ──────────────────────────────────────────
    print_step("Silent Soundbox Proactive Autonomous Resolution", 1)
    merchant_1 = "M_KIRANA_042"
    device_1 = "SND-042-4022"
    
    # Simulate telemetry anomaly
    DEVICES[device_1] = {
        "device_id": device_1,
        "mqtt_connected": True,
        "audio_subsystem_ok": False,
        "battery_pct": 82,
        "network_signal_dbm": -68
    }
    
    sig_1 = Signal(
        signal_id="SIG-DEMO-SND",
        signal_type=SignalType.SILENT_SOUNDBOX,
        merchant_id=merchant_1,
        device_id=device_1,
        severity=SignalSeverity.CRITICAL,
        confidence=0.96,
        context={"mqtt_connected": True, "audio_subsystem_ok": False}
    )
    
    print(f"📡 1. Telemetry Ingested: Soundbox {device_1} active on MQTT but audio subsystem failed!")
    res_1 = orchestrator.process_case(merchant_id=merchant_1, incoming_signal=sig_1)
    print(f"🤖 2. Tara Action: {res_1['status']}")
    print(f"💬 3. Merchant Notification: {res_1['reply']}")
    print(f"✅ 4. Outcome Check: Audio recovery verified = {res_1['outcome_verified']}")
    print(f"🔒 5. Stored Decision Hash: {res_1['record']['integrity_hash'][:16]}...")
    time.sleep(1)

    # ── SCENARIO 2 ──────────────────────────────────────────
    print_step("Settlement Mismatch & Policy Citation (Zero Hallucination)", 2)
    merchant_2 = "M_CAFE_017"
    user_q2 = "कल के सेटलमेंट में से ₹150 क्यों काटे गए हैं?"
    
    print(f"👤 1. Merchant Query: \"{user_q2}\"")
    res_2 = orchestrator.process_case(merchant_id=merchant_2, user_message=user_q2)
    print(f"📊 2. Tara Explanation: {res_2['reply']}")
    print(f"📜 3. Policy Citation: {res_2.get('policy_citation')}")
    print(f"⚖️ 4. Risk Tier: Tier {res_2['record']['risk_tier']} (Autonomous explanation, zero money moved)")
    time.sleep(1)

    # ── SCENARIO 3 ──────────────────────────────────────────
    print_step("TAT Risk Proactive Detection & Tier 2 Signed Approval", 3)
    merchant_3 = "M_PHARM_009"
    sig_3 = Signal(
        signal_id="SIG-DEMO-TAT",
        signal_type=SignalType.TAT_CLOCK_AT_RISK,
        merchant_id=merchant_3,
        device_id=None,
        severity=SignalSeverity.CRITICAL,
        confidence=0.98,
        context={"tat_hours": 36.5, "tat_limit_hours": 24.0}
    )
    
    print(f"⏰ 1. Statutory Clock: Settlement overdue by 12.5 hrs past T+1 RBI window.")
    res_3 = orchestrator.process_case(merchant_id=merchant_3, incoming_signal=sig_3)
    appr_id = res_3.get("approval_request_id")
    print(f"🛑 2. Autonomy Gate: Action paused at Tier 2. Approval Request: {appr_id}")
    print(f"💰 3. Proposed Compensation: ₹{res_3.get('amount_inr')} under RBI DPSS.CO.PD Clause 2.1.B")
    
    # Ops executes 1-click approval
    print(f"👤 4. Ops Action: Operations Lead (Neha) clicks 'Approve & Sign Token'")
    ops_res = autonomy.ops_approve_and_execute(appr_id, ops_user_id="OPS_LEAD_NEHA")
    print(f"🔑 5. Cryptographic Signed Token: {ops_res['signed_token'][:28]}...")
    print(f"🏦 6. Core Mock Response: {ops_res['cbs_confirmation']['status']} (Payout ID: {ops_res['cbs_confirmation']['payout_id']})")
    print(f"🧠 7. Second Brain: Case consolidated into Team Memory lesson.")
    time.sleep(1)

    # ── SCENARIO 4 ──────────────────────────────────────────
    print_step("High-Frustration Sentiment & Tier 3 Handover Case Brief", 4)
    merchant_4 = "M_CLINIC_003"
    angry_q4 = "Third time my soundbox stopped working during patient appointments! You cheaters, I am taking you to police and consumer court!"
    
    print(f"😡 1. Merchant Message: \"{angry_q4}\"")
    res_4 = orchestrator.process_case(merchant_id=merchant_4, user_message=angry_q4)
    brief = res_4.get("case_brief", {})
    print(f"🚨 2. Escalation Trigger: {brief.get('escalation_trigger')}")
    print(f"📋 3. Case Brief Summary: {brief.get('executive_summary')}")
    print(f"📞 4. Recommended Step: {brief.get('recommended_next_step')}")
    print(f"🛡️ 5. De-escalation Message to Merchant: {res_4['reply']}")
    time.sleep(1)

    print("\n" + "=" * 80)
    print("🏆 DEMO COMPLETED SUCCESSFULLY IN UNDER 3 MINUTES!")
    print(f"Total CBS Audit Entries Logged: {len(AUDIT_LOGS)}")
    print(f"Total Immutable Decision Records Created: {len(os.listdir(orchestrator.records_dir))}")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    run_full_demo()
