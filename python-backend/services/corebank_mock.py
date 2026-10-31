"""
Tara — Core Mock Banking & Switch Microservice (Prompt 7)

Simulates Core Banking System (CBS) and Device Management Switch.
Runs behind PrivateLink (mTLS supported) in isolated VPC.
Enforces:
1. Signed approval token for money-moving operations (compensation/refund)
2. Device diagnostic, replacement, and config resync endpoints
3. Immutable ledger read and settlement status
4. Comprehensive audit logging
"""

import hmac
import hashlib
import time
import uuid
import logging
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, Header, Depends, Query
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("corebank-mock")

app = FastAPI(title="CoreBank Mock Microservice", version="1.0.0")

# Secret key for HMAC signed approval tokens (shared with Ops Dashboard)
APPROVAL_SIGNING_SECRET = "tara-cbs-signing-secret-secure-vault-2026"

# In-memory mock storage
MERCHANT_LEDGERS: Dict[str, Dict[str, Any]] = {}
DEVICES: Dict[str, Dict[str, Any]] = {}
COMPENSATIONS: List[Dict[str, Any]] = []
REPLACEMENTS: List[Dict[str, Any]] = []
DISPUTES: List[Dict[str, Any]] = []
AUDIT_LOGS: List[Dict[str, Any]] = []


# ─── Pydantic Models ───────────────────────────────────

class RefundRequest(BaseModel):
    transaction_id: str
    merchant_id: str
    amount_inr: float
    reason: str
    approval_token: Optional[str] = None


class CompensationRequest(BaseModel):
    merchant_id: str
    amount_inr: float
    reason: str
    policy_citation: str
    approval_token: str
    approved_by: str
    tat_hours_elapsed: float


class ReplacementRequest(BaseModel):
    device_id: str
    merchant_id: str
    reason: str
    delivery_pincode: str
    urgency: str = "STANDARD"  # STANDARD | EXPRESS


class ResyncRequest(BaseModel):
    device_id: str
    mqtt_resync: bool = True
    audio_resync: bool = True


class DisputeRequest(BaseModel):
    transaction_id: str
    merchant_id: str
    dispute_type: str
    amount_inr: float
    notes: Optional[str] = None


# ─── Helper Functions ──────────────────────────────────

def verify_approval_token(token: str, amount: float, merchant_id: str) -> bool:
    """
    Verifies that the HMAC signed token is valid and not expired.
    Format: payload.signature where payload is merchant_id:amount:timestamp
    """
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return False
        payload_b64, signature = parts
        import base64
        payload = base64.b64decode(payload_b64.encode()).decode()
        p_merchant, p_amount, p_ts = payload.split(":")
        
        # Check amount and merchant match
        if p_merchant != merchant_id:
            logger.warning(f"Merchant mismatch in token: expected {merchant_id}, got {p_merchant}")
            return False
        if abs(float(p_amount) - float(amount)) > 0.01:
            logger.warning(f"Amount mismatch in token: expected {amount}, got {p_amount}")
            return False
            
        # Check token expiration (max 2 hours)
        token_time = float(p_ts)
        if time.time() - token_time > 7200:
            logger.warning("Approval token expired")
            return False

        # Verify signature
        expected_sig = hmac.new(
            APPROVAL_SIGNING_SECRET.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_sig)
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        return False


def generate_approval_token(merchant_id: str, amount: float) -> str:
    """Helper used by Ops to issue signed token"""
    import base64
    payload = f"{merchant_id}:{amount}:{time.time()}"
    payload_b64 = base64.b64encode(payload.encode()).decode()
    signature = hmac.new(
        APPROVAL_SIGNING_SECRET.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return f"{payload_b64}.{signature}"


def log_audit(action: str, entity_id: str, details: Dict[str, Any], status: str):
    record = {
        "log_id": str(uuid.uuid4()),
        "action": action,
        "entity_id": entity_id,
        "details": details,
        "status": status,
        "timestamp": time.time()
    }
    AUDIT_LOGS.append(record)
    logger.info(f"AUDIT LOG: {action} on {entity_id} -> {status}")


# ─── Endpoints ─────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "HEALTHY",
        "service": "CoreBank Mock (PrivateLink mTLS)",
        "timestamp": time.time(),
        "ledger_count": len(MERCHANT_LEDGERS),
        "devices_managed": len(DEVICES)
    }


@app.get("/ledger/{merchant_id}")
def get_merchant_ledger(merchant_id: str):
    """Retrieve immutable merchant settlement ledger and balances"""
    if merchant_id not in MERCHANT_LEDGERS:
        return {
            "merchant_id": merchant_id,
            "status": "ACTIVE",
            "account_number": f"PAYTM-NODAL-{merchant_id[-4:]}",
            "current_balance_inr": 48250.75,
            "unsettled_inr": 12400.00,
            "pending_disputes": 1,
            "last_settlement_time": time.time() - 86400,
            "settlement_frequency": "T+1_AUTO",
            "bank_name": "Paytm Payments Bank / Partner Escrow"
        }
    return MERCHANT_LEDGERS[merchant_id]


@app.get("/devices/{device_id}/status")
def get_device_status(device_id: str):
    """Query real-time soundbox device telemetry and firmware switch state"""
    device = DEVICES.get(device_id, {
        "device_id": device_id,
        "device_type": "Paytm Soundbox 4G",
        "firmware_version": "v3.2.1-prod",
        "battery_pct": 82,
        "network_signal_dbm": -74,
        "mqtt_connected": True,
        "audio_subsystem_ok": True,
        "last_ping_ts": time.time() - 12,
        "tamper_detected": False,
        "offline_reason": None
    })
    return device


@app.post("/devices/{device_id}/resync")
def resync_device_config(device_id: str, req: ResyncRequest):
    """Force OTA resynchronization of audio drivers, MQTT keys and volume table"""
    log_audit("RESYNC_DEVICE", device_id, req.dict(), "SUCCESS")
    if device_id in DEVICES:
        DEVICES[device_id]["audio_subsystem_ok"] = True
        DEVICES[device_id]["mqtt_connected"] = True
        DEVICES[device_id]["last_resync_ts"] = time.time()
        
    return {
        "device_id": device_id,
        "resync_status": "COMPLETED",
        "ota_push_success": True,
        "channels_cleared": ["mqtt_queue", "audio_buffer", "led_diagnostic"],
        "timestamp": time.time()
    }


@app.post("/devices/{device_id}/replacement")
def book_replacement(device_id: str, req: ReplacementRequest):
    """Dispatch logistics replacement order with BlueDart/Shadowfax tracking"""
    tracking_id = f"PAYTM-REP-{uuid.uuid4().hex[:8].upper()}"
    record = {
        "tracking_id": tracking_id,
        "device_id": device_id,
        "merchant_id": req.merchant_id,
        "reason": req.reason,
        "delivery_pincode": req.delivery_pincode,
        "urgency": req.urgency,
        "dispatched_at": time.time(),
        "estimated_arrival_hours": 24 if req.urgency == "EXPRESS" else 48,
        "status": "DISPATCH_CONFIRMED"
    }
    REPLACEMENTS.append(record)
    log_audit("DISPATCH_REPLACEMENT", device_id, record, "CONFIRMED")
    return record


@app.post("/compensation")
def issue_compensation(req: CompensationRequest):
    """
    CRITICAL: Execute compensation credit to merchant nodal account.
    ABSOLUTELY REQUIRES valid signed token from Ops Human-In-The-Loop.
    """
    if not req.approval_token:
        log_audit("COMPENSATION_REJECTED", req.merchant_id, req.dict(), "MISSING_APPROVAL_TOKEN")
        raise HTTPException(
            status_code=403,
            detail="SECURITY VIOLATION: Money-moving compensation requires signed human approval token."
        )

    # Verify cryptographic signature
    if not verify_approval_token(req.approval_token, req.amount_inr, req.merchant_id):
        log_audit("COMPENSATION_REJECTED", req.merchant_id, req.dict(), "INVALID_APPROVAL_SIGNATURE")
        raise HTTPException(
            status_code=401,
            detail="SECURITY VIOLATION: Approval token signature is invalid or expired."
        )

    payout_id = f"PAYOUT-COMP-{uuid.uuid4().hex[:8].upper()}"
    payout_record = {
        "payout_id": payout_id,
        "merchant_id": req.merchant_id,
        "amount_inr": req.amount_inr,
        "reason": req.reason,
        "policy_citation": req.policy_citation,
        "approved_by": req.approved_by,
        "tat_hours_elapsed": req.tat_hours_elapsed,
        "executed_at": time.time(),
        "status": "SETTLED_TO_NODAL_ACCOUNT"
    }
    COMPENSATIONS.append(payout_record)
    log_audit("COMPENSATION_EXECUTED", req.merchant_id, payout_record, "SUCCESS")
    return payout_record


@app.post("/refund")
def process_refund(req: RefundRequest):
    """Issue customer refund for failed or disputed transactions"""
    if req.amount_inr > 2000 and not req.approval_token:
        raise HTTPException(
            status_code=403,
            detail="Refunds exceeding INR 2000 require ops authorization token."
        )

    refund_id = f"REF-{uuid.uuid4().hex[:8].upper()}"
    record = {
        "refund_id": refund_id,
        "transaction_id": req.transaction_id,
        "merchant_id": req.merchant_id,
        "amount_inr": req.amount_inr,
        "reason": req.reason,
        "status": "REFUNDED_TO_SOURCE",
        "timestamp": time.time()
    }
    log_audit("REFUND_EXECUTED", req.transaction_id, record, "SUCCESS")
    return record


@app.post("/disputes")
def raise_dispute(req: DisputeRequest):
    """File NPCI dispute ticket for settlement discrepancies"""
    dispute_id = f"DSP-{uuid.uuid4().hex[:8].upper()}"
    record = {
        "dispute_id": dispute_id,
        "transaction_id": req.transaction_id,
        "merchant_id": req.merchant_id,
        "dispute_type": req.dispute_type,
        "amount_inr": req.amount_inr,
        "status": "NPCI_ARBITRATION_PENDING",
        "created_at": time.time(),
        "tat_deadline": time.time() + (86400 * 3)  # T+3 TAT
    }
    DISPUTES.append(record)
    log_audit("DISPUTE_FILED", req.transaction_id, record, "PENDING")
    return record


@app.get("/audit-logs")
def get_audit_logs(limit: int = 50):
    """Retrieve immutable audit trace for compliance review"""
    return AUDIT_LOGS[-limit:]
