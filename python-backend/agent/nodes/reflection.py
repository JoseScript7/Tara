"""
LATS (Language Agent Tree Search) Reflection Node — USP 1

Upgrades standard ReAct loops with Monte Carlo Tree Search (MCTS) style
self-reflection and value evaluation heuristics.

Key behaviors:
- Assigns a scalar score V(s) to each tool observation
- Backpropagates textual self-reflections on failure
- Enforces a MAX_RETRIES cap to prevent infinite loops
- Logs all reflection events to the observability trace
"""
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_mistralai import ChatMistralAI
from langchain_core.prompts import ChatPromptTemplate
from agent.state import AgentState
from agent.observability import create_trace_entry, log_trace_to_file
import os
import time

os.environ.setdefault("MISTRAL_API_KEY", os.getenv("MISTRAL_API_KEY", ""))

MAX_RETRIES = 3  # MCTS backtrack cap


class ReflectionScore(BaseModel):
    score: float = Field(description="A score between 0.0 and 1.0 evaluating whether the tool observation satisfies the user's goal")
    reflection: str = Field(description="Textual self-reflection explaining what went wrong and how to correct it, if score < 0.8")
    should_retry: bool = Field(default=False, description="Whether the agent should backtrack and retry with a different approach")


def reflection_evaluator_node(state: AgentState) -> dict:
    """
    LATS Evaluation Operation.
    
    Assigns a scalar score V(s) and generates textual self-reflection
    if a tool observation indicates a partial failure. Backpropagates
    reflections into context memory to prevent repetitive error loops.
    """
    start_time = time.time()
    
    if not state.get("messages"):
        return {"reflection_notes": []}

    last_message = state["messages"][-1]

    # Only evaluate Tool messages
    if last_message.type != "tool":
        return {"reflection_notes": []}

    # Check retry cap
    retry_count = state.get("lats_retry_count", 0)
    if retry_count >= MAX_RETRIES:
        trace = create_trace_entry(
            "reflection", "reflection",
            input_summary="Max retries reached",
            output_summary=f"LATS cap hit ({MAX_RETRIES} retries). Proceeding with best available result.",
            latency_ms=(time.time() - start_time) * 1000,
            metadata={"retry_count": retry_count, "capped": True}
        )
        log_trace_to_file(trace)
        return {
            "reflection_notes": [f"LATS: Max retry cap ({MAX_RETRIES}) reached. Proceeding with current result."],
            "lats_retry_count": retry_count,
        }

    # Build the LLM evaluator chain with fallback
    primary_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    fallback_llm = ChatMistralAI(model="open-mistral-nemo", temperature=0)

    try:
        llm = primary_llm.with_structured_output(ReflectionScore).with_fallbacks(
            [fallback_llm.with_structured_output(ReflectionScore)]
        )
    except Exception:
        # If structured output binding fails, use a simple evaluation
        trace = create_trace_entry(
            "reflection", "reflection",
            input_summary="LLM binding failed",
            output_summary="Skipping LATS evaluation due to LLM error",
            latency_ms=(time.time() - start_time) * 1000,
        )
        log_trace_to_file(trace)
        return {"reflection_notes": ["LATS: Evaluation skipped (LLM unavailable)"]}

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a LATS (Language Agent Tree Search) evaluator.
Your job is to grade the output of a tool call against the user's overall goal.
Score 1.0 = perfect success. Score 0.0 = complete failure.
If score < 0.8, provide a concrete reflection on what went wrong and suggest an alternative approach.
Set should_retry=true only if you believe a different tool call or approach could succeed."""),
        ("user", """Evaluate this tool observation:

Observation: {observation}
Current Plan: {current_plan}
Previous Reflections: {previous_reflections}

Return a score, reflection, and whether to retry.""")
    ])

    chain = prompt | llm

    try:
        evaluation = chain.invoke({
            "observation": last_message.content[:1000],
            "current_plan": state.get("current_plan", []),
            "previous_reflections": state.get("reflection_notes", [])[-3:],  # Selective context window
        })
    except Exception as e:
        trace = create_trace_entry(
            "reflection", "reflection",
            input_summary="Evaluation invoke failed",
            output_summary=str(e)[:200],
            latency_ms=(time.time() - start_time) * 1000,
        )
        log_trace_to_file(trace)
        return {"reflection_notes": [f"LATS: Evaluation failed — {str(e)[:100]}"]}

    latency = (time.time() - start_time) * 1000

    # Log the trace
    trace = create_trace_entry(
        "reflection", "reflection",
        input_summary=f"Evaluating tool output (retry #{retry_count})",
        output_summary=f"Score: {evaluation.score:.2f} | Retry: {evaluation.should_retry} | {evaluation.reflection[:100]}",
        latency_ms=latency,
        metadata={
            "score": evaluation.score,
            "should_retry": evaluation.should_retry,
            "retry_count": retry_count,
        }
    )
    log_trace_to_file(trace)

    if evaluation.score < 0.8 and evaluation.should_retry:
        # Backpropagate reflection into context memory
        return {
            "reflection_notes": state.get("reflection_notes", []) + [evaluation.reflection],
            "lats_retry_count": retry_count + 1,
            "lats_best_score": max(state.get("lats_best_score", 0.0), evaluation.score),
            "step_count": state.get("step_count", 0) + 1,
        }

    return {
        "reflection_notes": ["Action verified successfully."],
        "lats_best_score": max(state.get("lats_best_score", 0.0), evaluation.score),
    }
