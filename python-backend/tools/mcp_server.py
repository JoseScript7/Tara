from langchain_core.tools import tool
from pydantic import BaseModel, Field
import uuid
import datetime
from typing import Optional

# ─────────────────────────────────────────────
# Mock Backend State (shared across all tools)
# ─────────────────────────────────────────────
mock_approvals = []

# ─────────────────────────────────────────────
# Mock CRM / Account Database
# ─────────────────────────────────────────────
MOCK_ACCOUNTS = {
    "M_DISPUTE_TAT": {
        "merchant_id": "M_DISPUTE_TAT",
        "name": "Kumar General Store",
        "tier": "premium",
        "balance": 47250.00,
        "transactions": [
            {"id": "TXN001", "amount": 1850.0, "type": "UPI_P2M", "status": "settled", "date": "2026-09-16"},
            {"id": "TXN002", "amount": 3200.0, "type": "UPI_P2M", "status": "settled", "date": "2026-09-16"},
            {"id": "TXN003", "amount": 750.0, "type": "UPI_P2M", "status": "pending", "date": "2026-09-17"},
            {"id": "TXN004", "amount": 12000.0, "type": "CARD", "status": "disputed", "date": "2026-09-14"},
        ],
        "disputes": [
            {
                "id": "DSP001", "transaction_id": "TXN004", "amount": 12000.0,
                "type": "double_charge", "status": "open",
                "filed_date": "2026-09-14", "tat_deadline": "2026-09-19",
                "days_remaining": 2
            }
        ],
        "settlements": [
            {"date": "2026-09-15", "amount": 24800.0, "status": "completed", "tat": "T+1"},
            {"date": "2026-09-16", "amount": 18900.0, "status": "pending", "tat": "T+1"},
        ],
        "device_telemetry": {
            "soundbox": {"id": "SB-4421", "status": "online", "battery": 78, "last_ping": "2026-09-17T00:30:00"},
            "pos_terminal": {"id": "POS-9982", "status": "online", "last_ping": "2026-09-17T00:28:00"},
        },
        "loan_eligibility": {"eligible": True, "max_amount": 500000, "interest_rate": 12.5, "tenure_months": 24},
    },
    "M_STANDARD": {
        "merchant_id": "M_STANDARD",
        "name": "Sharma Electronics",
        "tier": "standard",
        "balance": 12340.00,
        "transactions": [
            {"id": "TXN010", "amount": 450.0, "type": "UPI_P2M", "status": "settled", "date": "2026-09-16"},
        ],
        "disputes": [],
        "settlements": [
            {"date": "2026-09-16", "amount": 450.0, "status": "completed", "tat": "T+1"},
        ],
        "device_telemetry": {
            "soundbox": {"id": "SB-1102", "status": "offline", "battery": 12, "last_ping": "2026-09-16T18:00:00"},
        },
        "loan_eligibility": {"eligible": False, "max_amount": 0, "interest_rate": 0, "tenure_months": 0},
    },
}


# ──────────────────────────────────────────────────────────
# Tool 1: Draft Compensation Credit (State-Mutating, HITL)
# ──────────────────────────────────────────────────────────
class DraftCompensationCreditInput(BaseModel):
    merchant_id: str = Field(description="Verified merchant ID")
    amount: float = Field(description="Compensation amount in INR")
    reason: str = Field(description="Justification for the credit")

@tool("draft_compensation_credit", args_schema=DraftCompensationCreditInput)
def draft_compensation_credit(merchant_id: str, amount: float, reason: str) -> dict:
    """Drafts a compensation credit for a merchant account. This is a state-mutating action that creates a PENDING_APPROVAL record. Requires human approval if amount > ₹100."""
    action = {
        "id": str(uuid.uuid4()),
        "type": "CREDIT_COMPENSATION",
        "payload": {"merchant_id": merchant_id, "amount": amount, "reason": reason},
        "status": "PENDING_APPROVAL",
        "created_at": datetime.datetime.now().isoformat()
    }
    mock_approvals.append(action)
    return action


# ──────────────────────────────────────────────────────────
# Tool 2: Raise Device Replacement (State-Mutating, HITL)
# ──────────────────────────────────────────────────────────
class RaiseDeviceReplacementInput(BaseModel):
    merchant_id: str = Field(description="Verified merchant ID")
    device_id: str = Field(description="ID of the device to replace")
    reason: str = Field(description="Reason for replacement")

@tool("raise_device_replacement", args_schema=RaiseDeviceReplacementInput)
def raise_device_replacement(merchant_id: str, device_id: str, reason: str) -> dict:
    """Raises a request to replace a physical merchant device (e.g. Soundbox or POS). State-mutating action requiring approval."""
    action = {
        "id": str(uuid.uuid4()),
        "type": "DEVICE_REPLACEMENT",
        "payload": {"merchant_id": merchant_id, "device_id": device_id, "reason": reason},
        "status": "PENDING_APPROVAL",
        "created_at": datetime.datetime.now().isoformat()
    }
    mock_approvals.append(action)
    return action


# ──────────────────────────────────────────────────────────
# Tool 3: Flag TAT Breach (State-Mutating, HITL)
# ──────────────────────────────────────────────────────────
class FlagTATBreachInput(BaseModel):
    merchant_id: str = Field(description="Verified merchant ID")
    dispute_id: str = Field(description="ID of the dispute that is breaching TAT")
    breach_type: str = Field(description="Type of TAT breach: settlement or dispute")

@tool("flag_tat_breach", args_schema=FlagTATBreachInput)
def flag_tat_breach(merchant_id: str, dispute_id: str, breach_type: str) -> dict:
    """Flags a Turn-Around-Time (TAT) breach for a dispute or settlement. Creates a PENDING_APPROVAL record for review."""
    action = {
        "id": str(uuid.uuid4()),
        "type": "TAT_BREACH_FLAG",
        "payload": {"merchant_id": merchant_id, "dispute_id": dispute_id, "breach_type": breach_type},
        "status": "PENDING_APPROVAL",
        "created_at": datetime.datetime.now().isoformat()
    }
    mock_approvals.append(action)
    return action


# ──────────────────────────────────────────────────────────
# Tool 4: Lookup Account (Read-Only Query, No HITL needed)
# ──────────────────────────────────────────────────────────
class LookupAccountInput(BaseModel):
    merchant_id: str = Field(description="Merchant ID to look up")
    fields: Optional[str] = Field(
        default="all",
        description="Comma-separated fields to retrieve: transactions,disputes,settlements,device_telemetry,loan_eligibility,all"
    )

@tool("lookup_account", args_schema=LookupAccountInput)
def lookup_account(merchant_id: str, fields: Optional[str] = "all") -> dict:
    """Looks up a merchant's account data from the CRM database. This is a read-only query tool — no approval needed. Returns requested fields: transactions, disputes, settlements, device_telemetry, loan_eligibility."""
    account = MOCK_ACCOUNTS.get(merchant_id)
    if not account:
        return {"error": f"Merchant {merchant_id} not found", "available_merchants": list(MOCK_ACCOUNTS.keys())}

    if fields == "all":
        return account

    result = {"merchant_id": merchant_id, "name": account.get("name", ""), "tier": account.get("tier", "")}
    for field in fields.split(","):
        field = field.strip()
        if field in account:
            result[field] = account[field]
    return result


# ──────────────────────────────────────────────
# Tool Registry (for dynamic MCP discovery)
# ──────────────────────────────────────────────
STATE_MUTATING_TOOLS = {
    "draft_compensation_credit": draft_compensation_credit,
    "raise_device_replacement": raise_device_replacement,
    "flag_tat_breach": flag_tat_breach,
}

QUERY_TOOLS = {
    "lookup_account": lookup_account,
}

TOOLS = [draft_compensation_credit, raise_device_replacement, flag_tat_breach, lookup_account]

TOOL_REGISTRY = {
    t.name: {
        "name": t.name,
        "description": t.description,
        "is_state_mutating": t.name in STATE_MUTATING_TOOLS,
        "schema": t.args_schema.model_json_schema() if t.args_schema else {},
    }
    for t in TOOLS
}
