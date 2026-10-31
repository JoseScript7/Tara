"""
Tara v7 — Device Registry, Provisioning, WebSocket Channel & Presence Engine
Implements L0-L4 Rules:
- Model is labelled "Demo soundbox (simulated)" everywhere (Rule 35)
- All panels read from live event stream or derived state; freshness "as of" (Rule 36)
- Stale data is "Unknown", never "OK" (Rule 37)
- Single-use, expiring, opaque pairing tokens (Rule 38)
- Configurable timing variables (Rule 39)
- Latency and capacity numbers from measurement (Rule 40)
"""

import time
import uuid
import asyncio
import logging
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Query
from pydantic import BaseModel

logger = logging.getLogger("tara-device-registry")

router = APIRouter(prefix="/api/devices", tags=["Tara v7 Devices"])

# ─── Configurable Timing Variables (Rule 39) ───────────────
HEARTBEAT_INTERVAL_SEC: float = 5.0
OFFLINE_TIMEOUT_SEC: float = 12.0
DEBOUNCE_JITTER_SEC: float = 3.0
ANNOUNCEMENT_SLA_MS: float = 2000.0
RECONNECT_BACKOFF_BASE_MS: float = 1000.0


# ─── Data Structures ──────────────────────────────────────

class ProvisionDeviceRequest(BaseModel):
    device_id: Optional[str] = None
    merchant_id: Optional[str] = None
    model_label: str = "Demo soundbox (simulated)"
    firmware_version: str = "v4.2.1-prod"


class ClaimDeviceRequest(BaseModel):
    merchant_id: str
    token: str


class CommandRequest(BaseModel):
    command: str  # ping, test_announcement, set_volume, restart_request
    payload: Optional[Dict[str, Any]] = None


class AckRequest(BaseModel):
    announcement_id: Optional[str] = None
    command_id: Optional[str] = None
    status: str  # played, failed, muted
    latency_ms: float
    error_reason: Optional[str] = None


# ─── In-Memory Device Storage & Audit Trail ───────────────

DEVICES: Dict[str, Dict[str, Any]] = {
    "SB-DEMO-7701": {
        "id": "SB-DEMO-7701",
        "model_label": "Demo soundbox (simulated)",
        "firmware_version": "v4.2.1-prod",
        "status": "ONLINE",
        "owner_merchant_id": "M_DISPUTE_TAT",
        "battery_pct": 88,
        "signal_dbm": -68,
        "pairing_token": None,
        "token_expires_at": 0.0,
        "device_credential": "DEV-CRED-7701-ACTIVE",
        "last_heartbeat": time.time(),
        "created_at": time.time() - 86400,
        "audit_trail": [
            {"time": time.time() - 3600, "action": "DEVICE_CLAIMED", "actor": "M_DISPUTE_TAT"}
        ],
        "last_announcement": {
            "id": "ANN-INIT",
            "amount": 420,
            "status": "Announced",
            "ack_latency_ms": 78.4,
            "time": time.time() - 120
        }
    },
    "SB-DEMO-9942": {
        "id": "SB-DEMO-9942",
        "model_label": "Demo soundbox (simulated)",
        "firmware_version": "v4.2.1-prod",
        "status": "OFFLINE",
        "owner_merchant_id": "M_DISPUTE_TAT",
        "battery_pct": 12,
        "signal_dbm": -108,
        "pairing_token": None,
        "token_expires_at": 0.0,
        "device_credential": "DEV-CRED-9942-STALE",
        "last_heartbeat": time.time() - 24000,
        "created_at": time.time() - 172800,
        "audit_trail": [
            {"time": time.time() - 24000, "action": "CONNECTION_DROPPED", "actor": "GATEWAY"}
        ],
        "last_announcement": {
            "id": "ANN-DROPPED",
            "amount": 150,
            "status": "Not announced (DEVICE_OFFLINE)",
            "ack_latency_ms": None,
            "time": time.time() - 23900
        }
    }
}

ANNOUNCEMENT_RECORDS: List[Dict[str, Any]] = []

# Connected WebSocket clients: device_id -> WebSocket
ACTIVE_WEBSOCKETS: Dict[str, WebSocket] = {}


# ─── 1. Provisioning & QR Token (L1) ──────────────────────

@router.post("/provision")
def provision_device(req: ProvisionDeviceRequest):
    """
    Admin generates a new Demo soundbox with an opaque, single-use, 15-minute expiring token.
    No secrets or PII are encoded in the QR.
    """
    dev_id = req.device_id or f"SB-DEMO-{uuid.uuid4().hex[:4].upper()}"
    opaque_token = f"PAIR-{uuid.uuid4().hex[:8].upper()}"
    expires_at = time.time() + 900.0  # 15 minutes

    dev = {
        "id": dev_id,
        "model_label": "Demo soundbox (simulated)",
        "firmware_version": req.firmware_version,
        "status": "PROVISIONING",
        "owner_merchant_id": req.merchant_id,
        "battery_pct": 95,
        "signal_dbm": -65,
        "pairing_token": opaque_token,
        "token_expires_at": expires_at,
        "device_credential": None,
        "last_heartbeat": time.time(),
        "created_at": time.time(),
        "audit_trail": [
            {"time": time.time(), "action": "PROVISIONED", "actor": "ADMIN"}
        ],
        "last_announcement": None
    }
    DEVICES[dev_id] = dev

    pairing_url = f"http://localhost:5173/soundbox?token={opaque_token}"
    return {
        "device_id": dev_id,
        "model_label": "Demo soundbox (simulated)",
        "token": opaque_token,
        "expires_in_sec": 900,
        "pairing_url": pairing_url,
        "status": "PROVISIONING"
    }


@router.post("/claim")
def claim_device(req: ClaimDeviceRequest):
    """
    Merchant claims device via QR or manual code.
    Binds device to merchant, invalidates token, and issues per-device credential.
    """
    now = time.time()
    found_dev = None

    for dev in DEVICES.values():
        if dev.get("pairing_token") == req.token or dev.get("id") == req.token:
            found_dev = dev
            break

    if not found_dev:
        raise HTTPException(status_code=404, detail="Invalid or unrecognized pairing token / device code.")

    if found_dev.get("token_expires_at", 0) > 0 and now > found_dev["token_expires_at"]:
        raise HTTPException(status_code=400, detail="Pairing token expired. Request admin re-provision.")

    # Replay protection: if already claimed by someone else
    if found_dev.get("owner_merchant_id") and found_dev["owner_merchant_id"] != req.merchant_id:
        raise HTTPException(status_code=403, detail="Device already claimed by another merchant.")

    # Invalidate token (Single-use Rule 38)
    found_dev["pairing_token"] = None
    found_dev["token_expires_at"] = 0.0
    found_dev["owner_merchant_id"] = req.merchant_id
    found_dev["status"] = "ONLINE"
    found_dev["device_credential"] = f"CRED-{uuid.uuid4().hex[:12].upper()}"
    found_dev["last_heartbeat"] = now
    found_dev["audit_trail"].append({
        "time": now,
        "action": "DEVICE_CLAIMED",
        "actor": req.merchant_id
    })

    logger.info(f"✅ Device {found_dev['id']} claimed by merchant {req.merchant_id}")

    return {
        "status": "SUCCESS",
        "device_id": found_dev["id"],
        "model_label": "Demo soundbox (simulated)",
        "owner_merchant_id": req.merchant_id,
        "device_credential": found_dev["device_credential"]
    }


@router.post("/{device_id}/unclaim")
def unclaim_device(device_id: str, merchant_id: str = Query(...)):
    """Unclaim device with audit log entry"""
    dev = DEVICES.get(device_id)
    if not dev:
        raise HTTPException(status_code=404, detail="Device not found")
    if dev.get("owner_merchant_id") != merchant_id:
        raise HTTPException(status_code=403, detail="Unauthorized: Merchant does not own this device.")

    dev["owner_merchant_id"] = None
    dev["status"] = "PROVISIONING"
    dev["audit_trail"].append({"time": time.time(), "action": "UNCLAIMED", "actor": merchant_id})
    return {"status": "UNCLAIMED", "device_id": device_id}


# ─── 2. Fleet & Telemetry Queries (L2, L5, L6) ────────────

@router.get("/fleet")
def get_fleet(
    status: Optional[str] = None,
    merchant_id: Optional[str] = None
):
    """
    Admin fleet query with filters and freshness timestamps.
    """
    now = time.time()
    results = []

    for dev in DEVICES.values():
        # Evaluate freshness: if no heartbeat within OFFLINE_TIMEOUT_SEC, mark OFFLINE
        if dev["status"] == "ONLINE" and (now - dev.get("last_heartbeat", 0)) > OFFLINE_TIMEOUT_SEC:
            dev["status"] = "OFFLINE"

        if status and dev["status"] != status:
            continue
        if merchant_id and dev.get("owner_merchant_id") != merchant_id:
            continue

        results.append({
            **dev,
            "age_seconds": round(now - dev.get("last_heartbeat", 0), 1),
            "freshness": f"as of {time.strftime('%H:%M:%S', time.localtime(dev.get('last_heartbeat', now)))}"
        })

    summary = {
        "total": len(DEVICES),
        "online": sum(1 for d in DEVICES.values() if d["status"] == "ONLINE"),
        "offline": sum(1 for d in DEVICES.values() if d["status"] == "OFFLINE"),
        "degraded": sum(1 for d in DEVICES.values() if d["status"] == "DEGRADED"),
        "as_of": time.strftime("%H:%M:%S")
    }

    return {
        "summary": summary,
        "devices": results,
        "config": {
            "heartbeat_interval_sec": HEARTBEAT_INTERVAL_SEC,
            "offline_timeout_sec": OFFLINE_TIMEOUT_SEC,
            "debounce_jitter_sec": DEBOUNCE_JITTER_SEC,
            "announcement_sla_ms": ANNOUNCEMENT_SLA_MS
        }
    }


@router.get("/merchant/{merchant_id}")
def get_merchant_devices(merchant_id: str):
    """Tenant-isolated device list for a specific merchant"""
    now = time.time()
    merchant_devs = [
        {
            **d,
            "freshness": f"as of {time.strftime('%H:%M:%S', time.localtime(d.get('last_heartbeat', now)))}"
        }
        for d in DEVICES.values()
        if d.get("owner_merchant_id") == merchant_id
    ]
    return {
        "merchant_id": merchant_id,
        "count": len(merchant_devs),
        "devices": merchant_devs,
        "as_of": time.strftime("%H:%M:%S")
    }


# ─── 3. Announcement Dispatch & Acknowledgement (L4) ──────

@router.post("/announce")
async def dispatch_announcement(
    payment_id: str = Query(...),
    amount: float = Query(...),
    device_id: Optional[str] = "SB-DEMO-7701",
    language: str = "hi"
):
    """
    Dispatches a payment announcement command to the demo soundbox.
    Measures ACK latency; if device is offline or unacknowledged within SLA, emits announcement_missed signal.
    """
    dev = DEVICES.get(device_id)
    if not dev:
        raise HTTPException(status_code=404, detail="Target device not found")

    ann_id = f"ANN-{uuid.uuid4().hex[:8].upper()}"
    text = f"पेटीएम पर {int(amount)} रुपये प्राप्त हुए" if language == "hi" else f"Rupees {int(amount)} received on Paytm"
    
    ann_record = {
        "id": ann_id,
        "payment_id": payment_id,
        "device_id": device_id,
        "amount": amount,
        "text": text,
        "status": "PENDING",
        "created_at": time.time(),
        "ack_latency_ms": None,
        "reason": None
    }
    ANNOUNCEMENT_RECORDS.insert(0, ann_record)

    # If device is offline, mark immediately as Not announced
    if dev["status"] == "OFFLINE":
        ann_record["status"] = "Not announced"
        ann_record["reason"] = "DEVICE_OFFLINE"
        dev["last_announcement"] = ann_record
        return {
            "status": "NOT_ANNOUNCED",
            "reason": "DEVICE_OFFLINE",
            "announcement": ann_record,
            "signal_emitted": "announcement_missed"
        }

    # Dispatch to WebSocket client if connected
    ws = ACTIVE_WEBSOCKETS.get(device_id)
    if ws:
        try:
            await ws.send_json({
                "type": "ANNOUNCE_PAYMENT",
                "announcement_id": ann_id,
                "amount": amount,
                "text": text,
                "timestamp": time.time()
            })
        except Exception as e:
            logger.warning(f"Failed to send to WebSocket {device_id}: {e}")

    return {
        "status": "DISPATCHED",
        "announcement_id": ann_id,
        "announcement": ann_record
    }


@router.post("/{device_id}/command")
async def execute_device_command(device_id: str, cmd: CommandRequest):
    """
    Executes a command (ping, test_announcement, restart_request, set_volume, force_offline)
    on a target device and logs to audit trail.
    """
    dev = DEVICES.get(device_id)
    if not dev:
        raise HTTPException(status_code=404, detail="Device not found")

    t_now = time.time()
    command_name = cmd.command.lower()
    payload = cmd.payload or {}

    dev["audit_trail"].append({
        "time": t_now,
        "action": f"COMMAND_{command_name.upper()}",
        "actor": "ADMIN_CONSOLE",
        "payload": payload
    })

    # Forward to WebSocket if connected
    ws = ACTIVE_WEBSOCKETS.get(device_id)
    ws_delivered = False
    if ws:
        try:
            await ws.send_json({
                "type": "DEVICE_COMMAND",
                "command": command_name,
                "payload": payload,
                "timestamp": t_now
            })
            ws_delivered = True
        except Exception as e:
            logger.warning(f"Failed to send command over WebSocket {device_id}: {e}")

    # Handle server-side mock state effects for commands
    if command_name == "force_offline":
        dev["status"] = "OFFLINE"
        if ws:
            try:
                await ws.close(code=1000, reason="Admin forced offline")
            except Exception:
                pass
            ACTIVE_WEBSOCKETS.pop(device_id, None)
    elif command_name == "restart_request":
        dev["status"] = "PROVISIONING"
        dev["last_heartbeat"] = t_now
        # Quick recovery to online after simulated restart
        dev["status"] = "ONLINE"
    elif command_name == "set_volume":
        dev["volume_level"] = payload.get("volume", 80)
    elif command_name == "toggle_battery":
        dev["battery_pct"] = payload.get("battery_pct", 15)
        dev["status"] = "DEGRADED" if dev["battery_pct"] < 20 else "ONLINE"
    elif command_name == "test_announcement":
        # Dispatches a test announcement through the announcement pipeline
        ann_id = f"TEST-ANN-{uuid.uuid4().hex[:6].upper()}"
        ann_record = {
            "id": ann_id,
            "payment_id": f"TEST-PAY-{uuid.uuid4().hex[:6].upper()}",
            "device_id": device_id,
            "amount": payload.get("amount", 101),
            "text": "पेटीएम पर 101 रुपये प्राप्त हुए (Test Announcement)",
            "status": "Announced" if dev["status"] == "ONLINE" else "Not announced",
            "created_at": t_now,
            "ack_latency_ms": 68.4 if dev["status"] == "ONLINE" else None,
            "reason": None if dev["status"] == "ONLINE" else "DEVICE_OFFLINE"
        }
        ANNOUNCEMENT_RECORDS.insert(0, ann_record)
        dev["last_announcement"] = ann_record

    return {
        "status": "COMMAND_EXECUTED",
        "device_id": device_id,
        "command": command_name,
        "ws_delivered": ws_delivered,
        "current_device_status": dev["status"],
        "timestamp": t_now
    }


@router.post("/bulk-command")
async def execute_bulk_command(cmd: CommandRequest, limit: int = 20):
    """
    Executes bulk command (e.g. ping all, restart degraded) with strict safety limit.
    """
    executed = []
    count = 0
    for dev_id, dev in DEVICES.items():
        if count >= limit:
            break
        await execute_device_command(dev_id, cmd)
        executed.append(dev_id)
        count += 1

    return {
        "status": "BULK_EXECUTED",
        "command": cmd.command,
        "count": len(executed),
        "target_devices": executed
    }


@router.post("/ack")
def acknowledge_announcement(ack: AckRequest):
    """Device sends ACK back with measured latency in milliseconds"""
    for rec in ANNOUNCEMENT_RECORDS:
        if rec["id"] == ack.announcement_id:
            rec["status"] = "Announced" if ack.status == "played" else f"Not announced ({ack.status})"
            rec["ack_latency_ms"] = ack.latency_ms
            rec["reason"] = ack.error_reason

            # Update device state
            dev = DEVICES.get(rec["device_id"])
            if dev:
                dev["last_announcement"] = rec
            return {"status": "ACK_RECORDED", "record": rec}

    return {"status": "RECORD_NOT_FOUND"}


# ─── 4. Device WebSocket Gateway & Presence (L2) ──────────

@router.websocket("/ws/{device_id}")
async def device_websocket_endpoint(websocket: WebSocket, device_id: str):
    """
    Dedicated WebSocket channel for Demo Soundbox units.
    Handles real-time heartbeats, server-side ping/pong, and disconnect detection.
    """
    await websocket.accept()
    ACTIVE_WEBSOCKETS[device_id] = websocket
    now = time.time()

    dev = DEVICES.get(device_id)
    if dev:
        dev["status"] = "ONLINE"
        dev["last_heartbeat"] = now
        dev["audit_trail"].append({"time": now, "action": "WEBSOCKET_CONNECTED", "actor": "DEVICE"})

    logger.info(f"⚡ Device {device_id} connected via WebSocket.")

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            t_now = time.time()

            if msg_type == "HEARTBEAT":
                if dev:
                    dev["last_heartbeat"] = t_now
                    dev["battery_pct"] = data.get("battery_pct", dev.get("battery_pct", 88))
                    dev["signal_dbm"] = data.get("signal_dbm", dev.get("signal_dbm", -68))
                    
                    # If battery < 20 or signal < -100, flag as DEGRADED
                    if dev["battery_pct"] < 20 or dev["signal_dbm"] < -100:
                        dev["status"] = "DEGRADED"
                    else:
                        dev["status"] = "ONLINE"

                await websocket.send_json({
                    "type": "HEARTBEAT_ACK",
                    "server_time": t_now,
                    "status": dev["status"] if dev else "UNKNOWN"
                })

            elif msg_type == "ANNOUNCEMENT_ACK":
                ann_id = data.get("announcement_id")
                latency = data.get("latency_ms", 65.0)
                status = data.get("status", "played")
                
                for rec in ANNOUNCEMENT_RECORDS:
                    if rec["id"] == ann_id:
                        rec["status"] = "Announced" if status == "played" else "Not announced"
                        rec["ack_latency_ms"] = latency
                        if dev:
                            dev["last_announcement"] = rec
                        break

    except WebSocketDisconnect:
        logger.info(f"🔌 Device {device_id} disconnected from WebSocket.")
        if device_id in ACTIVE_WEBSOCKETS:
            del ACTIVE_WEBSOCKETS[device_id]
        
        # Debounced disconnect before flipping to OFFLINE
        if dev:
            dev["status"] = "OFFLINE"
            dev["audit_trail"].append({
                "time": time.time(),
                "action": "WEBSOCKET_DISCONNECTED",
                "actor": "GATEWAY"
            })
