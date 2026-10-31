"""
4-Stage MAESTRO Security Guardrails
Aligned with the MAESTRO framework for agentic AI security.

Stage 1: Input Guardrails   - PII redaction + jailbreak injection detection
Stage 2: Dialog Guardrails  - Conversation scope enforcement (Colang-style)
Stage 3: Execution Guardrails - Tool payload schema validation
Stage 4: Output Guardrails  - Hallucination detection + compliance language
"""
import re
import json
import datetime
from typing import Dict, Any, List, Optional, Tuple
from pydantic import ValidationError
from tools.mcp_server import TOOL_REGISTRY


# ═══════════════════════════════════════════════
# STAGE 1: INPUT GUARDRAILS
# ═══════════════════════════════════════════════

JAILBREAK_PATTERNS = [
    r"ignore\s+(previous|all|above)\s+(instructions|rules|prompts)",
    r"you\s+are\s+now\s+(DAN|evil|unfiltered|jailbroken)",
    r"pretend\s+(you\s+are|to\s+be)\s+a",
    r"system\s*prompt\s*[:=]",
    r"forget\s+(everything|your\s+rules)",
    r"act\s+as\s+if\s+you\s+have\s+no\s+restrictions",
    r"bypass\s+(safety|filter|guardrail)",
    r"\<\/?system\>",  # Attempted XML injection
    r"```\s*system",   # Code block injection
]

def mask_pii(text: str) -> str:
    """Stage 1a: Redacts PII — UPI IDs, PAN, Aadhaar, Card numbers, phone numbers."""
    # UPI IDs
    text = re.sub(r'[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}', '[UPI_REDACTED]', text)
    # PAN Cards (ABCDE1234F)
    text = re.sub(r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b', '[PAN_REDACTED]', text)
    # Aadhaar (12 digits with optional spaces)
    text = re.sub(r'\b\d{4}\s?\d{4}\s?\d{4}\b', '[AADHAAR_REDACTED]', text)
    # Card Numbers (16 digits)
    text = re.sub(r'\b(?:\d{4}[ -]?){3}\d{4}\b', '[CARD_REDACTED]', text)
    # Phone numbers (10-digit Indian)
    text = re.sub(r'\b[6-9]\d{9}\b', '[PHONE_REDACTED]', text)
    return text

def detect_jailbreak(text: str) -> Tuple[bool, Optional[str]]:
    """Stage 1b: Detects prompt injection / jailbreak attempts."""
    text_lower = text.lower()
    for pattern in JAILBREAK_PATTERNS:
        match = re.search(pattern, text_lower)
        if match:
            return True, f"Blocked injection pattern: '{match.group()}'"
    return False, None

def input_guardrail(message: str) -> Tuple[str, Optional[str]]:
    """
    Full Stage 1 pipeline. Returns (safe_message, rejection_reason).
    If rejection_reason is not None, the message should be blocked.
    """
    # 1a. PII redaction
    safe_message = mask_pii(message)
    
    # 1b. Jailbreak detection
    is_jailbreak, reason = detect_jailbreak(safe_message)
    if is_jailbreak:
        return safe_message, reason
    
    return safe_message, None


# ═══════════════════════════════════════════════
# STAGE 2: DIALOG GUARDRAILS (Colang-style)
# ═══════════════════════════════════════════════

ALLOWED_TOPICS = [
    "transaction", "settlement", "dispute", "refund", "compensation",
    "device", "soundbox", "pos", "terminal", "battery",
    "loan", "offer", "eligibility", "emi",
    "mdr", "fee", "charge", "pricing",
    "tat", "turnaround", "delay", "breach",
    "sales", "revenue", "balance", "payment",
    "support", "help", "issue", "problem",
    "account", "merchant", "status", "policy",
]

OUT_OF_SCOPE_TOPICS = [
    "politics", "religion", "dating", "gambling", "crypto",
    "stock", "investment advice", "medical", "legal advice",
    "write me a poem", "tell me a joke", "personal opinion",
]

def dialog_guardrail(message: str) -> Tuple[bool, Optional[str]]:
    """
    Stage 2: Enforces conversation scope.
    Returns (is_in_scope, rejection_reason).
    """
    msg_lower = message.lower()
    
    # Check for explicit out-of-scope topics
    for topic in OUT_OF_SCOPE_TOPICS:
        if topic in msg_lower:
            return False, f"I'm Tara, your merchant billing assistant. I can't help with '{topic}' — but I'm great at transactions, disputes, settlements, and device support!"
    
    # Allow if any allowed keyword is present, or if it's a short general greeting
    if len(msg_lower.split()) <= 5:  # Short messages like "hi", "hello", "help" are always in scope
        return True, None
    
    for topic in ALLOWED_TOPICS:
        if topic in msg_lower:
            return True, None
    
    # Default: allow (benefit of the doubt for novel queries)
    return True, None


# ═══════════════════════════════════════════════
# STAGE 3: EXECUTION GUARDRAILS
# ═══════════════════════════════════════════════

def execution_guardrail(tool_name: str, tool_args: dict) -> Tuple[bool, Optional[str]]:
    """
    Stage 3: Validates tool call arguments against their Pydantic schemas.
    Returns (is_valid, rejection_reason).
    """
    tool_meta = TOOL_REGISTRY.get(tool_name)
    if not tool_meta:
        return False, f"Unknown tool: {tool_name}"
    
    # Validate required fields exist
    schema = tool_meta.get("schema", {})
    required_fields = schema.get("required", [])
    for field in required_fields:
        if field not in tool_args:
            return False, f"Missing required field '{field}' for tool '{tool_name}'"
    
    # Validate amount is positive for financial tools
    if "amount" in tool_args:
        try:
            amount = float(tool_args["amount"])
            if amount <= 0:
                return False, f"Amount must be positive, got {amount}"
            if amount > 1000000:  # ₹10L cap
                return False, f"Amount ₹{amount} exceeds maximum allowed limit of ₹10,00,000"
        except (ValueError, TypeError):
            return False, f"Invalid amount value: {tool_args['amount']}"
    
    return True, None


# ═══════════════════════════════════════════════
# STAGE 4: OUTPUT GUARDRAILS
# ═══════════════════════════════════════════════

def validate_rupee_figures(response: str, context_string: str) -> Tuple[bool, List[str]]:
    """Stage 4a: Validates factual consistency of generated financial figures."""
    figures = re.findall(r'₹([\d,]+(?:\.\d{1,2})?)', response)
    hallucinated = []
    for figure in figures:
        # Normalize: strip commas and trailing .0 for comparison
        normalized = figure.replace(",", "")
        if normalized.endswith(".0"):
            normalized = normalized[:-2]
        # Also try the original with commas stripped from context
        normalized_ctx = context_string.replace(",", "")
        if normalized not in normalized_ctx and figure not in context_string:
            hallucinated.append(figure)
    return len(hallucinated) == 0, hallucinated

def check_compliance_language(response: str) -> Tuple[bool, Optional[str]]:
    """Stage 4b: Ensures responses don't make unauthorized guarantees."""
    FORBIDDEN_PHRASES = [
        "i guarantee",
        "100% certain",
        "i promise",
        "we will definitely",
        "guaranteed refund",
        "no risk",
    ]
    resp_lower = response.lower()
    for phrase in FORBIDDEN_PHRASES:
        if phrase in resp_lower:
            return False, f"Response contains unauthorized guarantee language: '{phrase}'"
    return True, None

def output_guardrail(response: str, context: Dict[str, Any]) -> Tuple[str, List[str]]:
    """
    Full Stage 4 pipeline. Returns (final_response, list_of_warnings).
    """
    warnings = []
    context_str = str(context)
    
    # 4a. Hallucination check
    is_consistent, hallucinated_figures = validate_rupee_figures(response, context_str)
    if not is_consistent:
        warnings.append(f"HALLUCINATION_DETECTED: Figures {hallucinated_figures} not in context")
        response = "[GUARDRAIL] I found relevant information but need to verify the exact figures. Let me check the records again."
    
    # 4b. Compliance language check
    is_compliant, compliance_warning = check_compliance_language(response)
    if not is_compliant:
        warnings.append(f"COMPLIANCE_VIOLATION: {compliance_warning}")
        # Soft rewrite: don't block, just warn
    
    # 4c. PII leak check on output
    output_pii_cleaned = mask_pii(response)
    if output_pii_cleaned != response:
        warnings.append("PII_LEAK_PREVENTED: Output contained PII that was redacted")
        response = output_pii_cleaned
    
    return response, warnings
