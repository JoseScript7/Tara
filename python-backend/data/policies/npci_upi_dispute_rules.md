# National Payments Corporation of India (NPCI) — UPI Dispute Management Framework
**Circular Reference:** NPCI/UPI/OC-89/2021-22
**Effective Date:** 2021-08-01
**Status:** PLACEHOLDER DRAFT [TODO: REPLACE WITH VERIFIED OFFICIAL CIRCULAR TEXT FROM NPCI.ORG.IN]

---

## 1. UPI Dispute Resolution Mechanism (UDIR)
The Unified Dispute and Issue Resolution (UDIR) automated system governs dispute handling for all UPI participants.

### Clause 1.1: Duplicate Transactions
Where two or more debits occur for a single retail purchase at a merchant counter within a 5-minute interval:
- The acquirer must initiate a credit reversal for the subsequent authorization within **T + 1 day**.
- If the merchant has already delivered the goods, a dispute ticket (Chargeback Code 1061) must be logged with the issuer switch.

### Clause 1.2: Settlement Discrepancy
Where a settlement payout amount differs from the verified QR transaction batch:
- Acquiring entity must provide an itemized fee breakdown (MDR, GST, subscription fee, holdback).
- If the deduction is due to monthly device fee recovery, it must reference the signed merchant schedule.
- Any unresolved discrepancy above ₹500 that cannot be verified against fee schedules requires immediate operations escalation.
