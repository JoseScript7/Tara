# Tara — Wizard-of-Oz Test Script

> **Purpose:** You play Tara (over chat or voice) for one scripted issue and observe how the merchant reacts. This validates assumptions about tone, language, channel preference, and trust before building the real system.

---

## Scenario: Silent Soundbox

**Setup:** A kirana shop owner's soundbox has stopped beeping for incoming payments. Customers are paying but the merchant doesn't hear the confirmation sound. The merchant is worried they're losing money.

---

## Script

### Phase 1: Initial Contact

**Merchant initiates** (in their language or English):
> "My soundbox is not making sound. Customers are paying but I can't hear anything. Am I losing money?"

**You (as Tara) respond:**

> "Namaste [name] ji 🙏 Main Tara hoon, aapki Paytm payment assistant.
>
> Main aapke soundbox ki checking karti hoon. Ek minute dijiye...
>
> ✅ Aapka soundbox SB-4421 online hai.
> ✅ Last 1 ghante mein 3 payments aaye hain — sab successfully credited hain.
>
> Lagta hai speaker mein issue hai. Main ek fix try karti hoon — aapki permission se."

_[If testing in English]:_
> "Hi [name], I'm Tara, your Paytm payment assistant.
>
> Let me check your soundbox... one moment.
>
> ✅ Your soundbox SB-4421 is online.
> ✅ 3 payments received in the last hour — all successfully credited.
>
> It looks like there's a speaker issue. I'd like to try a fix — with your permission."

### Phase 2: Diagnosis & Fix Attempt

**Merchant responds:** (expected: "Yes, please fix it" or "What fix?")

**You (as Tara):**
> "Main aapke soundbox ka configuration reset kar rahi hoon. Ye safe hai — aapki koi payment nahi jaayegi.
>
> ⏳ Reset ho raha hai...
>
> ✅ Reset complete! Kya ab sound aa rahi hai? Ek test payment karke check kar sakte hain."

### Phase 3: Verification

**If merchant says it's fixed:**
> "Bahut accha! 🎉 Main is issue ko apne record mein save kar rahi hoon taaki future mein jaldi fix ho sake. Aur koi problem ho toh mujhse poochiye."

**If merchant says it's NOT fixed:**
> "Samajh gayi. Lagta hai hardware issue hai. Main ek technician ko schedule karti hoon aapke location pe.
>
> 📋 Technician aayega: [tomorrow / within 24 hours]
> 📍 Aapka registered address: [address]
>
> Kya ye time aapko suit karta hai?"

### Phase 4: Escalation (if needed)

**If merchant becomes frustrated or the fix doesn't work after two attempts:**
> "Main samajhti hoon ye frustrating hai. Main is case ko senior support team ko bhej rahi hoon with full details — aapko dobara explain nahi karna padega.
>
> Case #TK-XXXX created. Aapko 2 ghante mein update milega."

---

## Observation Notes (fill during the test)

### Participant Info
- **Participant #:** ___
- **Persona type:** Kirana / Café / Pharmacy
- **Language used:** ___
- **Channel:** Voice / Chat / In-person

### Observations

| Moment | Merchant's reaction | Notes |
|---|---|---|
| Initial greeting | _[How did they react to the tone?]_ | |
| "Main checking karti hoon" | _[Did they wait patiently?]_ | |
| Payment confirmation (✅) | _[Did this ease anxiety?]_ | |
| "Aapki permission se" | _[Did they appreciate being asked?]_ | |
| Reset attempt | _[Trust level? Nervous?]_ | |
| Verification question | _[Did they know how to test?]_ | |
| Technician scheduling | _[Was the timeline acceptable?]_ | |
| Escalation (if reached) | _[Relief or frustration?]_ | |

### Key Takeaways
- Did the merchant trust Tara? ___
- Was the language/tone appropriate? ___
- Was the fix attempt reassuring or scary? ___
- Would they use this instead of calling support? ___
- What would they change? ___

### Changes to Make
- _[List any wording, tone, or flow changes based on this test]_

---

## Running the Test

1. **Find a willing participant** (shop owner you know, family member running a business, etc.)
2. **Set up:** Use WhatsApp, a phone call, or in-person chat. Explain it's a test — you're playing the role of an AI assistant.
3. **Read the script above** but adapt naturally to their responses. Don't sound robotic.
4. **Observe:** Watch their face, listen to their tone. Note moments of trust, confusion, or frustration.
5. **Debrief:** After the test, ask: "Was this helpful? What would you change? Would you use something like this?"
6. **Record:** Fill in the observation notes above and add to `synthesis_template.md`.
