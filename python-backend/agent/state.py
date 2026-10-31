from typing import TypedDict, Annotated, List, Optional, Any
from langchain_core.messages import BaseMessage
import operator

class AgentState(TypedDict):
    """Refactored exact state schema for LangGraph."""
    messages: Annotated[List[BaseMessage], operator.add]
    merchant_id: str
    account_context: dict
    proposed_action: Optional[dict]
    step_count: int
    reflection_notes: List[str]
    # For handling explicit HITL state tracking
    is_approved: Optional[bool] 
