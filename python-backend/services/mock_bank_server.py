"""
Tara — Dedicated Real-Time Mock Bank Server & Core Banking Simulator
Provides real-time banking scenarios with dynamic account creation,
live transaction processing, balance mutations, and Server-Sent Events (SSE).
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import time
import uuid
import asyncio
import json
import logging

logger = logging.getLogger("mock-bank-server")
router = APIRouter(prefix="/api/bank", tags=["Mock Bank System"])

# ─── IN-MEMORY STATE ─────────────────────────────────────────────────────────

ACCOUNTS: Dict[str, Dict[str, Any]] = {
    "acc-1": {
        "id": "acc-1",
        "name": "Rahul Sharma",
        "shop_name": "Sharma Kirana & General Store",
        "phone": "9876543210",
        "bank_name": "HDFC Bank",
        "account_number": "4111 1111 1111 1111",
        "ifsc": "HDFC0001245",
        "branch": "Indiranagar, Bengaluru",
        "current_balance": 48250.75,
        "unsettled_balance": 12400.00,
        "status": "ACTIVE",
        "created_at": time.time() - 86400 * 30,
        "soundbox_id": "SB-4421"
    },
    "acc-2": {
        "id": "acc-2",
        "name": "Sneha Gupta",
        "shop_name": "Gupta Daily Supermarket",
        "phone": "9876543211",
        "bank_name": "ICICI Bank",
        "account_number": "5555 5555 5555 4444",
        "ifsc": "ICIC0004921",
        "branch": "Koramangala, Bengaluru",
        "current_balance": 32100.00,
        "unsettled_balance": 5400.00,
        "status": "ACTIVE",
        "created_at": time.time() - 86400 * 25,
        "soundbox_id": "SB-1092"
    },
    "acc-3": {
        "id": "acc-3",
        "name": "Ankit Verma",
        "shop_name": "Verma Medicals & Clinic",
        "phone": "9876543212",
        "bank_name": "State Bank of India",
        "account_number": "4222 2222 2222 2222",
        "ifsc": "SBIN0008812",
        "branch": "MG Road, Pune",
        "current_balance": 74500.50,
        "unsettled_balance": 18200.00,
        "status": "ACTIVE",
        "created_at": time.time() - 86400 * 60,
        "soundbox_id": "SB-3301"
    },
    "acc-4": {
        "id": "acc-4",
        "name": "Priya Desai",
        "shop_name": "Chai & Conversations Café",
        "phone": "9876543213",
        "bank_name": "Axis Bank",
        "account_number": "6011 0000 0000 0000",
        "ifsc": "UTIB0002130",
        "branch": "Bandra West, Mumbai",
        "current_balance": 19800.25,
        "unsettled_balance": 3200.00,
        "status": "ACTIVE",
        "created_at": time.time() - 86400 * 15,
        "soundbox_id": "SB-8820"
    }
}

TRANSACTIONS: List[Dict[str, Any]] = [
    {
        "id": "TXN-90812",
        "account_id": "acc-1",
        "amount": 500.00,
        "type": "UPI_CREDIT",
        "payer_name": "Vikram Singh",
        "payer_vpa": "vikram@okhdfcbank",
        "note": "Groceries purchase",
        "soundbox_announced": True,
        "announcement_text": "Paytm par ₹500 prapt hue",
        "timestamp": time.time() - 180,
        "status": "SUCCESS"
    },
    {
        "id": "TXN-90811",
        "account_id": "acc-1",
        "amount": 250.00,
        "type": "UPI_CREDIT",
        "payer_name": "Ayesha Khan",
        "payer_vpa": "ayesha@paytm",
        "note": "Dairy and snacks",
        "soundbox_announced": True,
        "announcement_text": "Paytm par ₹250 prapt hue",
        "timestamp": time.time() - 850,
        "status": "SUCCESS"
    },
    {
        "id": "TXN-90810",
        "account_id": "acc-1",
        "amount": 4280.00,
        "type": "SETTLEMENT_PAYOUT",
        "payer_name": "Paytm Settlement Nodal Escrow",
        "payer_vpa": "nodal.settlement@paytm",
        "note": "Daily automated settlement batch #8912",
        "soundbox_announced": False,
        "announcement_text": None,
        "timestamp": time.time() - 7200,
        "status": "SUCCESS"
    }
]

# Subscribers for Server-Sent Events (SSE)
EVENT_LISTENERS: List[asyncio.Queue] = []


def notify_listeners(event_data: dict):
    """Dispatches real-time banking event to all active SSE subscribers."""
    dead_queues = []
    for queue in EVENT_LISTENERS:
        try:
            queue.put_nowait(event_data)
        except asyncio.QueueFull:
            dead_queues.append(queue)
    for q in dead_queues:
        if q in EVENT_LISTENERS:
            EVENT_LISTENERS.remove(q)


# ─── REQUEST MODELS ──────────────────────────────────────────────────────────

class CreateAccountRequest(BaseModel):
    name: str = Field(..., description="Account holder full name")
    shop_name: str = Field(..., description="Store or business name")
    bank_name: str = Field(..., description="Bank name (e.g. HDFC, ICICI, SBI)")
    account_number: Optional[str] = None
    ifsc: Optional[str] = None
    phone: Optional[str] = "9876543210"
    initial_balance: float = Field(25000.00, ge=0)


class CreateTransactionRequest(BaseModel):
    account_id: str
    amount: float
    type: str = "UPI_CREDIT"  # UPI_CREDIT | SETTLEMENT_PAYOUT | REFUND_DEBIT
    payer_name: str = "Customer via UPI"
    payer_vpa: str = "customer@upi"
    note: Optional[str] = "In-store QR payment"


# ─── ENDPOINTS ───────────────────────────────────────────────────────────────

@router.get("/accounts")
def list_accounts():
    """Retrieve all mock bank accounts with live balances and transaction count."""
    result = []
    for acc_id, acc in ACCOUNTS.items():
        tx_count = sum(1 for t in TRANSACTIONS if t["account_id"] == acc_id)
        result.append({
            **acc,
            "transaction_count": tx_count
        })
    return {"status": "SUCCESS", "accounts": result, "server_time": time.time()}


@router.post("/accounts")
def create_account(req: CreateAccountRequest):
    """
    Create a new real-time bank account for testing scenarios.
    Instantly available for simulated transactions, settlements, and live dashboard.
    """
    new_id = f"acc-{uuid.uuid4().hex[:6]}"
    acc_num = req.account_number or f"{''.join([str(int(time.time() * 1000) % 9) for _ in range(4)])} " * 4
    acc_num = acc_num.strip()
    
    ifsc_code = req.ifsc or f"{req.bank_name[:4].upper()}000{int(time.time() % 9000 + 1000)}"

    account = {
        "id": new_id,
        "name": req.name,
        "shop_name": req.shop_name,
        "phone": req.phone,
        "bank_name": req.bank_name,
        "account_number": acc_num,
        "ifsc": ifsc_code,
        "branch": "Digital Gateway Branch, Mumbai",
        "current_balance": req.initial_balance,
        "unsettled_balance": 0.0,
        "status": "ACTIVE",
        "created_at": time.time(),
        "soundbox_id": f"SB-{uuid.uuid4().hex[:4].upper()}"
    }

    ACCOUNTS[new_id] = account

    # Send SSE broadcast
    notify_listeners({
        "type": "ACCOUNT_CREATED",
        "account": account,
        "timestamp": time.time()
    })

    # Dispatch SMS to user's phone via AWS SNS
    sms_dispatched = False
    sms_error = None
    if req.phone:
        try:
            import os
            import boto3
            ak = os.getenv("AWS_ACCESS_KEY_ID")
            sk = os.getenv("AWS_SECRET_ACCESS_KEY")
            reg = os.getenv("AWS_REGION", "us-east-1")
            formatted_phone = req.phone if req.phone.startswith("+") else f"+91{req.phone}"
            last_four = acc_num[-4:] if len(acc_num) >= 4 else "XXXX"
            msg = f"Dear {req.name}, your {req.bank_name} account (...{last_four}) for {req.shop_name} has been linked to Tara AI Teammate. Real-time settlements and Soundbox failover are active."
            if ak and sk:
                sns = boto3.client("sns", aws_access_key_id=ak, aws_secret_access_key=sk, region_name=reg)
                sns.publish(PhoneNumber=formatted_phone, Message=msg)
                sms_dispatched = True
                gateway = f"AWS SNS ({reg})"
                logger.info(f"✅ Bank account creation SMS dispatched via AWS SNS to {formatted_phone}")
            else:
                logger.info(f"Simulated SMS dispatched to {formatted_phone}: {msg}")
                sms_dispatched = True
                gateway = "Tara Indian SMS Gateway (Simulated)"
        except Exception as e:
            sms_error = str(e)
            logger.warning(f"AWS SNS bank account creation SMS warning ({e}). Falling back to simulated SMS gateway.")
            sms_dispatched = True
            gateway = "Tara Indian SMS Gateway (Fallback: IAM SNS:Publish missing)"

    return {
        "status": "ACCOUNT_CREATED",
        "message": f"Real-time mock bank account created for {req.name} at {req.bank_name}",
        "account": account,
        "sms_dispatched": sms_dispatched,
        "sms_phone": req.phone,
        "sms_gateway": gateway if req.phone else None,
        "sms_error": sms_error
    }


@router.get("/accounts/{account_id}")
def get_account(account_id: str):
    """Get single bank account state and real-time ledger."""
    if account_id not in ACCOUNTS:
        raise HTTPException(status_code=404, detail="Account not found")
    acc = ACCOUNTS[account_id]
    txs = [t for t in TRANSACTIONS if t["account_id"] == account_id]
    return {
        "status": "SUCCESS",
        "account": acc,
        "recent_transactions": sorted(txs, key=lambda x: x["timestamp"], reverse=True)[:20]
    }


@router.get("/accounts/{account_id}/transactions")
def get_account_transactions(account_id: str):
    """Retrieve full transaction feed for a specific bank account."""
    if account_id not in ACCOUNTS:
        raise HTTPException(status_code=404, detail="Account not found")
    txs = [t for t in TRANSACTIONS if t["account_id"] == account_id]
    return {
        "status": "SUCCESS",
        "account_id": account_id,
        "transactions": sorted(txs, key=lambda x: x["timestamp"], reverse=True)
    }


@router.post("/transactions")
def create_transaction(req: CreateTransactionRequest):
    """
    Process a real-time transaction on a bank account.
    Immediately mutates balance, triggers soundbox notification event, and streams live via SSE.
    """
    if req.account_id not in ACCOUNTS:
        raise HTTPException(status_code=404, detail=f"Account {req.account_id} not found")

    account = ACCOUNTS[req.account_id]
    amount = float(req.amount)
    
    # Balance mutation
    if req.type in ["UPI_CREDIT", "SETTLEMENT_PAYOUT"]:
        account["current_balance"] = round(account["current_balance"] + amount, 2)
    elif req.type in ["REFUND_DEBIT", "FEE_DEDUCTION"]:
        if account["current_balance"] < amount:
            raise HTTPException(status_code=400, detail="Insufficient funds in mock bank account")
        account["current_balance"] = round(account["current_balance"] - amount, 2)

    # Soundbox voice broadcast simulation
    is_upi = req.type == "UPI_CREDIT"
    announcement = f"Paytm par ₹{int(amount)} prapt hue" if is_upi else None

    txn = {
        "id": f"TXN-{uuid.uuid4().hex[:8].upper()}",
        "account_id": req.account_id,
        "amount": amount,
        "type": req.type,
        "payer_name": req.payer_name,
        "payer_vpa": req.payer_vpa,
        "note": req.note,
        "soundbox_announced": is_upi,
        "announcement_text": announcement,
        "soundbox_id": account.get("soundbox_id", "SB-4421"),
        "timestamp": time.time(),
        "status": "SUCCESS"
    }

    TRANSACTIONS.insert(0, txn)

    # Real-time SSE notification
    notify_listeners({
        "type": "TRANSACTION_PROCESSED",
        "transaction": txn,
        "new_balance": account["current_balance"],
        "account_id": req.account_id,
        "timestamp": time.time()
    })

    return {
        "status": "TRANSACTION_PROCESSED",
        "transaction": txn,
        "current_balance": account["current_balance"]
    }


@router.post("/simulate-flow")
def simulate_flow(account_id: str, count: int = 3):
    """Simulates a realistic burst of UPI customer payments in real-time."""
    if account_id not in ACCOUNTS:
        raise HTTPException(status_code=404, detail="Account not found")

    amounts = [20.0, 150.0, 480.0, 95.0, 750.0, 1200.0]
    names = ["Karan Mehta", "Pooja Hegde", "Arjun Nair", "Divya Patel", "Manish Joshi"]
    vpas = ["karan@upi", "pooja@okhdfc", "arjun@paytm", "divya@icici", "manish@sbi"]

    created = []
    for i in range(min(count, 5)):
        amt = amounts[i % len(amounts)]
        req = CreateTransactionRequest(
            account_id=account_id,
            amount=amt,
            type="UPI_CREDIT",
            payer_name=names[i % len(names)],
            payer_vpa=vpas[i % len(vpas)],
            note=f"Store UPI payment #{i+1}"
        )
        res = create_transaction(req)
        created.append(res["transaction"])

    return {
        "status": "SIMULATION_COMPLETE",
        "account_id": account_id,
        "transactions_created": created,
        "new_balance": ACCOUNTS[account_id]["current_balance"]
    }


@router.get("/stream")
async def event_stream():
    """
    Server-Sent Events (SSE) live stream.
    The frontend connects here to receive instant updates when any bank account,
    transaction, settlement, or balance change occurs without polling.
    """
    queue = asyncio.Queue(maxsize=100)
    EVENT_LISTENERS.append(queue)

    async def event_generator():
        try:
            # Initial connection ping
            yield f"data: {json.dumps({'type': 'CONNECTED', 'time': time.time()})}\n\n"
            while True:
                data = await queue.get()
                yield f"data: {json.dumps(data)}\n\n"
        except asyncio.CancelledError:
            if queue in EVENT_LISTENERS:
                EVENT_LISTENERS.remove(queue)
            raise

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*"
        }
    )
