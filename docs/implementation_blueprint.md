# TARA / IMPLEMENTATION BLUEPRINT
**TEAM CYBER_PHANTOMS • INTERNAL DESIGN BLUEPRINT • 31 OCTOBER 2026**
**Autonomous Merchant Operations AI Teammate — Implementation Blueprint — the “How”**

---

## The Product Idea
Paytm made payment confirmation audible. Tara makes payment exceptions actionable. Tara connects transaction events, device signals, merchant context, policies, and previous case experience so a merchant does not have to become the investigator.

### Architecture • Ontology • Second Brain • Agent Runtime • Sandbox Bank • Security • Delivery Roadmap

---

## 1. Executive Summary and Design Principles

Tara is an AI teammate for merchant operations. It is designed to detect operational exceptions, connect the evidence across a merchant’s payment and device ecosystem, take safe actions across simulated enterprise systems, verify the result, and involve a human only when the risk or uncertainty requires it.

The design responds to a specific gap: merchants experience a payment as one end-to-end event, while supporting systems represent it as multiple independent records. A payment can be successful while its soundbox announcement is missing. A payer can be debited while a merchant credit remains pending. A settlement can differ from the merchant’s expectation. A notification alone reports an event; it does not reconcile the parties, diagnose the cause, or complete the support workflow.

### The Central Design Thesis
The ontology gives Tara a structured model of the merchant ecosystem. The Second Brain gives Tara access to validated operational experience. The agent uses both to choose the next permitted action, while deterministic controls and human approval protect consequential decisions.

### Key Decisions at a Glance
| # | Decision | Blueprint Choice | Reason / Status |
|---|---|---|---|
| 1 | Architecture Style | Event-driven modular application with separate API, agent worker, and simulated core components. | Preserves clear module boundaries before splitting into microservices. |
| 2 | Frontend | React + TypeScript PWA; mobile-first for merchant and operations views. | Universal access; embeddable as WebView SDK in existing Paytm app. |
| 3 | Backend | Python + FastAPI for APIs and AI orchestration. | High performance async I/O; native AI library ecosystem. |
| 4 | Reasoning Model | Claude via Amazon Bedrock with tool use; Bedrock Guardrails. | Primary reasoning path; prompt-injection shield & PII masking. |
| 5 | Indic Interaction | Sarvam AI API behind a provider interface (speech/text/vision). | Native Indic retail voice models (hi-IN, ta-IN, te-IN, kn-IN). |
| 6 | Relational Data | PostgreSQL / SQLite for ledger, cases, events, and audit outbox. | ACID transaction guarantees; double-entry financial ledger. |
| 7 | Ontology Store | In-memory Adjacency Knowledge Graph (116+ nodes) with graph traversal. | Real-time root-cause tracing and explainable graph paths. |
| 8 | Memory Retrieval | Second Brain episodic & procedural memory layers. | Contextual past case recall without model retraining. |
| 9 | Banking Integration | Isolated Core Mock with synthetic data and play money. | Deliberately simulated; zero connection to live Paytm or bank rails. |
| 10 | Money Movement | Tier 2 human approvals only; zero autonomous money movement. | Non-negotiable fintech safety boundary. |

---

## 2. Why Build a Web Application? (The Paytm Integration Framing)

When presenting to Paytm engineering judges, the obvious question arises:
> **"Paytm already has the Paytm for Business (P4B) app and extensive backend infrastructure. Why did you build a web application?"**

### The Answer Has Three Pillars:

1. **Tara is an Add-on Intelligence Layer & API Gateway, NOT an App Replacement:**
   - Tara does not replace Paytm's app or backend. It acts as an **autonomous operational intelligence middleware** that integrates into existing Paytm systems:
     - Soundbox MQTT telemetry topics
     - CBS / UPI switch transaction feeds
     - Morning settlement batch reconciler
     - CRM / Helpdesk ticketing queues
   - All capabilities are exposed as headless REST APIs (`/api/v1/...`), Server-Sent Events (`/api/v1/stream`), and MCP tool servers (`/tools/...`).

2. **The Web App is a Zero-Install Embedded WebView SDK / Micro-Frontend:**
   - In production, Paytm does not ask merchants to download another standalone 50MB app.
   - Tara is designed as a **lightweight, responsive PWA** that embeds directly into the existing *Paytm for Business* app via a single in-app route (`paytm://merchant/tara`).
   - For merchants on basic devices or counters without the app, it is instantly accessible via a QR scan or SMS link with zero installation.

3. **The Web App is a Real-time Verification & Evaluation Harness for Hackathon Judges:**
   - A pure backend API cannot visually prove autonomous cause-and-effect to judges.
   - The web platform acts as a dual-screen verification harness:
     - **Screen 1 (Demo Soundbox PWA on Phone 2):** Judges simulate retail QR payments, disconnect 4G to simulate network blackspots, or mute audio.
     - **Screen 2 (Merchant Desk & Ops Console on Phone 1 / Laptop):** Judges watch Tara proactively detect the missing ACK within 68ms, traverse the ontology graph, apply NPCI 142 policy, generate an explainable audit record, and notify the merchant via SMS/voice.

---

## 3. Scope, Priorities and Trust Boundary

### Real vs. Simulated Boundaries
- **Cloud & AI:** Real AWS Bedrock (Claude 3.5 Sonnet) + Sarvam AI Indic STT/TTS calls.
- **Payment Core:** Simulated Core Mock (`services/mock_bank_server.py`) with play-money ledger. Never connected to real bank accounts.
- **Merchant Data:** Synthetic, reproducible test merchants (e.g. Rahul Sharma, Kumar Stores).
- **Money Movement:** Strict Tier-2 approval requests only. Agent cannot move real money.
- **Hardware:** Browser-paired demo soundbox on a second phone or tab. Labeled "Demo Soundbox (Simulated)".

---

## 4. Technology Stack & System Architecture

```
[ Merchant / Judges ]             [ PWA Demo Soundbox ]
        │                                   │
        ▼ (HTTPS / PWA)                     ▼ (WebSocket / 4G Heartbeat)
┌───────────────────────────────────────────────────────────────┐
│                    Public Edge / Ingress                      │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│              Tara FastAPI Orchestrator Backend                 │
│                                                               │
│   ┌────────────────────┐   ┌──────────────────────────────┐   │
│   │ PII Masking Engine │   │   Autonomy Ladder (Tier 1-3) │   │
│   └─────────┬──────────┘   └──────────────┬───────────────┘   │
│             ▼                             ▼                   │
│   ┌────────────────────┐   ┌──────────────────────────────┐   │
│   │ Policy RAG Engine  │   │  Typed Action Tool Registry  │   │
│   │ (NPCI 142 / RBI)   │   │  (OTA Resync, Audio Reroute) │   │
│   └─────────┬──────────┘   └──────────────┬───────────────┘   │
│             ▼                             ▼                   │
│   ┌───────────────────────────────────────────────────────┐   │
│   │      Agent Reasoning Loop (AWS Bedrock Claude)        │   │
│   └─────────────────────────┬─────────────────────────────┘   │
└─────────────────────────────┼─────────────────────────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
┌───────────────────────────┐           ┌───────────────────────────┐
│   Ontology Knowledge      │           │    Second Brain Memory    │
│   Graph (116+ Nodes)      │           │   (Episodic & Procedural) │
└───────────────────────────┘           └───────────────────────────┘
```

---

## 5. Domain Model & Invariants

1. **Integer Paise Financial Amounts:** All financial numbers are stored in integer paise. No floating point balance drift.
2. **Double-Entry Balance Invariant:** Every ledger posting balances debits and credits.
3. **Independent States:**
   - `Payment.status`: `SUCCESS`, `PENDING`, `FAILED`
   - `Announcement.status`: `ANNOUNCED`, `NOT_ANNOUNCED`, `MUTED`
   - *A payment can be SUCCESS while its announcement is NOT_ANNOUNCED.*
4. **Zero Offline Money Movement:** Under Rule 43, approvals and payments are never queued offline.

---

## 6. Autonomy Ladder

| Tier | Category | Autonomy | Examples | Safety Boundary |
|---|---|---|---|---|
| **Tier 1** | Read / Safe Diagnostic | Autonomous | Read telemetry, check switch, soft-reboot soundbox OTA, reroute audio to POS, send SMS. | Preconditions verified; non-monetary only. |
| **Tier 2** | Financial Remedies | Human Approval Required | ₹100 RBI statutory delay compensation, fee reversal, merchant SLA concessions. | Requires ops approval with cryptographic signature. |
| **Tier 3** | High Risk / Fraud | Mandatory Escalation | Repeated failures, customer fraud allegations, high negative sentiment. | Direct supervisor phone handover within 30 mins. |

---

## 7. Roadmap to Paytm Pilot

- **Phase 0 (Discovery):** Define operational taxonomies and event schemas with Paytm engineering.
- **Phase 1 (Sandbox Integration):** Connect Tara adapters to partner-provided UAT environments.
- **Phase 2 (Shadow Mode):** Tara observes production events in read-only mode and generates recommendations without executing actions.
- **Phase 3 (Assisted Mode):** Human ops operators review and click to execute Tara-generated case resolutions.
- **Phase 4 (Tier 1 Autonomy):** Enable narrow reversible diagnostics and audio test chimes.
- **Phase 5 (Production Governance):** Formal VAPT, audit sign-off, and SLA monitoring.
