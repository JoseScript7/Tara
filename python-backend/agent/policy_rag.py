"""
Tara — Policy RAG & Citation Engine (Prompt 14)

Chunks, indexes, and retrieves regulatory and company policy documents
(RBI TAT Harmonisation, NPCI UDIR, Paytm Merchant Agreement).
Enforces the cardinal safety rule:
Any compensation or TAT statement must cite a retrieved chunk;
otherwise the agent must declare uncertainty and escalate to Level 2.
"""

import os
import re
import glob
from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Tuple


@dataclass
class PolicyChunk:
    chunk_id: str
    doc_title: str
    circular_ref: str
    clause: str
    text: str
    keywords: List[str]


class PolicyRAGEngine:
    def __init__(self, policy_dir: str = "/home/ranenjoseph/Tara/tara-merchant-teammate/python-backend/data/policies"):
        self.policy_dir = policy_dir
        self.chunks: List[PolicyChunk] = []
        self._load_and_chunk_policies()

    def _load_and_chunk_policies(self):
        """Loads markdown policies and splits into fine-grained searchable chunks"""
        files = glob.glob(os.path.join(self.policy_dir, "*.md"))
        for fpath in files:
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()

            doc_title = "Regulatory / Operational Policy"
            circular_ref = "UNKNOWN"

            # Parse title & circular reference header
            title_match = re.search(r"^#\s+(.*)", content, re.MULTILINE)
            if title_match:
                doc_title = title_match.group(1).strip()

            ref_match = re.search(r"\*\*Circular Reference:\*\*\s*(.*)", content)
            if ref_match:
                circular_ref = ref_match.group(1).strip()
            else:
                ref_match = re.search(r"\*\*Agreement Reference:\*\*\s*(.*)", content)
                if ref_match:
                    circular_ref = ref_match.group(1).strip()

            # Split by section / clause headers (## or ###)
            sections = re.split(r"\n(?=#{2,3}\s+)", content)
            for idx, sec in enumerate(sections):
                lines = sec.strip().split("\n")
                if not lines or not lines[0].startswith("#"):
                    continue

                clause_title = lines[0].lstrip("#").strip()
                sec_text = "\n".join(lines[1:]).strip()
                if not sec_text:
                    continue

                # Extract basic search keywords
                clean_words = re.findall(r"\b[A-Za-z0-9_]{3,}\b", sec.lower())
                keywords = list(set(clean_words))

                chunk_id = f"{os.path.basename(fpath).replace('.md','')}_c{idx}"
                self.chunks.append(PolicyChunk(
                    chunk_id=chunk_id,
                    doc_title=doc_title,
                    circular_ref=circular_ref,
                    clause=clause_title,
                    text=sec_text,
                    keywords=keywords
                ))

    def retrieve(self, query: str, top_k: int = 3) -> List[Tuple[PolicyChunk, float]]:
        """
        Retrieves top relevant policy chunks using BM25-style keyword overlap scoring
        """
        query_words = set(re.findall(r"\b[A-Za-z0-9_]{3,}\b", query.lower()))
        if not query_words:
            return []

        scored: List[Tuple[PolicyChunk, float]] = []
        for c in self.chunks:
            # High-weight terms
            matches = query_words.intersection(set(c.keywords))
            score = len(matches) / (len(query_words) + 1e-5)
            
            # Boost matches for critical regulatory keywords
            boost_terms = {"compensation", "tat", "reversal", "penalty", "rental", "deduction", "upi", "rbi", "npci"}
            for t in boost_terms:
                if t in query_words and t in c.keywords:
                    score += 0.35

            if score > 0.15:
                scored.append((c, score))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]

    def verify_compensation_claim(self, claim_text: str, amount_inr: float) -> Dict[str, Any]:
        """
        Safety Guardrail: Ensures any proposed compensation amount has an exact policy backing.
        If no authoritative policy chunk backs the claim, returns UNSOURCED_ESCALATE.
        """
        chunks_with_score = self.retrieve(claim_text + f" compensation {amount_inr}", top_k=2)
        if not chunks_with_score:
            return {
                "valid": False,
                "reason": "NO_MATCHING_POLICY_CHUNK",
                "action": "MANDATORY_ESCALATION",
                "citation": None
            }

        top_chunk, score = chunks_with_score[0]
        # Check if score meets minimum threshold
        if score < 0.45:
            return {
                "valid": False,
                "reason": f"LOW_POLICY_RELEVANCE_SCORE ({score:.2f})",
                "action": "MANDATORY_ESCALATION",
                "citation": None
            }

        citation = (
            f"[{top_chunk.circular_ref}] {top_chunk.doc_title} — "
            f"{top_chunk.clause} (Chunk: {top_chunk.chunk_id})"
        )
        return {
            "valid": True,
            "reason": "POLICY_VERIFIED",
            "citation": citation,
            "relevant_text": top_chunk.text[:250] + "..."
        }


# Singleton accessor
_policy_rag_instance: Optional[PolicyRAGEngine] = None

def get_policy_rag() -> PolicyRAGEngine:
    global _policy_rag_instance
    if _policy_rag_instance is None:
        _policy_rag_instance = PolicyRAGEngine()
    return _policy_rag_instance
