"""
Tara — Second Brain Module (Prompt 13)

Three memory layers:
1. Merchant Memory: language, contact preference, past issues/fixes
2. Team Memory: resolved cases + human overrides stored as lessons
3. Policy Memory: versioned docs with effective dates

Uses embeddings + keyword retrieval. After each closed case,
consolidates a lesson.
"""
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime
import json
import hashlib


@dataclass
class MerchantMemory:
    """Per-merchant persistent memory"""
    merchant_id: str
    language: str = "hi"  # Default Hindi
    preferred_channel: str = "text"  # text, voice, photo
    contact_preferences: Dict[str, Any] = field(default_factory=dict)
    past_issues: List[Dict[str, Any]] = field(default_factory=list)
    past_fixes: List[Dict[str, Any]] = field(default_factory=list)
    frustration_history: List[Dict[str, Any]] = field(default_factory=list)
    notes: List[str] = field(default_factory=list)
    last_interaction: Optional[datetime] = None

    def add_issue(self, issue: Dict[str, Any]):
        issue["timestamp"] = datetime.utcnow().isoformat()
        self.past_issues.append(issue)
        self.last_interaction = datetime.utcnow()

    def add_fix(self, fix: Dict[str, Any]):
        fix["timestamp"] = datetime.utcnow().isoformat()
        self.past_fixes.append(fix)

    def record_frustration(self, level: str, context: str):
        self.frustration_history.append({
            "level": level,
            "context": context,
            "timestamp": datetime.utcnow().isoformat(),
        })

    def to_context(self) -> Dict[str, Any]:
        """Return context suitable for the agent's prompt"""
        return {
            "merchant_id": self.merchant_id,
            "language": self.language,
            "preferred_channel": self.preferred_channel,
            "issue_count": len(self.past_issues),
            "recent_issues": self.past_issues[-3:] if self.past_issues else [],
            "recent_fixes": self.past_fixes[-3:] if self.past_fixes else [],
            "frustration_events": len(self.frustration_history),
            "last_interaction": self.last_interaction.isoformat() if self.last_interaction else None,
        }


@dataclass
class Lesson:
    """A team-learned lesson from a resolved case or human override"""
    id: str
    trigger_context: str  # What situation triggered this lesson
    resolution: str       # What was done
    outcome: str          # What happened after
    source: str           # "auto_resolution" | "human_override" | "escalation_feedback"
    confidence: float     # How confident we are in this lesson
    tags: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    usage_count: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "trigger": self.trigger_context,
            "resolution": self.resolution,
            "outcome": self.outcome,
            "source": self.source,
            "confidence": self.confidence,
            "tags": self.tags,
            "created_at": self.created_at.isoformat(),
            "usage_count": self.usage_count,
        }


@dataclass
class PolicyDocument:
    """Versioned policy document with effective dates"""
    id: str
    title: str
    content: str
    source: str           # e.g., "RBI Circular DPSS.CO.PD..."
    effective_date: datetime
    expiry_date: Optional[datetime] = None
    version: str = "1.0"
    chunks: List[Dict[str, Any]] = field(default_factory=list)
    is_placeholder: bool = True  # VERIFY AGAINST OFFICIAL CIRCULAR

    def is_active(self, as_of: Optional[datetime] = None) -> bool:
        check_date = as_of or datetime.utcnow()
        if check_date < self.effective_date:
            return False
        if self.expiry_date and check_date > self.expiry_date:
            return False
        return True


class SecondBrain:
    """
    Persistent memory system for Tara.
    In production, backed by pgvector/OpenSearch.
    In demo, in-memory with keyword matching.
    """

    def __init__(self):
        self.merchant_memories: Dict[str, MerchantMemory] = {}
        self.lessons: List[Lesson] = []
        self.policies: List[PolicyDocument] = []

    # ─── Merchant Memory ─────────────────────

    def get_merchant_memory(self, merchant_id: str) -> MerchantMemory:
        if merchant_id not in self.merchant_memories:
            self.merchant_memories[merchant_id] = MerchantMemory(merchant_id=merchant_id)
        return self.merchant_memories[merchant_id]

    def update_merchant_language(self, merchant_id: str, language: str):
        mem = self.get_merchant_memory(merchant_id)
        mem.language = language

    def record_merchant_issue(self, merchant_id: str, issue: Dict[str, Any]):
        mem = self.get_merchant_memory(merchant_id)
        mem.add_issue(issue)

    def record_merchant_fix(self, merchant_id: str, fix: Dict[str, Any]):
        mem = self.get_merchant_memory(merchant_id)
        mem.add_fix(fix)

    # ─── Team Memory (Lessons) ───────────────

    def add_lesson(self, trigger: str, resolution: str, outcome: str,
                   source: str = "auto_resolution", confidence: float = 0.8,
                   tags: Optional[List[str]] = None) -> Lesson:
        lesson_id = hashlib.md5(f"{trigger}:{resolution}".encode()).hexdigest()[:12]
        lesson = Lesson(
            id=lesson_id,
            trigger_context=trigger,
            resolution=resolution,
            outcome=outcome,
            source=source,
            confidence=confidence,
            tags=tags or [],
        )
        self.lessons.append(lesson)
        return lesson

    def add_human_override_lesson(self, original_action: str, override_action: str,
                                   reason: str, context: str) -> Lesson:
        """When a human overrides the agent, record the lesson."""
        return self.add_lesson(
            trigger=f"Agent proposed: {original_action}. Context: {context}",
            resolution=f"Human overrode to: {override_action}. Reason: {reason}",
            outcome="Human override recorded as lesson",
            source="human_override",
            confidence=0.95,
            tags=["human_override", "lesson"],
        )

    def find_relevant_lessons(self, context: str, max_results: int = 3) -> List[Lesson]:
        """Find lessons relevant to the current context (keyword match for demo)."""
        context_lower = context.lower()
        scored = []
        for lesson in self.lessons:
            score = 0
            trigger_lower = lesson.trigger_context.lower()
            resolution_lower = lesson.resolution.lower()

            # Simple keyword overlap scoring
            context_words = set(context_lower.split())
            trigger_words = set(trigger_lower.split())
            resolution_words = set(resolution_lower.split())

            overlap = len(context_words & (trigger_words | resolution_words))
            score = overlap * lesson.confidence

            if score > 0:
                scored.append((score, lesson))

        scored.sort(key=lambda x: x[0], reverse=True)
        results = [lesson for _, lesson in scored[:max_results]]

        # Track usage
        for lesson in results:
            lesson.usage_count += 1

        return results

    # ─── Policy Memory ───────────────────────

    def add_policy(self, title: str, content: str, source: str,
                   effective_date: datetime, expiry_date: Optional[datetime] = None,
                   version: str = "1.0", is_placeholder: bool = True) -> PolicyDocument:
        policy_id = hashlib.md5(f"{title}:{version}".encode()).hexdigest()[:12]
        policy = PolicyDocument(
            id=policy_id,
            title=title,
            content=content,
            source=source,
            effective_date=effective_date,
            expiry_date=expiry_date,
            version=version,
            is_placeholder=is_placeholder,
        )
        # Simple chunking by paragraphs
        paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
        for i, para in enumerate(paragraphs):
            policy.chunks.append({
                "chunk_id": f"{policy_id}_chunk_{i}",
                "text": para,
                "policy_id": policy_id,
                "policy_title": title,
                "source": source,
                "is_placeholder": is_placeholder,
            })
        self.policies.append(policy)
        return policy

    def retrieve_policy(self, query: str, as_of: Optional[datetime] = None,
                        max_results: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieve policy chunks relevant to a query, active as of a date.
        Returns chunks with citations. If is_placeholder is True, the
        citation includes a warning.
        """
        query_lower = query.lower()
        results = []

        for policy in self.policies:
            if not policy.is_active(as_of):
                continue
            for chunk in policy.chunks:
                # Keyword scoring
                score = sum(1 for word in query_lower.split() if word in chunk["text"].lower())
                if score > 0:
                    citation = {
                        "text": chunk["text"],
                        "source": chunk["source"],
                        "policy_title": chunk["policy_title"],
                        "score": score,
                    }
                    if chunk["is_placeholder"]:
                        citation["warning"] = "PLACEHOLDER — VERIFY AGAINST OFFICIAL CIRCULAR"
                    results.append(citation)

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:max_results]

    def consolidate_case_lesson(self, case_id: str, merchant_id: str,
                                 issue_type: str, actions_taken: List[str],
                                 outcome: str, was_escalated: bool):
        """After a closed case, consolidate into a lesson."""
        self.record_merchant_fix(merchant_id, {
            "case_id": case_id,
            "issue_type": issue_type,
            "actions": actions_taken,
            "outcome": outcome,
        })

        self.add_lesson(
            trigger=f"Issue type: {issue_type}. Merchant: {merchant_id}",
            resolution=f"Actions taken: {', '.join(actions_taken)}",
            outcome=outcome,
            source="escalation_feedback" if was_escalated else "auto_resolution",
            confidence=0.7 if was_escalated else 0.85,
            tags=[issue_type, "closed_case"],
        )

    def get_context_for_agent(self, merchant_id: str, current_issue: str) -> Dict[str, Any]:
        """Build full context from all three memory layers."""
        merchant_ctx = self.get_merchant_memory(merchant_id).to_context()
        lessons = self.find_relevant_lessons(current_issue)
        policies = self.retrieve_policy(current_issue)

        return {
            "merchant_memory": merchant_ctx,
            "relevant_lessons": [l.to_dict() for l in lessons],
            "policy_citations": policies,
            "memory_source": "second_brain",
        }


# ─── Global Instance & Accessors ────────────

TeamMemoryLesson = Lesson
brain = SecondBrain()

# Add compatibility methods
SecondBrain.record_lesson = lambda self, lesson: self.lessons.append(lesson)
SecondBrain.retrieve_relevant_lessons = lambda self, q="": self.find_relevant_lessons(q) if q else self.lessons

def get_second_brain() -> SecondBrain:
    global brain
    return brain

