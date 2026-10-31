"""
Tara v2 Invariant Tests - Single Source of Truth
Validates that:
1. The same device has the same status on every page/endpoint (never healthy when offline).
2. GTV matches across Reports, Offers, and Home (canonical single source).
3. Dates are dynamic and relative to today (no stale September 2026 dates).
4. Tara greeting and status responses NEVER say "everything looks good" when an offline device exists.
"""

import sys
import os
from datetime import datetime

# Add python-backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from agent.derived_state import compute_derived_state
from agent.orchestrator import get_orchestrator


def test_device_status_consistency():
    state = compute_derived_state("M_DISPUTE_TAT")
    
    # Invariant 1: all_systems_active MUST be False when Soundbox is offline
    assert state["all_systems_active"] is False, "all_systems_active should be False when Soundbox is offline"
    
    # Invariant 2: Soundbox SB-4421 must be OFFLINE and CRITICAL
    devices = {d["id"]: d for d in state["devices"]}
    assert "SB-4421" in devices
    sb = devices["SB-4421"]
    assert sb["status"] == "OFFLINE"
    assert sb["health_grade"] == "CRITICAL"
    assert sb["battery_pct"] == 12
    assert sb["is_stale"] is True
    assert sb["last_ping_sec_ago"] > 120, "Devices with ping > 120s must be marked stale"
    
    # Invariant 3: POS-9982 is ONLINE
    assert "POS-9982" in devices
    pos = devices["POS-9982"]
    assert pos["status"] == "ONLINE"
    assert pos["is_stale"] is False


def test_gtv_single_source_of_truth():
    state = compute_derived_state("M_DISPUTE_TAT")
    
    # Canonical GTV must be exact
    gtv = state["financials"]["last_30_days_gtv_inr"]
    assert gtv == 482500.0, f"Expected 482500.0 but got {gtv}"
    assert state["financials"]["formatted_gtv_lakhs"] == "₹4.8L"
    
    # Daily trends must exist and sum to a non-zero sensible window
    trends = state["daily_trends"]
    assert len(trends) >= 7, "Daily trends must provide at least 7 days of data"
    assert trends[-1]["is_today"] is True, "The last entry in daily trends must be today"


def test_relative_dates():
    state = compute_derived_state("M_DISPUTE_TAT")
    today = datetime.now()
    
    # Date string must match current date
    assert state["today_str"] == today.strftime("%Y-%m-%d")
    
    # Trend full_dates must match recent ISO dates
    last_trend_date = state["daily_trends"][-1]["full_date"]
    assert last_trend_date == today.strftime("%Y-%m-%d"), (
        f"Last trend date should be {today.strftime('%Y-%m-%d')}, got {last_trend_date}"
    )


def test_tara_greeting_never_falsely_healthy():
    state = compute_derived_state("M_DISPUTE_TAT")
    greeting = state["tara_greeting"].lower()
    
    # Must NOT claim everything looks good
    assert "everything looks good" not in greeting, (
        "Tara greeting falsely claimed 'everything looks good' when an offline device exists!"
    )
    
    # Must warn about Soundbox / attention needed
    assert "sb-4421" in greeting or "soundbox" in greeting, "Greeting must identify the affected device"
    assert "offline" in greeting or "attention" in greeting, "Greeting must flag offline status"


def test_orchestrator_honest_status_response():
    orchestrator = get_orchestrator()
    result = orchestrator.process_case(
        merchant_id="M_DISPUTE_TAT",
        user_message="Is everything looking good with my devices and store?"
    )
    response_text = result.get("reply", "").lower()
    
    # Must NOT give false all-clear
    assert "everything looks good" not in response_text
    assert "all systems active" not in response_text
    assert "soundbox" in response_text or "sb-4421" in response_text
    assert "offline" in response_text or "12%" in response_text


def test_offers_governance_suppression():
    state = compute_derived_state("M_DISPUTE_TAT")
    
    # Offers must be suppressed while Soundbox is offline
    assert state["offers_governance"]["suppressed"] is True
    assert "holding loan and upgrade offers" in state["offers_governance"]["reason"].lower()


if __name__ == "__main__":
    print("Running Tara v2 invariant tests...")
    test_device_status_consistency()
    print("✓ test_device_status_consistency passed")
    test_gtv_single_source_of_truth()
    print("✓ test_gtv_single_source_of_truth passed")
    test_relative_dates()
    print("✓ test_relative_dates passed")
    test_tara_greeting_never_falsely_healthy()
    print("✓ test_tara_greeting_never_falsely_healthy passed")
    test_orchestrator_honest_status_response()
    print("✓ test_orchestrator_honest_status_response passed")
    test_offers_governance_suppression()
    print("✓ test_offers_governance_suppression passed")
    print("ALL 6 INVARIANT TESTS PASSED!")
