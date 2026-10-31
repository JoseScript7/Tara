# PROJECT BRIEF — Tara: Autonomous Merchant AI Teammate

> **Standing rules for the whole project. Read this before any prompt.**

---

## GOAL

Tara resolves merchant issues end-to-end (detect, diagnose, act, verify, learn) and escalates to a human only when needed. Built for a FinTech hackathon, deployed on AWS with Terraform.

---

## PILLARS

1. **Ontology:** typed knowledge graph (Merchant, Device, Telemetry, Transaction, Settlement, Ticket, PolicyRule, Action) with explainable paths.
2. **Second Brain:** merchant memory, team memory (human overrides become lessons), policy memory (versioned, effective-dated).
3. **Autonomy ladder:**
   - Tier 1 autonomous (reversible, non-monetary)
   - Tier 2 needs one-tap human approval (money-moving)
   - Tier 3 escalate with a case brief
4. **Claude via Amazon Bedrock** as decision engine; **Sarvam AI** for Indic speech, text and vision.

---

## HARD RULES

1. **Deployed product on AWS** (`ap-south-1` unless otherwise specified), all infra in Terraform. No console click-ops.
2. **Simulated core.** Paytm core, ledger and bank systems are SIMULATED by a "Core Mock" service. Synthetic data only. Money-moving tools can only create approval requests.
3. **No hardcoded secrets.** Use Secrets Manager and `.env.example`.
4. **No invented APIs.** Never invent library functions, Terraform resource/argument names, model IDs or API endpoints. Check current official docs and report what was verified and where uncertainty remains.
5. **Policy values are configurable.** TAT days, compensation amounts, MDR rates live in a config file marked `VERIFY AGAINST OFFICIAL CIRCULAR`. Never hardcode them in logic.
6. **Full audit trail.** Every agent decision is logged: reasoning summary, tools called, graph path, confidence, risk tier.
7. **Cost controls first.** AWS Budgets, tags (`project=tara`, `env=demo`), destroy path — before creating costly resources.
8. **Small typed functions.** Tests for each module. A Makefile for common tasks.
9. **Synthetic data only.** Never use real Paytm data, real personal data, or real financial data.
10. **Money movement never executes.** Tools create approval requests only. Execution requires a recorded, signed human approval.

### TARA V2 STANDING RULES (ADDENDUM - U0)
11. **Single Source of Truth:** Every number shown in the UI comes from a backend API computed from one data source. No hardcoded or per-page values.
12. **Relative Dates:** Dates are relative to the current date. No stale seeded dates (e.g. no fixed historical dates from months ago).
13. **Role Segregation:** Merchants never see money-moving approval controls; only ops does. Merchants see status and give consent only.
14. **Honest Labeling:** Anything simulated or synthetic is explicitly labelled in the UI.
15. **No Placeholder Controls:** Every button either performs a real action with a visible outcome or is removed.
16. **Fact Verification:** Never invent library functions, API names, model IDs or Terraform arguments; check current docs and state verified facts.

### TARA V3 STANDING RULES (ADDENDUM - V0: Design Language)
17. **Brand name is Tara.** The reference design's own brand name ("nuvo" or any other) must never appear anywhere in the product — not in code comments, UI copy, alt text, class names, or documentation visible to users.
18. **Self-hosted assets only.** All fonts, images, videos, GLB files, and icons must be self-hosted under `assets/`. No hotlinking to third-party CDNs in production. If any reference spec points to an external asset URL, flag it and wait for explicit approval before use.
19. **"Sample" labels on all pre-login/demo data.** Every number, name, or status shown before authentication or derived from synthetic data must carry a visible "Sample" label in the UI. It must not be hidden behind decorative elements.
20. **QR codes are demo-only and must never encode payment instructions.** No generated QR code may contain a UPI URI, a payment deep-link, or any string that could be mistaken for a payment instruction. QR codes in this prototype encode only opaque demo tokens or Tara demo URLs.
21. **WCAG AA contrast is enforced by the build.** Every foreground/background pair must be computed by a script. The build fails on any pair below 4.5:1 for normal text or 3:1 for large text (≥18px normal weight or ≥14px bold). Color alone must never convey state (pair with icon + text).
22. **Indian-script support on every screen.** All five scripts (Hindi/Devanagari, Tamil, Telugu, Bengali, Marathi/Devanagari) must render without tofu boxes. Layouts must survive longer strings and taller line heights. Italic accent styles must be replaced with weight/colour for Indic scripts.
23. **No invented design APIs.** Never invent font family names, library functions, CSS property names, or browser API names for design work. Check current docs (Google Fonts, MDN, npm) and state exactly what was verified and where uncertainty remains.
24. **Design reference files are `docs/reference/nuvo_hero_prompt.md` and `docs/reference/robot_hero_prompt.md`.** Read both before any V1–V12 design prompt. The token source is `docs/design_tokens.md`.
25. **Mascot is 2D first.** The robot mascot (Tara's face) is a 2D SVG/CSS accent — not a full-screen hero. The 3D Three.js version is only built with explicit user approval after V6 Step 1 is reviewed. The 3D version must fall back to the 2D face if WebGL fails or loading exceeds the time limit.

### TARA V4 STANDING RULES (ADDENDUM - S0: Sandbox Bank & Live Ledger)
26. **Sandbox Bank & Play Money Labeling:** The bank is fictional and always visibly labelled "Sandbox, play money" in the UI, receipts, and QR landing page to prevent anyone mistaking it for real banking.
27. **No Real Marks or Affiliation:** No real bank, UPI, NPCI, card-network, or Paytm marks in the sandbox screens to avoid implying affiliation or real payments.
28. **No Real Personal Data (Synthetic KYC):** KYC is synthetic; the app generates fake identities. Never ask for or store Aadhaar, PAN, card numbers, or real bank details. Reject any inputs that resemble them (Luhn check, 12-digit Aadhaar patterns, 10-character PAN patterns).
29. **Demo PIN:** The sandbox PIN is a throwaway 4-digit demo code, labelled as such. Never ask for or simulate a real UPI PIN.
30. **HTTPS Opaque QR Codes:** Sandbox QR codes encode only an HTTPS link with an opaque token on our domain (e.g. `https://tara-demo.internal/pay?token=...`). No `upi://` scheme, no amount or account data, and no payment-app payload. (This supersedes earlier QR rules).
31. **Integer Paise for Money:** Money is always stored as integer paise (e.g. ₹500.00 = 50000 paise), never floats, ensuring exact double-entry arithmetic.
32. **Compliance Statement:** This prototype is not RBI-, PCI-, or bank-compliant and must not claim to be. Describe it honestly as "designed around bank-grade controls".
33. **Configurable Policy Values:** Fee rates, TAT days, compensation amounts, and MDR rules must live in a config file marked `VERIFY AGAINST OFFICIAL CIRCULAR`, never hardcoded in logic.
34. **Fact Verification:** Never invent library functions, AWS resource names, Terraform attributes, or APIs. Check current official docs, cite verified facts, and note any remaining uncertainties.

### TARA V7 STANDING RULES (ADDENDUM - L0: Real-time Telemetry, Live Pairing & Admin Fleet)
35. **Demo Soundbox (Simulated) Labeling:** The device is a "Demo soundbox (simulated)" and is labelled that way in every UI, receipt, and doc. Never claim a connection to a real Paytm device and never attempt to connect to one.
36. **Live Data & Freshness ("as of"):** All live panels read from the event stream or derived state; no seeded static values. Each live panel shows its freshness ("as of") and a connection indicator.
37. **Stale Data is Unknown:** Stale data is "Unknown", never "OK".
38. **Device Credentials & Security:** Device credentials are per-device, single-use at pairing, rotated, and never exposed to the client beyond what the device needs.
39. **Configurable Timing Variables:** Heartbeat interval, offline timeout, announcement SLA, and reconnect backoff are configuration variables; do not hardcode them and do not invent values: propose options with tradeoffs and measure.
40. **Measured Numbers Only:** Latency and capacity numbers come only from measurements.
41. **Fact Verification:** Never invent library functions, AWS resources, or API fields; check current docs and report what was verified.

### TARA V10 STANDING RULES (ADDENDUM - A0: Merchant Realities, Offline Behavior & Channel Routing)
42. **Unverified Product Behavior as Assumptions:** Do not state how Paytm's real soundbox, app, SMS or notifications behave unless verified; mark such statements "assumption" in docs and the UI copy.
43. **No Offline Money Movement:** Payments, approvals and any money-moving action are never queued or executed offline.
44. **Stale & Unreachable Data as Unknown:** Stale or unreachable data is shown as "unknown" with a last-updated time.
45. **Multi-Channel Fallback Chain:** Critical notices use a fallback chain across channels and record delivery on the case timeline.
46. **Zero Invented APIs:** Never invent library functions, API fields or provider capabilities; check current docs and report what was verified.

---

## THREE HERO WORKFLOWS

1. **Silent soundbox:** detect → diagnose → talk to merchant in their language → fix or dispatch technician → verify recovery.
2. **Settlement mismatch:** detect deduction → explain with policy source → propose right action.
3. **TAT risk:** detect failed transaction nearing reversal deadline → act early → propose compensation if needed → human approves.

---

## ARCHITECTURE SUMMARY

- **Compute:** ECS Fargate
- **LLM:** Claude via Amazon Bedrock + Guardrails
- **Indic AI:** Sarvam AI (external, egress-controlled)
- **Data:** Aurora PostgreSQL (pgvector), Neptune (full profile), OpenSearch (full profile)
- **Streaming:** MSK / SQS+EventBridge behind interface
- **Edge:** CloudFront + WAF + ACM + Cognito
- **Security:** KMS, Secrets Manager, CloudTrail, GuardDuty, AWS Config, mTLS
- **Core Mock:** Separate VPC, PrivateLink, mTLS
- **Profile toggle:** `lean` vs `full` Terraform variable

---

## WHAT IS SIMULATED (say this in the demo)

| Layer | Status |
|---|---|
| AWS infrastructure | Real, deployed with Terraform |
| Application | Real, running at a public HTTPS URL |
| Claude / Sarvam APIs | Real API calls |
| Paytm core / ledger / bank rails | **Simulated** "Core Mock" |
| Merchant and transaction data | **Synthetic** |
| Money movement | **Never executes** — approval requests only |

---

## TARA V7 DEVICE & REAL-TIME RULES (L0)

- **Rule 35**: The device is a **"Demo soundbox (simulated)"** and is labelled that way in every UI, receipt, and doc. Never claim a connection to a real Paytm device and never attempt to connect to one.
- **Rule 36**: All live panels read from the event stream or derived state; no seeded static values. Each live panel shows its freshness (**"as of"**) and a connection indicator.
- **Rule 37**: Stale data is **"Unknown"**, never "OK".
- **Rule 38**: Device credentials are per-device, single-use at pairing, rotated, and never exposed to the client beyond what the device needs.
- **Rule 39**: Heartbeat interval, offline timeout, announcement SLA, and reconnect backoff are configuration variables; do not hardcode them and do not invent values: propose options with tradeoffs and measure.
- **Rule 40**: Latency and capacity numbers come only from measurements.
- **Rule 41**: Never invent library functions, AWS resources, or API fields; check current docs and verify.

---

## FILE STRUCTURE CONVENTIONS

```
infra/                    # Terraform modules and environments
  bootstrap/              # State bucket, OIDC, budgets
  modules/                # Reusable Terraform modules
  envs/demo/              # Demo environment config
backend/                  # Node.js backend (legacy, being replaced)
python-backend/           # Python FastAPI + LangGraph agent
  agent/                  # Agent graph, state, guardrails
  tools/                  # MCP tools and Core Mock client
frontend/                 # React + Vite frontend
docs/                     # Documentation
  customers/              # Customer research artifacts
  adr/                    # Architecture Decision Records
data/                     # Policy documents, seed data
```

---

## REFERENCES

- **PLAYBOOK.md** — Full build playbook with all 23 prompts
- **PLAYBOOK_V2.md** — v2 and v3 prompt sequence (U1–U12, V0–V12)
- **PROGRESS.md** — Execution log and cross-cutting issues tracker
- Read PROGRESS.md before starting any new prompt to maintain context.

### Design (V3)
- **docs/reference/nuvo_hero_prompt.md** — Split-hero reference spec (palette, fonts, layout, motion, responsive rules)
- **docs/reference/robot_hero_prompt.md** — Robot mascot reference spec (evaluated; 2D SVG primary, 3D evaluation checklist)
- **docs/design_tokens.md** — Authoritative CSS custom property tokens (primitives, semantic status, type scale, spacing, motion)
