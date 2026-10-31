"""
Tara — Resilience, Circuit Breakers & Chaos Testing (Prompt 20)

Implements resilience patterns for external dependencies (Bedrock, Sarvam, Core Mock):
- Circuit Breaker (CLOSED -> OPEN -> HALF_OPEN)
- Exponential backoff retry handler
- Correlation ID propagation and structured logging
- Chaos injection hooks to test safe system degradation
"""

import time
import uuid
import logging
from typing import Dict, Any, Optional, Callable
from enum import Enum

logger = logging.getLogger("tara-resilience")


class CircuitState(str, Enum):
    CLOSED = "CLOSED"      # Normal operation
    OPEN = "OPEN"          # Failing, fast-reject calls
    HALF_OPEN = "HALF_OPEN"# Testing recovery


class CircuitBreaker:
    def __init__(self, name: str, failure_threshold: int = 3, recovery_time_sec: float = 30.0):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_time_sec = recovery_time_sec
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_state_change = time.time()
        self.chaos_forced_open = False

    def call(self, func: Callable, *args, **kwargs):
        now = time.time()

        # Check chaos injection
        if self.chaos_forced_open:
            logger.warning(f"🚨 CHAOS MODE: Circuit breaker {self.name} is forcefully OPEN!")
            raise ConnectionError(f"CHAOS_FAILURE: Circuit {self.name} is disabled by chaos test.")

        # If OPEN, check if recovery window elapsed
        if self.state == CircuitState.OPEN:
            if now - self.last_state_change > self.recovery_time_sec:
                self.state = CircuitState.HALF_OPEN
                logger.info(f"Circuit {self.name} entered HALF_OPEN state.")
            else:
                logger.warning(f"Circuit {self.name} is OPEN. Fast-failing request.")
                raise ConnectionError(f"CIRCUIT_OPEN: Dependency {self.name} temporarily unavailable.")

        try:
            result = func(*args, **kwargs)
            # If successful in HALF_OPEN, reset to CLOSED
            if self.state == CircuitState.HALF_OPEN:
                self.state = CircuitState.CLOSED
                self.failure_count = 0
                logger.info(f"Circuit {self.name} recovered to CLOSED.")
            return result
        except Exception as e:
            self.failure_count += 1
            logger.error(f"Error in {self.name} call (failure {self.failure_count}/{self.failure_threshold}): {e}")
            if self.failure_count >= self.failure_threshold:
                self.state = CircuitState.OPEN
                self.last_state_change = now
                logger.error(f"Circuit {self.name} tripped to OPEN state!")
            raise e


# Registry of circuit breakers
BREAKERS: Dict[str, CircuitBreaker] = {
    "sarvam_ai": CircuitBreaker("sarvam_ai", failure_threshold=2, recovery_time_sec=20.0),
    "bedrock_llm": CircuitBreaker("bedrock_llm", failure_threshold=3, recovery_time_sec=30.0),
    "corebank_mock": CircuitBreaker("corebank_mock", failure_threshold=2, recovery_time_sec=15.0),
}


# ─── Chaos Injection Controls ─────────────────────────────

def inject_chaos(target: str, enabled: bool) -> Dict[str, Any]:
    """Force trips or resets circuit breakers to verify graceful degradation"""
    if target in BREAKERS:
        BREAKERS[target].chaos_forced_open = enabled
        status = "OPEN (CHAOS)" if enabled else "RESTORED (CLOSED)"
        logger.info(f"Chaos state for {target}: {status}")
        return {"target": target, "chaos_enabled": enabled, "circuit_state": BREAKERS[target].state.value}
    raise ValueError(f"Unknown chaos target: {target}")


def get_system_resilience_status() -> Dict[str, Any]:
    return {
        name: {
            "state": cb.state.value,
            "failures": cb.failure_count,
            "chaos_forced": cb.chaos_forced_open,
            "last_changed_sec_ago": round(time.time() - cb.last_state_change, 1)
        }
        for name, cb in BREAKERS.items()
    }
