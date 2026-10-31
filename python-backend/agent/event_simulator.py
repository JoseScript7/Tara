"""
Tara — Real-Time Event Simulator (Prompt 12)

Simulates continuous streams of Soundbox telemetry and CBS settlement events
with adjustable playback speed and instant scenario trigger hooks:
- Scenario 1: Silent Soundbox (audio driver failure with active MQTT)
- Scenario 2: Settlement Mismatch (unexplained rental deduction)
- Scenario 3: TAT Clock at Risk (overdue settlement past statutory window)
- Scenario 4: Merchant Frustration (sentiment-triggered escalation)
- Scenario 5: Duplicate Debit (customer charged twice)
"""

import time
import json
import logging
from typing import Dict, Any, Optional, List
from agent.signals import get_signal_engine, Signal

logger = logging.getLogger("tara-simulator")


class EventSimulator:
    def __init__(self, speed_multiplier: float = 1.0):
        self.speed = speed_multiplier
        self.signal_engine = get_signal_engine()
        self.is_running = False

    def set_speed(self, multiplier: float):
        self.speed = max(0.1, min(100.0, multiplier))
        logger.info(f"Simulator speed set to {self.speed}x")

    def trigger_scenario(self, scenario_name: str, merchant_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Instantly fires a specific benchmark scenario event stream.
        """
        now = time.time()
        logger.info(f"Triggering benchmark scenario: {scenario_name}")

        if scenario_name == "silent_soundbox":
            target_merchant = merchant_id or "M_KIRANA_042"
            device_id = f"SND-{target_merchant[-3:]}-4022"
            telemetry = {
                "device_id": device_id,
                "merchant_id": target_merchant,
                "mqtt_connected": True,
                "audio_subsystem_ok": False,  # Audio muted / driver hang
                "battery_pct": 78,
                "signal_dbm": -71,
                "last_ping_ts": now - 5,
                "missed_announcements": 4
            }
            sig = self.signal_engine.process_telemetry(telemetry)
            return {
                "scenario": "silent_soundbox",
                "merchant_id": target_merchant,
                "device_id": device_id,
                "signal_emitted": sig.signal_id if sig else "DEDUPLICATED",
                "details": "Soundbox pinging normally via MQTT, but local DAC audio pipeline crashed."
            }

        elif scenario_name == "settlement_mismatch":
            target_merchant = merchant_id or "M_CAFE_017"
            settlement = {
                "settlement_id": "SETTLE_DEMO_991",
                "merchant_id": target_merchant,
                "gross_amount_inr": 18450.00,
                "deductions_inr": 150.00,
                "deduction_breakdown": {
                    "soundbox_monthly_rental": 150.00,
                    "gst_on_rental": 27.00
                },
                "net_settled_inr": 18273.00,
                "tat_hours": 12.0,
                "tat_limit_hours": 24.0
            }
            sig = self.signal_engine.process_settlement_event(settlement)
            return {
                "scenario": "settlement_mismatch",
                "merchant_id": target_merchant,
                "signal_emitted": sig.signal_id if sig else "DEDUPLICATED",
                "deduction_inr": 150.00,
                "details": "INR 150 Soundbox rental deducted from daily batch settlement."
            }

        elif scenario_name == "tat_clock_at_risk":
            target_merchant = merchant_id or "M_PHARM_009"
            settlement = {
                "settlement_id": "SETTLE_DEMO_TAT_BREACH",
                "merchant_id": target_merchant,
                "gross_amount_inr": 42500.00,
                "deductions_inr": 0.0,
                "net_settled_inr": 42500.00,
                "tat_hours": 36.5,
                "tat_limit_hours": 24.0
            }
            sig = self.signal_engine.process_settlement_event(settlement)
            return {
                "scenario": "tat_clock_at_risk",
                "merchant_id": target_merchant,
                "signal_emitted": sig.signal_id if sig else "DEDUPLICATED",
                "tat_hours_elapsed": 36.5,
                "tat_limit_hours": 24.0,
                "details": "Settlement delayed past T+1 statutory window by 12.5 hrs. Auto-compensation required."
            }

        elif scenario_name == "merchant_frustration":
            target_merchant = merchant_id or "M_CLINIC_003"
            msg = "Third time my soundbox stopped working during peak patient hours! Your team is cheating us, I will file a police complaint and consumer court case immediately!"
            sig = self.signal_engine.process_merchant_sentiment(
                merchant_id=target_merchant,
                message=msg,
                sentiment_score=-0.88
            )
            return {
                "scenario": "merchant_frustration",
                "merchant_id": target_merchant,
                "signal_emitted": sig.signal_id if sig else "DEDUPLICATED",
                "sentiment_score": -0.88,
                "details": "High anger sentiment with legal threat triggers Tier 3 human handover brief."
            }

        elif scenario_name == "duplicate_debit":
            target_merchant = merchant_id or "M_KIRANA_105"
            sig = Signal(
                signal_id="SIG-DUP-8812",
                signal_type="duplicate_debit",
                merchant_id=target_merchant,
                device_id=None,
                severity="WARNING",
                confidence=0.94,
                context={
                    "customer_vpa": "customer99@okhdfcbank",
                    "amount_inr": 250.00,
                    "rrn1": "419200381920",
                    "rrn2": "419200381921",
                    "time_delta_sec": 3.2
                }
            )
            self.signal_engine._record_signal(sig)
            return {
                "scenario": "duplicate_debit",
                "merchant_id": target_merchant,
                "signal_emitted": sig.signal_id,
                "amount_inr": 250.00,
                "details": "Customer charged twice within 3.2 seconds at checkout counter."
            }

        else:
            raise ValueError(f"Unknown scenario: {scenario_name}")


# Global simulator instance
_simulator_instance: Optional[EventSimulator] = None

def get_event_simulator() -> EventSimulator:
    global _simulator_instance
    if _simulator_instance is None:
        _simulator_instance = EventSimulator()
    return _simulator_instance
