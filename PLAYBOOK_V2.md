# Tara v2: From "AI-made dashboard" to a working teammate

**Based on:** four screenshots of the deployed app (Home/3D Room, Devices, Offers & Loans, Reports). I have not seen the code, the other pages, or the ops console, so verify each finding against the app before acting.

---

## 1. Review findings

| # | Finding (from screenshots) | Why it matters | Fix (prompt) |
|---|---|---|---|
| 1 | Home says "All systems active" and Soundbox Online; Devices shows Soundbox OFFLINE (last ping ~7h, battery 12%); chat says "everything looks good" | The exact false "all is well" failure Slide 4 claims to prevent | U1 |
| 2 | Reports GTV ₹2,90,470 (30 days) vs Offers "₹4.8L last month"; chart dates Sep 05–17 | Numbers are not from one source; dates are stale | U1 |
| 3 | Merchant view contains "Pending Approvals" with a ₹100 compensation already "Approved" | Approvals belong to ops; merchant should only give consent | U3, U10 |
| 4 | Offline + 12% battery → "Replacement Pending Approval" | Skips cheap Tier 1 fixes (e.g. ask merchant to charge) | U7 |
| 5 | Loan and free-upgrade offers shown during an open device issue | Tone-deaf; suppressing offers is better judgment | U13 |
| 6 | 3D room is a static image, side panels clipped, not tied to telemetry | Decorative; does not serve the core motive | U11 |
| 7 | Generic SaaS template: identical cards, sparkle icons, stock copy | Reads as AI-made; nothing shows Tara's work | U15 |
| 8 | Donut chart has no values; heatmap is sparse and unexplained | Charts decorate rather than inform | U12 |
| 9 | Login asks for a phone number with no verification | No real authentication | U2 |

## 2. Design principles for v2

1. **Cases are the backbone.** Every page is a view over cases: timeline, evidence, clock, outcome.
2. **Show the work.** Every action has a "Why did Tara do this?" drawer: graph path, policy cited, memories recalled, confidence, risk tier.
3. **One source of truth.** Every number is computed once by the backend. Pages never invent or hardcode values.
4. **Roles are separate.** Merchants see status and give consent. Ops approves money-moving actions.
5. **Judgment over promotion.** Tara suppresses upsells during open issues and says so.
6. **Honest labels.** Simulated systems and synthetic data are labelled in the UI.
7. **Fewer, deeper screens.** Prioritize the three hero workflows: silent soundbox, settlement mismatch, TAT risk.

## 3. What "Brain" and "Second Brain" mean in the product

- **Brain (reasoning):** Claude on Bedrock + the Ontology (typed graph: Merchant, Device, Transaction, Settlement, Ticket, PolicyRule, Action) + policy retrieval. It answers "what is happening and what should I do?"
- **Second Brain (memory that persists):**
  - *Merchant memory:* language, contact preference, past issues and what fixed them.
  - *Team memory:* resolved cases and human overrides stored as lessons.
  - *Policy memory:* versioned, effective-dated rules with sources.
- **Visible in the UI as:** a "Why did Tara do this?" drawer on every action, a Brain page (graph explorer, memory, decision log), and "What Tara remembers about you" with view and delete controls for the merchant.

## 4. Target information architecture

**Merchant app:** Tara's Desk (home) · Devices · Transactions · Settlements · Disputes · Insights · Offers · Settings (language, notifications, memory controls, consent).
**Ops console (separate login):** Live signals · Approvals · Escalations · Case inspector · Brain (graph, memory, policies) · Metrics.
**Always present:** a context-aware Tara panel that knows the current page and case.

---

## 5. Prompt sequence

Paste one at a time. Review the agent's plan before it builds. Each ends with a **Done when** check.

### U0: Addendum to the standing rules

```text
Add these rules to PROJECT_BRIEF.md and follow them from now on:
- Every number shown in the UI comes from a backend API computed from one
  data source. No hardcoded or per-page values.
- Dates are relative to the current date. No stale seeded dates.
- Merchants never see money-moving approval controls; only ops does.
- Anything simulated or synthetic is labelled in the UI.
- No placeholder buttons: every button either performs a real action with a
  visible outcome or is removed.
- Never invent library functions, API names, model IDs or Terraform
  arguments; check current docs and tell me what you verified.
Confirm and wait.
```

### U1: Audit and single source of truth

```text
Audit the whole app. Produce docs/audit.md listing every page, component,
button and displayed number, marking each as: real (API-backed), static, or
broken. List every cross-page contradiction (for example device status,
GTV, dates, settlement amounts).

Then build a derived-state layer in the backend: one service that computes
device health, merchant status, GTV, settlement totals, open cases and TAT
clocks from the database. All pages read from it. Apply the stale-data rule:
telemetry older than a threshold is "unknown", never "healthy". "All systems
active" must be derived from device health, open cases and stale flags.

Add invariant tests: the same device has the same status on every page; GTV
matches across Reports, Offers and Home; every date is within the data
window and relative to today; the Tara greeting never says "everything looks
good" when an open case or offline device exists.

Done when: the audit file exists, all invariants pass, and the Home, Devices
and chat panel agree about the offline soundbox.
```

### U2: Phone OTP login

```text
Implement phone-number login with SMS OTP for merchants.
Flow: enter phone -> request OTP -> enter 6-digit code -> session.
Requirements:
- Code expiry (a few minutes), attempt limit, resend cooldown, per-phone and
  per-IP rate limiting, generic errors that don't reveal whether a number
  exists, no OTP ever written to logs.
- Implement with Amazon Cognito custom authentication or another approach you
  recommend; check current docs for the supported SMS options and India
  requirements (sender/template registration, regional restrictions) and tell
  me what you verified and what you're unsure about.
- Put SMS sending behind an SmsProvider interface so providers can be swapped.
- Demo mode (environment flag, disabled elsewhere): allowlisted demo numbers
  accept a fixed code, and the UI clearly shows "Demo mode".
- After first login: language selection and a consent screen explaining what
  Tara remembers, with a link to memory controls.
- Ops users sign in separately with email + MFA and are routed to the ops
  console. Role is determined by account, never by a user-selected option.
- Session expiry, logout, and "log out everywhere".
Add tests for expiry, lockout, rate limit and role routing.

Done when: on my phone I can log in with a real SMS (or the demo path),
wrong or expired codes are rejected, and a merchant cannot reach ops routes.
```

### U3: Role separation and information architecture

```text
Restructure into a Merchant app and an Ops console per the IA in the
playbook. Move all approval controls to the Ops console. In the merchant
app, replace "Pending Approvals" with "Needs your OK" for merchant consent
items only (for example agreeing to a technician visit or confirming a
delivery address) and a read-only status for anything awaiting ops.
Add route guards and API permission checks for each role.

Done when: a merchant cannot see or call any approval endpoint, and ops can
see all cases.
```

### U4: Brain and Second Brain made visible

```text
Build the explainability surfaces:
1. "Why did Tara do this?" drawer on every action and case event showing:
   the ontology path (rendered as a readable chain), policy chunks cited with
   source and effective date, memories recalled (merchant, team, policy),
   tools called, confidence, risk tier, and what Tara would need to be
   certain.
2. Brain page (ops): interactive graph explorer (search a merchant, device or
   transaction; expand neighbors; highlight the path used in a decision),
   decision log with filters, and a lessons list showing which human
   overrides changed later behavior.
3. "What Tara remembers about you" (merchant): readable list of stored memory
   items with a delete button and an explanation of why each exists. Deleting
   removes it from retrieval; confirm with tests.
Keep the visuals clean and legible rather than decorative.

Done when: for the silent-soundbox case I can open the drawer and follow
device -> telemetry -> affected transactions -> settlement -> policy, and a
deleted memory no longer appears in the agent's context.
```

### U5: Case engine as the backbone

```text
Make cases the core domain object. A Case has: type, merchant, linked entities
(from the ontology), state machine (detected, diagnosing, acting, waiting on
merchant, waiting on ops, verifying, resolved, escalated), SLA/TAT clock
(policy values from the config file marked VERIFY), tier, timeline events with
actor (Tara, merchant, ops, system), evidence attachments, and an outcome
check. Every module (devices, settlements, disputes) creates and links cases
instead of keeping its own state. Provide APIs and server-sent events so
screens update live.

Done when: triggering any scenario creates a case whose timeline updates live
and closes only after an outcome check passes.
```

### U6: Home becomes "Tara's Desk"

```text
Replace the generic home with Tara's Desk:
- Top: honest status derived from real state (for example "1 device needs
  attention", not a generic "all systems active").
- "Tara is working on" list: active cases with live step, time open, next
  step, and what Tara needs from the merchant, if anything.
- "Tara did this for you" feed: completed actions with outcome and a link to
  the explainability drawer.
- A TAT clock strip for anything near a deadline.
- Short, specific copy. No sparkle decoration, no generic greeting.

Done when: with the offline soundbox scenario active, the Desk shows the case,
the step, and the next action, and nothing says everything is fine.
```

### U7: Devices with real depth

```text
Make Devices functional:
- Telemetry: real time-series for battery, signal, last ping, firmware, with
  event markers (offline started, restarted, firmware updated).
- Tara's inference with confidence (for example "battery 12% and offline
  since X: likely discharged") and the evidence behind it.
- Action ladder: Tier 1 first (message the merchant in their language to
  charge or restart, run remote diagnostic, resync config), then verify from
  fresh telemetry; only then Tier 2/3 (replacement) with reasons why cheaper
  fixes failed.
- Replacement flow: address confirmation (merchant consent), technician slot,
  ETA, status, and post-visit verification.
- "Report an issue" creates a case with photo or voice, not just a form.
- Device history and what fixed past issues (from the Second Brain).

Done when: the offline soundbox goes through charge-request -> verify ->
(if still offline) replacement approval in ops -> technician -> verified
recovery, with every step on the case timeline.
```

### U8: Transactions and Settlements with depth

```text
Transactions: filters, search, status, per-transaction timeline, link to the
settlement it belongs to, and "why is this delayed?" with an explanation from
the ontology path.
Settlements: expected vs received, cycle dates, deduction breakdown line by
line with the rule behind each (rates and fees from a config marked VERIFY,
never hardcoded in logic), a mismatch finder that highlights differences,
and a plain-language explanation in the merchant's language. "Reconcile" runs
a real check against the Core Mock and produces a result, not just a toast.
Downloadable statement.

Done when: an injected settlement mismatch is found, explained with a
citation, and linked to a case.
```

### U9: Disputes and TAT

```text
Build Disputes as a real workflow: raise from a transaction, evidence upload
(validated, stored in S3 with pre-signed URLs), a case timeline with the TAT
clock, status updates from the Core Mock, and automatic proactive action
before the deadline. Compensation eligibility is computed from policy values
in the config file (marked VERIFY AGAINST OFFICIAL CIRCULAR) and always cites
the retrieved policy chunk; if no source is retrieved, Tara says she is
unsure and escalates.

Done when: a failed-but-debited transaction nearing its deadline is acted on
early, and compensation is proposed with a citation and sent to ops.
```

### U10: Approvals with real depth (ops console)

```text
Rebuild Approvals so it is not a simple click-to-approve:
- Approval card shows: evidence timeline, the computed amount and how it was
  computed, the policy citation, fraud/risk checks, merchant history,
  alternatives Tara considered, and Tara's confidence.
- Effect preview: exactly what will happen in the Core Mock if approved.
- Actions: approve, modify amount (with reason), reject (with reason), request
  more info, or escalate to a second approver above a configurable threshold.
- SLA timer for the approval itself.
- On approval, generate a signed approval token that the Core Mock verifies;
  after execution, verify the result, produce a receipt, notify the merchant
  in their language, and write the audit entry.
- Every rejection and modification is stored as a lesson in team memory with
  the context, so later similar cases change.
- Undo/reversal window where the Core Mock supports it.

Done when: approving, modifying and rejecting each produce the right merchant
notification, audit entry and lesson, and a rejected case changes the agent's
behavior on a later similar case.
```

### U11: Replace the 3D room with a Store Twin

```text
Replace the static 3D room with a Store Twin: a clean schematic (isometric
SVG or lightweight canvas) of the store with the soundbox, EDC machine and QR
sticker as nodes. Node color and badges come from live derived state (online,
offline, stale, battery low, case open). Clicking a node opens a panel with
telemetry, affected transactions (ontology path), active case and Tara's
actions. Fix any clipped panels and make it responsive on mobile.
Do not claim the app maps the space from a photo unless real vision
processing exists and is tested; if it does, show what was detected and the
confidence. If you think a real 3D scene is worth it later, propose it
separately with effort and risk.

Done when: switching the soundbox to offline in the simulator turns its node
red within seconds and opens the right case.
```

### U12: Reports and Insights grounded in data

```text
Make Reports real:
- All figures computed by the backend; the language model writes the narrative
  only and never does arithmetic. Every statement in an executive summary
  must reference the figure and period it came from.
- Charts with labelled axes and values, payment-mode shares with percentages,
  date ranges that follow today's date.
- Peak-hours heatmap with a clear legend and one actionable insight derived
  from data (for example an outage that overlapped peak hours and what it
  affected).
- Reports numbers must match Home and Offers (add tests).
- PDF download that actually contains the report.

Done when: the invariant tests pass and the summary text can be traced to
specific numbers.
```

### U13: Context-aware offers

```text
Make Offers respect context. Suppress or defer loan and upgrade offers while a
related case is open, and explain why ("Tara is holding offers until your
device issue is resolved"). Eligibility explanation ("Why am I eligible?")
must come from real features of the synthetic data and show them. Clearly
label the loan as a simulated offer in the UI. Check the EMI math
programmatically (add tests). Free hardware upgrade should connect to the
device case instead of duplicating it.

Done when: with an open device case, no loan offer is promoted, and the page
explains why; after resolution, offers return.
```

### U14: Tara panel: actions, not just text

```text
Make the Tara panel context-aware (knows page, device, case). Responses can
contain action cards (confirm technician slot, approve a consent, upload a
photo, open a case), render streaming text, support voice notes and the
merchant's language via Sarvam, and show citations. Remove generic greetings;
the first message reflects real state. Handle failures gracefully (fallback to
mock mode or a clear error, never a confident wrong answer).

Done when: from the Devices page I can say "my soundbox is silent" by voice in
Tamil and watch Tara open a case, ask me to charge it, and verify recovery.
```

### U15: Design system pass (avoid the "AI-made" look)

```text
Follow the frontend-design guidance. Propose a distinct visual identity before
changing code: type scale, a restrained palette with strong semantic status
colors, spacing, and component rules. Specific changes:
- Remove sparkle icons and generic marketing copy; use specific, human,
  bilingual microcopy.
- Prefer tables, timelines and evidence layouts over repeated identical cards.
- Real empty, loading and error states; skeletons instead of spinners.
- Accessible contrast, large touch targets, minimum font sizes suited to
  shopkeepers on mid-range phones, and tested at 360px width.
- Motion only when it communicates state (a node turning red, a timeline step
  completing).
- A single Tara mark used consistently.
Show me the proposal and two layout options for Tara's Desk, then implement
the one I choose across all pages.

Done when: all pages share one system and pass an accessibility check.
```

### U16: Realistic data and a scenario director

```text
Improve the seed data so it tells a coherent story across pages: one merchant
with believable history, patterns, devices, settlements and one or two open
issues. Add a Scenario Director in the ops console to trigger scenarios on
demand (silent soundbox, settlement mismatch, TAT risk, escalated case), with
a clock control to fast-forward time and a reset. Keep ground-truth labels
hidden from the agent. Label data as synthetic in the UI.

Done when: I can run the three hero scenarios back-to-back from the director
with consistent data on every page.
```

### U17: QA, performance and rehearsal

```text
Add end-to-end tests (Playwright or equivalent; verify current tooling) for
login, each hero workflow, role separation and the invariants. Run an
accessibility audit, a mobile pass at 360px, and a performance check on the
deployed URL. Add a smoke test to CI that runs after each deploy. Produce a
3-minute demo script that shows: Tara's Desk, the silent soundbox through the
case timeline, the "Why did Tara do this?" drawer, an ops approval with
evidence, and the Brain page showing a lesson that changed behavior. Include
a recorded-video backup plan.

Done when: all tests pass against the deployed environment and a full
rehearsal runs in three minutes.
```

---

## 6. Things to verify

| Item | Why |
|---|---|
| SMS rules for India (sender/template registration) and what your provider requires | I believe registration is required but am not certain of current specifics; it can take time, so start early |
| Cognito custom-auth and SMS options, regional availability | Check current AWS docs |
| Loan, fee and compensation values shown in the UI | All are placeholders; label as simulated and replace policy values with verified circular text |
| Use of Paytm branding and logos in the UI and room image | Check the hackathon's and Paytm's brand guidelines |
| Sarvam and Bedrock model names | Same caveats as the first playbook |
| Test tooling versions (Playwright etc.) | Check current docs |
