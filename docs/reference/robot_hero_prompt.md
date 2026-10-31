# Three.js Robot Mascot — Reference Spec (evaluated for Tara)

> **Status:** This is a reference for evaluation only. The decision is to use a 2D SVG/CSS mascot as the primary implementation (V6 Step 1). The 3D robot is only built with explicit user approval after Step 1 is reviewed.

---

## 1. Original Reference Concept

A Three.js-rendered robot character used as a hero element on a welcome screen:
- Full-screen WebGL canvas with bloom/glow post-processing
- Rigged character with procedural idle animation (breathing, head sway)
- Cursor-tracking eyes (pointer events → head/eye direction)
- Scene: dark violet/purple atmospheric environment
- Interactive hover triggers (eye colour change, subtle flinch)

---

## 2. Tara Adaptation Decisions (from V0)

| Original feature | Tara decision | Reason |
|---|---|---|
| Full-screen hero | **Not used** — accent/avatar only | Clashes with warm palette; too heavy for the onboarding CTA focus |
| Dark violet colour scheme | **Replaced** with Tara warm palette if built | Brand mismatch |
| Bloom / glow post-processing | **Disabled on mobile** if built | Expensive on mid-range phones |
| Cursor-tracking eyes | **2D CSS fallback required** | Touch devices have no pointer; interaction is meaningless |
| Third-party CDN for GLB assets | **Self-hosted only** if built | Banking app reliability + licensing control |

---

## 3. 2D SVG/CSS Mascot (Step 1 — primary implementation)

Build this first. Only proceed to 3D with explicit user approval.

### Anatomy
```
     ╭─────────╮
    ╭│  O   O  │╮    ← eyes: SVG circles + animated pupil dots
    ││  ╌╌╌╌╌  ││    ← mouth / state indicator (simple arc)
    ╰│         │╯
     ╰─────────╯
```

### States (eye expression only — no text)
| State ID | Visual cue | When |
|---|---|---|
| `idle` | Slow blink every 3–5s (random interval), pupils centred | Default |
| `listening` | Eyes slightly wider, pupils up-left | Voice input active |
| `thinking` | Eyes half-closed, pupils moving left-right slowly | Processing |
| `working` | Pupils spinning (subtle rotation) | Case being resolved |
| `needs-merchant` | Eyebrows raised (SVG path), pupils looking at CTA | Merchant action required |

### Pointer follow (desktop only)
```js
// Only attach if pointer device is primary input
if (window.matchMedia('(pointer: fine)').matches) {
  document.addEventListener('pointermove', updatePupils)
}
```
Smooth follow with `lerp` toward the pointer direction. Clamp to max ±30% of eye radius.

### Reduced motion
```css
@media (prefers-reduced-motion: reduce) {
  .tara-mascot * {
    animation: none !important;
    transition: none !important;
  }
}
```
In reduced-motion: mascot is static (idle state, no blink animation, no pupil movement).

### Palette (Tara warm)
```css
--mascot-body:        #FAF9F5;   /* warm white — same as panel */
--mascot-outline:     #2C3426;   /* dark card colour for depth */
--mascot-eye-bg:      #151615;   /* ink — high contrast pupils */
--mascot-eye-iris:    #FA7F62;   /* coral CTA — warm accent */
--mascot-cheek:       #FE8A70;   /* coral card — flush/warmth */
--mascot-highlight:   #FFFFFF;   /* pupil highlight dot */
```

### Placement
- **Welcome screen:** small avatar (64–80px) at the corner copy ("Hi, I'm / Tara.") or inline with the wordmark.
- **Tara panel (drawer/sidebar):** avatar (40px) beside the panel header.
- **Not** used full-screen; never overlaps form inputs or the CTA button.

### Accessibility
```html
<svg role="img" aria-label="Tara mascot" class="tara-mascot" ...>
  <title>Tara</title>
  ...
</svg>
```
No interactive behaviour on the SVG itself; it is decorative. Screen readers see the title only.

---

## 4. 3D Robot Evaluation Checklist (only complete if user approves Step 1)

Before building any 3D version, report all of the following:

### Asset licensing
- [ ] Identify the GLB model files referenced in the original prompt
- [ ] Open each URL and read the license/terms
- [ ] Confirm whether self-hosting is permitted
- [ ] Confirm whether commercial use (hackathon demo) is permitted
- [ ] Report any attribution requirements

### Performance budget (measure on actual device profile)
| Metric | Target | Measured |
|---|---|---|
| GLB file size (compressed) | Report actual | TBD |
| Time to first meaningful frame (mid-range phone, slow 3G) | Report actual | TBD |
| JS bundle added (Three.js + deps) | Report actual | TBD |
| Idle frame time (composited, canvas off-screen) | Report actual | TBD |
| Memory footprint (mobile Chrome) | Report actual | TBD |

> Do not claim any numbers until measured. Do not invent benchmark targets.

### Technical requirements (if built)
- Use self-hosted, `draco`-compressed GLB files (no CDN hotlinking)
- Disable bloom, SSAO, and all post-processing on `(max-width: 768px)` or if `navigator.hardwareConcurrency < 4`
- Pause rendering (`renderer.setAnimationLoop(null)`) when element is off-screen (IntersectionObserver)
- WebGL fallback: if `canvas.getContext('webgl2')` returns null, or if loading exceeds 5 seconds, swap to the 2D face
- Never block the CTA button or onboarding form — canvas is positioned as a non-interactive accent
- Remove cursor-tracking on touch devices (pointer: coarse)
- Use the Tara warm palette (no dark violet from original reference)

### Load sequence
```
1. Show 2D face immediately (CSS, no load time)
2. Prefetch GLB in background (only after page is interactive)
3. Initialize Three.js off-screen
4. On ready: crossfade to 3D
5. On error/timeout: stay on 2D face (silent, no console error to user)
```

---

## 5. Risks for a Banking-style App

1. **WebGL not universally supported** — always need a 2D fallback; the 2D face IS the primary.
2. **GLB loading blocks interaction** — never tie the CTA or form fields to the 3D load state.
3. **Bloom / post-processing on mobile** — causes frame drops on mid-range Snapdragon; disable on mobile.
4. **Dark violet colour scheme** — does not match the warm Tara palette; requires full re-material.
5. **Cursor tracking on touch** — meaningless and wastes event listeners; must be gated on `pointer: fine`.
6. **Third-party CDN** — GLB/HDR files from third-party URLs fail the asset check; self-host only.
7. **Licensing** — robot GLB models from design references often have usage restrictions; verify before building.
8. **Distraction** — a full-screen animated robot competes with the onboarding CTA; use as a small accent only.
9. **Bundle size** — Three.js + loaders typically add 500KB–1MB to the bundle; report actual size and justify.
