"""
Tara MCP Tool Server — Standalone Process

Exposes Phase 4 fixture-backed tools as a proper MCP server using FastMCP.
Runs as a separate process from the LangGraph backend.
Includes a deliberately-failing tool (ledger_lookup_timeout) for LATS retry testing.

Start: python3 tools/mcp_tool_server.py
"""
from mcp.server.mcpserver import MCPServer
import uuid
import datetime
import time
import random

mcp = MCPServer("Tara Merchant Tools")

# ─────────────────────────────────────────────
# Shared State
# ─────────────────────────────────────────────
mock_approvals: list = []

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
# Tool 1: Ledger Lookup (Read-Only)
# ──────────────────────────────────────────────────────────
@mcp.tool()
def lookup_account(merchant_id: str, fields: str = "all") -> dict:
    """Looks up a merchant's account data from the CRM database.
    Read-only query — no approval needed.
    Returns: transactions, disputes, settlements, device_telemetry, loan_eligibility."""
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


# ──────────────────────────────────────────────────────────
# Tool 2: Draft Compensation Credit (State-Mutating, HITL)
# ──────────────────────────────────────────────────────────
@mcp.tool()
def draft_compensation_credit(merchant_id: str, amount: float, reason: str) -> dict:
    """Drafts a compensation credit for a merchant account.
    State-mutating action that creates a PENDING_APPROVAL record.
    Requires human approval if amount > ₹100."""
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
# Tool 3: Raise Device Replacement (State-Mutating, HITL)
# ──────────────────────────────────────────────────────────
@mcp.tool()
def raise_device_replacement(merchant_id: str, device_id: str, reason: str) -> dict:
    """Raises a request to replace a physical merchant device (Soundbox or POS).
    State-mutating action requiring human approval."""
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
# Tool 4: Flag TAT Breach (State-Mutating, HITL)
# ──────────────────────────────────────────────────────────
@mcp.tool()
def flag_tat_breach(merchant_id: str, dispute_id: str, breach_type: str) -> dict:
    """Flags a Turn-Around-Time (TAT) breach for a dispute or settlement.
    Creates a PENDING_APPROVAL record for review."""
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
# Tool 5: Deliberately-Failing Tool (for LATS retry testing)
# ──────────────────────────────────────────────────────────
_ledger_call_count = 0

@mcp.tool()
def ledger_deep_lookup(merchant_id: str, transaction_id: str) -> dict:
    """Performs a deep ledger lookup for a specific transaction, querying the core banking API.
    WARNING: This call sometimes times out due to upstream latency."""
    global _ledger_call_count
    _ledger_call_count += 1

    # First 2 calls always fail to test LATS retry.
    # 3rd call succeeds with cached data.
    if _ledger_call_count <= 2:
        raise TimeoutError(
            f"Ledger API timeout: upstream banking service did not respond within 5000ms "
            f"(attempt {_ledger_call_count}/3). Retry with cached snapshot if available."
        )

    # Success on 3rd attempt (simulating cache fallback)
    account = MOCK_ACCOUNTS.get(merchant_id, {})
    txn = next((t for t in account.get("transactions", []) if t["id"] == transaction_id), None)
    _ledger_call_count = 0  # Reset for next demo
    return {
        "source": "cached_settlement_snapshot",
        "transaction": txn or {"error": "Not found"},
        "note": "Retrieved from settlement cache after upstream timeout"
    }


if __name__ == "__main__":
    print("Starting Tara MCP Tool Server on stdio...")
    mcp.run(transport="stdio")
