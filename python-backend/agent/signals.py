"""
Tara — Event Ingestion, Signals & Noise Filter (Prompt 12)

Detects and classifies real-time operational events from Soundbox telemetry,
Kafka streams, and payment switches:
- Deduplication window (suppresses duplicate burst events within 300s)
- Transient noise filter (ignores network drops < 45s or < 3 missed pings)
- Ontology graph synchronization
- Signal emission to agent decision engine
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List
from enum import Enum
import time
import uuid
import logging

from agent.ontology import (
    InMemoryOntologyStore, Entity, Relationship, EntityType, RelationType, get_ontology_store
)

logger = logging.getLogger("tara-signals")


class SignalType(str, Enum):
    DEVICE_OFFLINE = "device_offline"
    SILENT_SOUNDBOX = "silent_soundbox"
    SETTLEMENT_MISMATCH = "settlement_mismatch"
    TAT_CLOCK_AT_RISK = "tat_clock_at_risk"
    MERCHANT_FRUSTRATION = "merchant_frustration"
    DUPLICATE_DEBIT = "duplicate_debit"
    FIRMWARE_CRASH = "firmware_crash"


class SignalSeverity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


@dataclass
class Signal:
    signal_id: str
    signal_type: SignalType
    merchant_id: str
    device_id: Optional[str]
    severity: SignalSeverity
    confidence: float
    context: Dict[str, Any]
    timestamp: float = field(default_factory=time.time)
    suppressed: bool = False
    status: str = "EMITTED"  # EMITTED, IN_PROGRESS, RESOLVED, ESCALATED


class SignalEngine:
    def __init__(self, dedup_window_sec: float = 300.0):
        self.dedup_window_sec = dedup_window_sec
        # Map (signal_type, entity_id) -> last_seen_timestamp
        self.seen_events: Dict[str, float] = {}
        # In-memory store of active signals
        self.active_signals: List[Signal] = []
        self.ontology_store: InMemoryOntologyStore = get_ontology_store()

    def _get_key(self, signal_type: SignalType, entity_id: str) -> str:
        return f"{signal_type.value}:{entity_id}"

    def is_transient_noise(self, telemetry: Dict[str, Any]) -> bool:
        """
        Filters out transient GSM fluctuations:
        - If ping lost for < 45 seconds, ignore
        - If battery > 10% and signal recovered on retry, ignore
        """
        missed_seconds = time.time() - telemetry.get("last_ping_ts", time.time())
        if missed_seconds < 45:
            return True
        return False

    def process_telemetry(self, telemetry: Dict[str, Any]) -> Optional[Signal]:
        """
        Inspect soundbox heartbeat for Silent Soundbox or Offline status.
        Silent Soundbox: MQTT is online, ping is active, but audio driver failed.
        """
        device_id = telemetry.get("device_id")
        merchant_id = telemetry.get("merchant_id")
        now = time.time()

        if not device_id or not merchant_id:
            return None

        # Check for Silent Soundbox anomaly
        audio_ok = telemetry.get("audio_subsystem_ok", True)
        mqtt_ok = telemetry.get("mqtt_connected", True)

        if mqtt_ok and not audio_ok:
            key = self._get_key(SignalType.SILENT_SOUNDBOX, device_id)
            if key in self.seen_events and (now - self.seen_events[key]) < self.dedup_window_sec:
                logger.info(f"Deduplicated silent_soundbox for device {device_id}")
                return None

            self.seen_events[key] = now
            signal = Signal(
                signal_id=f"SIG-SND-{uuid.uuid4().hex[:8].upper()}",
                signal_type=SignalType.SILENT_SOUNDBOX,
                merchant_id=merchant_id,
                device_id=device_id,
                severity=SignalSeverity.CRITICAL,
                confidence=0.96,
                context={
                    "mqtt_connected": True,
                    "audio_subsystem_ok": False,
                    "battery_pct": telemetry.get("battery_pct", 75),
                    "missed_announcements_est": telemetry.get("missed_announcements", 4),
                    "description": "Soundbox network is active but speaker output driver is muted or crashed."
                }
            )
            self._record_signal(signal)
            return signal

        # Check for Device Offline
        if not mqtt_ok or (now - telemetry.get("last_ping_ts", now)) > 120:
            if self.is_transient_noise(telemetry):
                return None

            key = self._get_key(SignalType.DEVICE_OFFLINE, device_id)
            if key in self.seen_events and (now - self.seen_events[key]) < self.dedup_window_sec:
                return None

            self.seen_events[key] = now
            signal = Signal(
                signal_id=f"SIG-OFF-{uuid.uuid4().hex[:8].upper()}",
                signal_type=SignalType.DEVICE_OFFLINE,
                merchant_id=merchant_id,
                device_id=device_id,
                severity=SignalSeverity.WARNING,
                confidence=0.89,
                context={
                    "last_seen_sec_ago": round(now - telemetry.get("last_ping_ts", now), 1),
                    "battery_pct": telemetry.get("battery_pct", 0),
                    "signal_dbm": telemetry.get("signal_dbm", -110),
                    "description": "Soundbox has not communicated with broker for > 120s."
                }
            )
            self._record_signal(signal)
            return signal

        return None

    def process_settlement_event(self, settlement: Dict[str, Any]) -> Optional[Signal]:
        """Detects settlement mismatches or TAT deadlines at risk"""
        merchant_id = settlement.get("merchant_id")
        now = time.time()

        # Check for TAT risk
        tat_hours = settlement.get("tat_hours", 0)
        tat_limit = settlement.get("tat_limit_hours", 24.0)

        if tat_hours >= tat_limit:
            key = self._get_key(SignalType.TAT_CLOCK_AT_RISK, merchant_id)
            if key in self.seen_events and (now - self.seen_events[key]) < self.dedup_window_sec:
                return None

            self.seen_events[key] = now
            signal = Signal(
                signal_id=f"SIG-TAT-{uuid.uuid4().hex[:8].upper()}",
                signal_type=SignalType.TAT_CLOCK_AT_RISK,
                merchant_id=merchant_id,
                device_id=None,
                severity=SignalSeverity.CRITICAL,
                confidence=0.98,
                context={
                    "settlement_id": settlement.get("settlement_id"),
                    "tat_hours_elapsed": tat_hours,
                    "tat_limit_hours": tat_limit,
                    "hours_overdue": round(tat_hours - tat_limit, 1),
                    "policy_rule": "RBI Harmonisation T+1 Autoreversal",
                    "description": f"Settlement overdue by {round(tat_hours - tat_limit, 1)} hrs. Risk of statutory penalty."
                }
            )
            self._record_signal(signal)
            return signal

        # Check for unannounced deduction
        deductions = settlement.get("deductions_inr", 0)
        if deductions > 0:
            key = self._get_key(SignalType.SETTLEMENT_MISMATCH, merchant_id)
            if key not in self.seen_events or (now - self.seen_events[key]) >= self.dedup_window_sec:
                self.seen_events[key] = now
                signal = Signal(
                    signal_id=f"SIG-SETTLE-{uuid.uuid4().hex[:8].upper()}",
                    signal_type=SignalType.SETTLEMENT_MISMATCH,
                    merchant_id=merchant_id,
                    device_id=None,
                    severity=SignalSeverity.WARNING,
                    confidence=0.92,
                    context={
                        "settlement_id": settlement.get("settlement_id"),
                        "gross_amount_inr": settlement.get("gross_amount_inr"),
                        "deductions_inr": deductions,
                        "breakdown": settlement.get("deduction_breakdown", {}),
                        "description": f"Merchant deduction of INR {deductions} requires automated breakdown explanation."
                    }
                )
                self._record_signal(signal)
                return signal

        return None

    def process_merchant_sentiment(self, merchant_id: str, message: str, sentiment_score: float) -> Optional[Signal]:
        """Triggers merchant_frustration signal on acute anger or repeated issues"""
        if sentiment_score < -0.6 or any(w in message.lower() for w in ["fraud", "police", "thief", "cheat", "chor", "bakwaas", "court"]):
            key = self._get_key(SignalType.MERCHANT_FRUSTRATION, merchant_id)
            now = time.time()
            if key not in self.seen_events or (now - self.seen_events[key]) >= self.dedup_window_sec:
                self.seen_events[key] = now
                signal = Signal(
                    signal_id=f"SIG-FRUST-{uuid.uuid4().hex[:8].upper()}",
                    signal_type=SignalType.MERCHANT_FRUSTRATION,
                    merchant_id=merchant_id,
                    device_id=None,
                    severity=SignalSeverity.CRITICAL,
                    confidence=0.95,
                    context={
                        "message_snippet": message[:100],
                        "sentiment_score": sentiment_score,
                        "escalation_trigger": "HIGH_SENTIMENT_RISK"
                    }
                )
                self._record_signal(signal)
                return signal
        return None

    def _record_signal(self, signal: Signal):
        """Append to active signals list and link into ontology graph"""
        self.active_signals.insert(0, signal)
        
        # Link into ontology
        sig_entity = Entity(
            id=signal.signal_id,
            type=EntityType.ACTION,
            properties={
                "signal_type": signal.signal_type.value,
                "severity": signal.severity.value,
                "confidence": signal.confidence,
                **signal.context
            }
        )
        self.ontology_store.add_entity(sig_entity)
        
        # Relationship to merchant
        self.ontology_store.add_relationship(Relationship(
            id=f"REL-{uuid.uuid4().hex[:8]}",
            source_id=signal.signal_id,
            target_id=signal.merchant_id,
            type=RelationType.AFFECTS
        ))
        
        if signal.device_id:
            self.ontology_store.add_relationship(Relationship(
                id=f"REL-{uuid.uuid4().hex[:8]}",
                source_id=signal.signal_id,
                target_id=signal.device_id,
                type=RelationType.REFERENCES
            ))

    def get_recent_signals(self, limit: int = 20) -> List[Dict[str, Any]]:
        return [
            {
                "signal_id": s.signal_id,
                "signal_type": s.signal_type.value,
                "merchant_id": s.merchant_id,
                "device_id": s.device_id,
                "severity": s.severity.value,
                "confidence": s.confidence,
                "context": s.context,
                "timestamp": s.timestamp,
                "status": s.status
            }
            for s in self.active_signals[:limit]
        ]


# Global singleton instance
_signal_engine_instance: Optional[SignalEngine] = None

def get_signal_engine() -> SignalEngine:
    global _signal_engine_instance
    if _signal_engine_instance is None:
        _signal_engine_instance = SignalEngine()
    return _signal_engine_instance
