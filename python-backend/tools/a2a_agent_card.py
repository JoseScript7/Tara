"""
A2A (Agent-to-Agent) Protocol - Agent Card Discovery
Implements the Agent Card specification for horizontal skill discovery.
External vendor agents can discover Tara's capabilities via this card.
"""
import json
from typing import List, Dict, Any
from tools.mcp_server import TOOL_REGISTRY


def get_agent_card() -> Dict[str, Any]:
    """
    Returns the A2A Agent Card for Tara.
    This card allows external agents to discover Tara's capabilities,
    supported input/output schemas, and skill endpoints.
    """
    return {
        "name": "Tara",
        "version": "2.0.0",
        "description": "Autonomous Enterprise Billing & Dispute Resolution Agent for Paytm merchants",
        "protocol": "a2a/1.0",
        "url": "http://localhost:8000",
        "capabilities": {
            "streaming": False,
            "pushNotifications": False,
            "stateTransitionHistory": True,
        },
        "skills": [
            {
                "id": "billing_dispute_resolution",
                "name": "Billing & Dispute Resolution",
                "description": "Handles merchant billing queries, dispute resolution, TAT breach flagging, and compensation drafting",
                "inputModes": ["text/plain"],
                "outputModes": ["text/plain", "application/json"],
                "tools": list(TOOL_REGISTRY.keys()),
            },
            {
                "id": "account_query",
                "name": "Account Query",
                "description": "Reads merchant CRM data: transactions, settlements, device telemetry, loan eligibility",
                "inputModes": ["text/plain"],
                "outputModes": ["application/json"],
                "tools": ["lookup_account"],
            },
        ],
        "authentication": {
            "type": "bearer",
            "required": False,  # Demo mode
        },
        "defaultInputModes": ["text/plain"],
        "defaultOutputModes": ["text/plain"],
    }


def discover_tools() -> List[Dict[str, Any]]:
    """
    MCP-style dynamic tool discovery.
    Returns JSON-RPC 2.0 compatible tool definitions.
    """
    tools = []
    for name, meta in TOOL_REGISTRY.items():
        tools.append({
            "jsonrpc": "2.0",
            "method": "tools/register",
            "params": {
                "name": name,
                "description": meta["description"],
                "inputSchema": meta["schema"],
                "is_state_mutating": meta["is_state_mutating"],
            }
        })
    return tools
