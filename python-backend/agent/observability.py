"""
Structured Observability & Trace Logging (USP 6)
OpenTelemetry-compatible structured trace logging.
"""
import json
import time
import datetime
from typing import Any, Dict, Optional, List
from pathlib import Path
from agent.state import TraceEntry

TRACE_LOG_PATH = Path(__file__).parent.parent / "logs" / "agent-trace.jsonl"
TRACE_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)


def create_trace_entry(
    node_name: str,
    event_type: str,
    input_summary: str = "",
    output_summary: str = "",
    token_count: Optional[int] = None,
    latency_ms: Optional[float] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> TraceEntry:
    """Create a structured trace entry."""
    return TraceEntry(
        timestamp=datetime.datetime.now().isoformat(),
        node_name=node_name,
        event_type=event_type,
        input_summary=input_summary[:500],  # Truncate for efficiency
        output_summary=output_summary[:500],
        token_count=token_count,
        latency_ms=latency_ms,
        metadata=metadata or {},
    )


def log_trace_to_file(trace: TraceEntry):
    """Append a trace entry to the JSONL log file."""
    with open(TRACE_LOG_PATH, "a") as f:
        f.write(json.dumps(trace) + "\n")


def compile_handoff_summary(state: dict) -> str:
    """
    USP 6: Compile a structured Contextual Handoff Summary for human escalation.
    Instead of passing raw chat transcripts, we compile:
    - Verified account facts
    - Diagnostic steps taken
    - Recommended next actions
    """
    account = state.get("account_ctx", {})
    traces = state.get("execution_trace", [])
    reflections = state.get("reflection_notes", [])
    risk = state.get("risk_assessment", {})
    
    # Extract diagnostic steps from traces
    steps_taken = []
    for t in traces:
        if t.get("event_type") in ("tool_invoke", "guardrail", "reflection"):
            steps_taken.append(f"- [{t.get('node_name')}] {t.get('output_summary', 'N/A')}")
    
    summary = f"""=== CONTEXTUAL HANDOFF SUMMARY ===
Generated: {datetime.datetime.now().isoformat()}

VERIFIED ACCOUNT FACTS:
  Merchant ID: {account.get('merchant_id', 'N/A')}
  Tier: {account.get('tier', 'N/A')}
  Auth Verified: {account.get('verified_auth', False)}

RISK ASSESSMENT:
  Level: {risk.get('level', 'N/A')}
  Reason: {risk.get('reason', 'N/A')}

DIAGNOSTIC STEPS TAKEN ({len(steps_taken)}):
{chr(10).join(steps_taken) if steps_taken else '  None'}

REFLECTION NOTES:
{chr(10).join(f'  - {r}' for r in reflections) if reflections else '  None'}

RECOMMENDED NEXT ACTIONS:
  - Review pending approvals
  - Verify account balance against settlement records
  - Escalate to Level 2 support if unresolved after approval
=== END HANDOFF ==="""
    
    return summary


def get_all_traces() -> List[dict]:
    """Read all trace entries from the log file."""
    traces = []
    if TRACE_LOG_PATH.exists():
        with open(TRACE_LOG_PATH, "r") as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        traces.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass
    return traces
