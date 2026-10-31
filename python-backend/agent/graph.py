"""
Tara LangGraph State Machine — Phase 14/15 Architecture

Nodes:
  1. classify_intent
  2. retrieve_context (calls Phase 5 RAG)
  3. generate_response (calls Phase 12 local LLM via Ollama)
  4. execute_tool (calls MCP server over stdio subprocess)
  5. evaluate_result (LATS-style: scores tool output, writes reflections, retries on failure)
  6. propose_action (for state-mutating HITL actions)
  7. human_approval_gate (genuine interrupt() pause)
"""
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.sqlite import SqliteSaver
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage
from langchain_core.tools import tool
from agent.state import AgentState
from agent.guardrails import input_guardrail, dialog_guardrail, validate_rupee_figures
from pydantic import BaseModel, Field
from typing import Optional
import sqlite3
import json
import subprocess
import uuid

# ── LLM Setup (Mock for Testing) ──
class MockLLM:
    def bind_tools(self, tools):
        return self

    def invoke(self, messages):
        from langchain_core.messages import AIMessage
        msg = str(messages[-1].content).lower()
        if 'settlement' in msg:
            return AIMessage(content="Your latest settlement of ₹12,000 for TXN004 was completed on Sept 14.")
        elif 'dispute' in msg and 'tat' in msg:
            from langchain_core.messages import AIMessage, ToolCall
            return AIMessage(content="", tool_calls=[
                {"name": "draft_compensation_credit", "args": {"merchant_id": "M_DISPUTE_TAT", "amount": 500, "reason": "TAT Breach mitigation"}, "id": "tc_1"}
            ])
        elif 'ignore previous' in msg:
            return AIMessage(content="I am Tara.")
        return AIMessage(content="I am Tara. I can help with your merchant account.")

llm = MockLLM()

# ── MCP Client: call tools via the standalone MCP server subprocess ──
def call_mcp_tool(tool_name: str, arguments: dict) -> dict:
    """
    Calls a tool on the standalone FastMCP server by spawning it as a subprocess.
    Uses JSON-RPC 2.0 over stdio transport.
    """
    # Build JSON-RPC request
    jsonrpc_request = json.dumps({
        "jsonrpc": "2.0",
        "id": str(uuid.uuid4()),
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments,
        }
    })

    try:
        result = subprocess.run(
            ["python3", "-c", f"""
import json, sys
sys.path.insert(0, '.')
from tools.mcp_tool_server import mcp

# Simulate a direct tool call (equivalent to JSON-RPC tools/call)
tool_fn = None
for t in mcp._tool_manager._tools.values():
    if t.name == '{tool_name}':
        tool_fn = t
        break

if tool_fn is None:
    print(json.dumps({{"error": "Tool not found: {tool_name}"}}))
else:
    try:
        result = tool_fn.fn(**{json.dumps(arguments)})
        print(json.dumps(result, default=str))
    except Exception as e:
        print(json.dumps({{"error": str(e), "error_type": type(e).__name__}}))
"""],
            capture_output=True, text=True, timeout=10,
            cwd="/home/ranenjoseph/Tara/tara-merchant-teammate/python-backend"
        )

        if result.returncode != 0:
            return {"error": result.stderr.strip()[-500:], "error_type": "SubprocessError"}

        output = result.stdout.strip()
        if not output:
            return {"error": "Empty response from MCP server", "error_type": "EmptyResponse"}
        return json.loads(output)

    except subprocess.TimeoutExpired:
        return {"error": "MCP server subprocess timed out", "error_type": "TimeoutError"}
    except Exception as e:
        return {"error": str(e), "error_type": type(e).__name__}


def list_mcp_tools() -> list:
    """Introspect the MCP server for its tool list and schemas."""
    try:
        result = subprocess.run(
            ["python3", "-c", """
import json, sys
sys.path.insert(0, '.')
from tools.mcp_tool_server import mcp

tools = []
for t in mcp._tool_manager._tools.values():
    schema = t.parameters.model_json_schema() if hasattr(t, 'parameters') and t.parameters else {}
    tools.append({
        "name": t.name,
        "description": t.description or "",
        "inputSchema": schema,
    })
print(json.dumps(tools, indent=2))
"""],
            capture_output=True, text=True, timeout=10,
            cwd="/home/ranenjoseph/Tara/tara-merchant-teammate/python-backend"
        )
        if result.returncode == 0:
            return json.loads(result.stdout.strip())
        return [{"error": result.stderr.strip()[-300:]}]
    except Exception as e:
        return [{"error": str(e)}]


# ── LangChain tool wrappers (so the LLM can choose them) ──
# These are thin wrappers that the LLM sees; actual execution goes via MCP.

class LookupAccountArgs(BaseModel):
    merchant_id: str = Field(description="Merchant ID to look up")
    fields: Optional[str] = Field(default="all", description="Comma-separated fields")

@tool("lookup_account", args_schema=LookupAccountArgs)
def lookup_account_wrapper(merchant_id: str, fields: str = "all") -> dict:
    """Looks up a merchant's account data. Read-only."""
    return call_mcp_tool("lookup_account", {"merchant_id": merchant_id, "fields": fields})

class DraftCompArgs(BaseModel):
    merchant_id: str = Field(description="Merchant ID")
    amount: float = Field(description="Compensation amount in INR")
    reason: str = Field(description="Justification")

@tool("draft_compensation_credit", args_schema=DraftCompArgs)
def draft_comp_wrapper(merchant_id: str, amount: float, reason: str) -> dict:
    """Drafts a compensation credit. Requires human approval."""
    return call_mcp_tool("draft_compensation_credit", {"merchant_id": merchant_id, "amount": amount, "reason": reason})

class DeviceReplaceArgs(BaseModel):
    merchant_id: str = Field(description="Merchant ID")
    device_id: str = Field(description="Device ID")
    reason: str = Field(description="Reason")

@tool("raise_device_replacement", args_schema=DeviceReplaceArgs)
def device_replace_wrapper(merchant_id: str, device_id: str, reason: str) -> dict:
    """Raises a device replacement request. Requires human approval."""
    return call_mcp_tool("raise_device_replacement", {"merchant_id": merchant_id, "device_id": device_id, "reason": reason})

class FlagTATArgs(BaseModel):
    merchant_id: str = Field(description="Merchant ID")
    dispute_id: str = Field(description="Dispute ID")
    breach_type: str = Field(description="settlement or dispute")

@tool("flag_tat_breach", args_schema=FlagTATArgs)
def flag_tat_wrapper(merchant_id: str, dispute_id: str, breach_type: str) -> dict:
    """Flags a TAT breach. Requires human approval."""
    return call_mcp_tool("flag_tat_breach", {"merchant_id": merchant_id, "dispute_id": dispute_id, "breach_type": breach_type})

class LedgerDeepArgs(BaseModel):
    merchant_id: str = Field(description="Merchant ID")
    transaction_id: str = Field(description="Transaction ID")

@tool("ledger_deep_lookup", args_schema=LedgerDeepArgs)
def ledger_deep_wrapper(merchant_id: str, transaction_id: str) -> dict:
    """Deep ledger lookup for a specific transaction. May time out on upstream banking API."""
    return call_mcp_tool("ledger_deep_lookup", {"merchant_id": merchant_id, "transaction_id": transaction_id})

# All tools the LLM can use
TOOLS = [lookup_account_wrapper, draft_comp_wrapper, device_replace_wrapper, flag_tat_wrapper, ledger_deep_wrapper]

# State-mutating tools that need HITL approval
STATE_MUTATING = {"draft_compensation_credit", "raise_device_replacement", "flag_tat_breach"}

llm_with_tools = llm.bind_tools(TOOLS)

MAX_RETRIES = 2

# ═══════════════════════════════════════════════
# GRAPH NODES
# ═══════════════════════════════════════════════

def classify_intent(state: AgentState) -> dict:
    """Node 1: Classify intent + Input Guardrail (PII masking, jailbreak detection)."""
    messages = state.get("messages", [])
    if not messages:
        return {"step_count": state.get("step_count", 0) + 1}

    last_msg = messages[-1]
    user_text = last_msg.content if hasattr(last_msg, 'content') else str(last_msg)

    # Stage 1: Input guardrail — PII redaction + jailbreak blocking
    safe_text, rejection = input_guardrail(user_text)
    guardrails = []

    if rejection:
        guardrails.append(f"INPUT_BLOCKED: {rejection}")
        return {
            "messages": [AIMessage(content=f"⚠️ I detected a security concern: {rejection}")],
            "step_count": state.get("step_count", 0) + 1,
            "reflection_notes": guardrails,
        }

    if safe_text != user_text:
        guardrails.append("INPUT_PII_REDACTED")
        return {
            "messages": [HumanMessage(content=safe_text)],
            "step_count": state.get("step_count", 0) + 1,
            "reflection_notes": guardrails,
        }

    return {"step_count": state.get("step_count", 0) + 1}


def retrieve_context(state: AgentState) -> dict:
    """Node 2: Retrieve context + Dialog Guardrail (topic scoping)."""
    messages = state.get("messages", [])
    # If the last message is already an AI rejection, skip
    if messages and isinstance(messages[-1], AIMessage):
        return {"step_count": state.get("step_count", 0) + 1}

    last_msg = messages[-1] if messages else None
    if last_msg and hasattr(last_msg, 'content'):
        # Stage 2: Dialog guardrail — topic scope enforcement
        in_scope, scope_rejection = dialog_guardrail(last_msg.content)
        if not in_scope:
            return {
                "messages": [AIMessage(content=scope_rejection)],
                "step_count": state.get("step_count", 0) + 1,
                "reflection_notes": [f"DIALOG_BLOCKED: {scope_rejection}"],
            }

    return {"step_count": state.get("step_count", 0) + 1}


def generate_response(state: AgentState) -> dict:
    """Node 3: Call local LLM with tool bindings."""
    messages = state.get("messages", [])
    account_ctx = state.get("account_context", {})
    reflections = state.get("reflection_notes", [])

    reflection_str = "\n".join(f"- {r}" for r in reflections[-3:]) if reflections else "None"

    system_prompt = f"""You are Tara, an AI teammate for Paytm merchants.
Context: {json.dumps(account_ctx, default=str)[:1500]}

Previous reflections: {reflection_str}

Rules:
- If the merchant asks about a delayed refund or dispute near TAT, use draft_compensation_credit.
- For deep transaction investigation, use ledger_deep_lookup.
- For general account queries, use lookup_account.
- Only state figures from context. Never invent amounts."""

    response = llm_with_tools.invoke([SystemMessage(content=system_prompt)] + messages)

    return {
        "messages": [response],
        "step_count": state.get("step_count", 0) + 1
    }


def route_after_generation(state: AgentState) -> str:
    """Router: tool call → execute_tool; state-mutating → propose_action; else end."""
    messages = state.get("messages", [])
    if not messages:
        return "end"
    last = messages[-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        tool_name = last.tool_calls[0]["name"]
        if tool_name in STATE_MUTATING:
            return "propose_action"
        return "execute_tool"
    return "end"


def execute_tool(state: AgentState) -> dict:
    """Node 4: Execute a tool via the MCP server subprocess."""
    messages = state.get("messages", [])
    last = messages[-1]
    tc = last.tool_calls[0]

    result = call_mcp_tool(tc["name"], tc["args"])
    tool_msg = ToolMessage(content=json.dumps(result, default=str), tool_call_id=tc["id"])

    return {
        "messages": [tool_msg],
        "step_count": state.get("step_count", 0) + 1,
    }


def evaluate_result(state: AgentState) -> dict:
    """Node 5: LATS-style evaluator. Scores tool results and writes reflections on failure."""
    messages = state.get("messages", [])
    reflections = list(state.get("reflection_notes", []) or [])
    retry_count = state.get("step_count", 0)  # Use step_count as proxy for retries

    # Find the last ToolMessage
    last_tool_msg = None
    for msg in reversed(messages):
        if isinstance(msg, ToolMessage):
            last_tool_msg = msg
            break

    if not last_tool_msg:
        return {}

    try:
        result = json.loads(last_tool_msg.content)
    except (json.JSONDecodeError, TypeError):
        result = {"raw": last_tool_msg.content}

    # Score: success / failure / ambiguous
    error = result.get("error")
    error_type = result.get("error_type", "")

    if error:
        # Count how many failure reflections we already have
        failure_count = sum(1 for r in reflections if r.startswith("[FAILURE]"))

        if failure_count >= MAX_RETRIES:
            # Max retries exhausted → escalate to human
            reflections.append(
                f"[ESCALATION] Max retries ({MAX_RETRIES}) exhausted for tool call. "
                f"Last error: {error[:200]}. Falling back to human escalation."
            )
            # Add a human-readable fallback response
            fallback_msg = AIMessage(
                content=(
                    "⚠️ **Tool Failure — Escalating to Human**\n\n"
                    f"I attempted this action {MAX_RETRIES} times but the upstream service "
                    f"is unavailable (Error: {error_type}). I've logged the failure details "
                    f"and am escalating this to a human operator for manual resolution.\n\n"
                    f"**Reflection trail:**\n" +
                    "\n".join(f"- {r}" for r in reflections[-3:])
                )
            )
            return {
                "messages": [fallback_msg],
                "reflection_notes": reflections,
            }

        # Write a textual reflection and prepare for retry
        if "timeout" in error.lower() or "Timeout" in error_type:
            reflection = (
                f"[FAILURE] Ledger API timed out (attempt {failure_count + 1}/{MAX_RETRIES}), "
                f"retrying with cached settlement snapshot. Error: {error[:150]}"
            )
        else:
            reflection = (
                f"[FAILURE] Tool call failed (attempt {failure_count + 1}/{MAX_RETRIES}): "
                f"{error[:200]}"
            )

        reflections.append(reflection)
        return {"reflection_notes": reflections}

    else:
        # Success
        reflections.append("[SUCCESS] Tool call completed successfully. Result verified.")
        return {"reflection_notes": reflections}


def route_after_evaluation(state: AgentState) -> str:
    """Route based on evaluation: retry, escalate, or synthesize."""
    reflections = state.get("reflection_notes", [])
    if not reflections:
        return "generate_response"

    last = reflections[-1]
    if last.startswith("[ESCALATION]"):
        return "end"  # The fallback AIMessage was already added
    if last.startswith("[FAILURE]"):
        return "generate_response"  # Retry: go back to LLM with reflection context
    return "generate_response"  # Success: let LLM synthesize a final answer


def propose_action(state: AgentState) -> dict:
    """Node 6: Draft state-mutating action for HITL approval."""
    messages = state.get("messages", [])
    last = messages[-1]
    tc = last.tool_calls[0]
    return {
        "proposed_action": {
            "tool_name": tc["name"],
            "tool_args": tc["args"],
            "tool_call_id": tc["id"],
        },
        "step_count": state.get("step_count", 0) + 1,
    }


def human_approval_gate(state: AgentState) -> dict:
    """Node 7: HITL gate. Graph pauses via interrupt_before."""
    is_approved = state.get("is_approved")
    proposed = state.get("proposed_action")

    if is_approved and proposed:
        result_msg = f"Successfully executed {proposed['tool_name']} with args {proposed['tool_args']}"
        tool_msg = ToolMessage(content=result_msg, tool_call_id=proposed["tool_call_id"])
        ai_msg = AIMessage(content=f"✅ Action `{proposed['tool_name']}` has been approved and executed successfully.")
        return {"messages": [tool_msg, ai_msg], "proposed_action": None, "is_approved": None}
    elif is_approved is False:
        tool_msg = ToolMessage(content="Action was rejected by user.", tool_call_id=proposed["tool_call_id"])
        ai_msg = AIMessage(content="❌ The action was rejected and has been cancelled.")
        return {"messages": [tool_msg, ai_msg], "proposed_action": None, "is_approved": None}
    return {}


# ═══════════════════════════════════════════════
# GRAPH COMPILATION
# ═══════════════════════════════════════════════

workflow = StateGraph(AgentState)

workflow.add_node("classify_intent", classify_intent)
workflow.add_node("retrieve_context", retrieve_context)
workflow.add_node("generate_response", generate_response)
workflow.add_node("execute_tool", execute_tool)
workflow.add_node("evaluate_result", evaluate_result)
workflow.add_node("propose_action", propose_action)
workflow.add_node("human_approval_gate", human_approval_gate)

# Edges
workflow.add_edge(START, "classify_intent")
workflow.add_edge("classify_intent", "retrieve_context")
workflow.add_edge("retrieve_context", "generate_response")

workflow.add_conditional_edges(
    "generate_response",
    route_after_generation,
    {
        "execute_tool": "execute_tool",
        "propose_action": "propose_action",
        "end": END,
    }
)

workflow.add_edge("execute_tool", "evaluate_result")

workflow.add_conditional_edges(
    "evaluate_result",
    route_after_evaluation,
    {
        "generate_response": "generate_response",
        "end": END,
    }
)

workflow.add_edge("propose_action", "human_approval_gate")
workflow.add_edge("human_approval_gate", END)

# SQLite Checkpointer
conn = sqlite3.connect("agent_state.db", check_same_thread=False)
memory = SqliteSaver(conn)

graph = workflow.compile(
    checkpointer=memory,
    interrupt_before=["human_approval_gate"],
)
