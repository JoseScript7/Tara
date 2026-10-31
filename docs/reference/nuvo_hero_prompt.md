# Nuvo Hero — Reference Design Spec (adapted for Tara)

> **This is the reference design.** The brand in the final product is **Tara**, never "nuvo".
> Read this alongside `docs/reference/robot_hero_prompt.md` before any V1–V12 prompt.

---

## 1. Layout — Split Hero

```
┌─────────────────────────────────────────────────────────────────────┐
│  LEFT PANEL (~46% width)          │  RIGHT COLUMN (~54% width)      │
│  ─ rounded corners (32px radius)  │  ─ flex column, centred         │
│  ─ margin from viewport edge      │  ─ header: menu | wordmark | lang│
│  ─ overflow hidden                │  ─ 3-line headline               │
│  ─ hero image + video layer       │  ─ lede (2 lines max)            │
│  ─ floating card stack            │  ─ primary CTA + arrow           │
│  ─ corner copy "Hi, I'm / Tara."  │  ─ 2 trust facts at bottom      │
└─────────────────────────────────────────────────────────────────────┘
```

- Desktop breakpoint: ≥ 1024px. Below: right column stacks first, left panel below (portrait-friendly).
- Left panel uses CSS `aspect-ratio: 3/4` on mobile to preserve the image shape.
- All layout in real CSS Grid / Flexbox — no viewport-unit (`vw/vh`) scaling in the app shell. Reserve `--u` viewport-unit scaling for the hero panel only.
- Text zoom at 200%: right column must reflow naturally; no clipped overflow.

---

## 2. Colour Palette

| Token | Value | Notes |
|---|---|---|
| `--color-ground` | `#F8E6DD` | Page background — warm peach |
| `--color-panel` | `#FAF9F5` | Card / right-column background — warm white |
| `--color-ink` | `#151615` | Primary text |
| `--color-ink-soft` | `#696C64` | Secondary text |
| `--color-muted` | `#C3C4C1` | Decorative only — **fails WCAG AA on panel/ground**; never use for readable text |
| `--color-coral` | `#FE8A70` | Card accent / highlight |
| `--color-cta` | `#FA7F62` | Primary button fill |
| `--color-negative` | `#E5714D` | Amounts going out / deficit |
| `--color-dark-card` | `#2C3426` | Dark card background |
| `--color-chip` | `#EFF2E9` | Chip / tag background |

> **Contrast warnings (hand-estimated; compute in code before use):**
> - `--color-ink-soft` (#696C64) on `--color-panel` (#FAF9F5): estimated ~4.1:1 — borderline; measure precisely.
> - `--color-muted` (#C3C4C1) on `--color-panel` or `--color-ground`: estimated ~2.0:1 — **fails AA**; never use for text.
> - White (#FFF) on `--color-cta` (#FA7F62): estimated ~2.7:1 — **fails AA**; use `--color-ink` or a darker coral for button labels.
> - White on `--color-coral` (#FE8A70): similar failure. Use dark text or darken the background.

---

## 3. Typography

### Latin faces
| Role | Family | Weight | Style |
|---|---|---|---|
| Body / UI | Instrument Sans | 400, 500, 600 | Normal only |
| Accent / large display | Instrument Serif | 400 | Italic (Latin only) |

Load via Google Fonts with `display=swap`. Self-host for production (download and place in `assets/fonts/`).

### Indic script families (candidates — **agent must verify glyph coverage and licensing**)
| Script | Language | Candidate family | Italic available? |
|---|---|---|---|
| Devanagari | Hindi | Noto Sans Devanagari | No |
| Tamil | Tamil | Noto Sans Tamil | No |
| Telugu | Telugu | Noto Sans Telugu | No |
| Bengali | Bengali | Noto Sans Bengali | No |
| Marathi | Marathi | Noto Sans Devanagari (same script) | No |

**Indic emphasis rule:** Italic is not available for Indic scripts. Use weight (`600`), a warm colour (`--color-coral`), or a slightly larger size for accent text instead.

### Type scale (CSS custom properties)
```css
--text-xs:   0.75rem;   /* 12px */
--text-sm:   0.875rem;  /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg:   1.125rem;  /* 18px */
--text-xl:   1.25rem;   /* 20px */
--text-2xl:  1.5rem;    /* 24px */
--text-3xl:  1.875rem;  /* 30px */
--text-4xl:  2.25rem;   /* 36px */
--text-hero: clamp(2.5rem, 5vw, 4rem); /* Welcome headline only */
```

---

## 4. Floating Card Stack (Left Panel)

Three cards float in the left panel as illustrative, sample data:

1. **Coral card** — `background: var(--color-coral)`, white text (verify contrast): settlement summary, "Settled" chip, "View detail" link.
2. **Glass card** — `backdrop-filter: blur(12px)`, semi-transparent white: three-row list of Tara actions/insights.
3. **Dark card** — `background: var(--color-dark-card)`, white text: Tara mark or shop QR (demo).

Stack layout: slight rotation + y-offset, CSS `translate` + `rotate` only (no JS on initial paint). Float-in animation via `@keyframes` with `animation-fill-mode: both`.

All cards carry a visible **"Sample"** label.

---

## 5. Hero Image + Video Layer

- Still image (IMG-1): preloaded (`<link rel="preload">`), WebP with AVIF fallback, `object-fit: cover`.
- Video loop: `<video autoplay muted loop playsinline>`, positioned `absolute` over the still, starts only after `canplay` fires.
- Poster frame: a single WebP frame set as `poster` attribute.
- `@media (prefers-reduced-motion: reduce)`: video element hidden; still image shown.
- `@media (prefers-reduced-data)` or Network Information API `saveData`: video not loaded; still shown.

---

## 6. Motion

| Element | Animation | Duration | Easing |
|---|---|---|---|
| Header | Fade + slide up | 400ms | ease-out |
| Headline lines | Clip/wipe up (clip-path or translateY + overflow hidden) | 600ms, staggered 120ms | ease-out |
| Lede | Fade + rise | 400ms, after headline | ease-out |
| CTA | Fade + rise | 300ms, after lede | ease-out |
| Card stack | Float in (translateY from +40px, opacity 0→1) | 500ms each, staggered 80ms | ease-out |
| Facts | Fade | 300ms, last | ease-out |

- All animations use `transform` and `opacity` only (composited — no layout thrash).
- One entrance timeline only; no looping entrance.
- Reduced-motion: skip all entrance animations. Video hidden.

---

## 7. CTA Button

- Background: `var(--color-cta)` — but verify contrast of label text. Use `var(--color-ink)` for the label if white fails.
- Shape: pill (`border-radius: 9999px`), inline-flex, `gap: 8px`, arrow icon at right.
- Hover: translate `Y(-2px)`, box-shadow lift, no colour change on background.
- **Rule:** hover `transform` must not shift the button out of its centred position — use `transform-origin: center` and avoid layout-affecting properties.
- Focus: visible focus ring (`outline: 2px solid var(--color-ink)`, `outline-offset: 3px`).

---

## 8. Responsive Rules

| Viewport | Layout |
|---|---|
| ≥ 1024px | Side-by-side, left ~46%, right ~54% |
| 768–1023px | Side-by-side, adjust proportions or stack |
| < 768px | Right column (text + CTA) first, left panel (image + cards) below |
| 360px | Single column, no horizontal scroll; card stack hidden or simplified |

- Never use `overflow-x: hidden` to paper over horizontal scroll — fix the root cause.
- Text zoom 200%: test that nothing clips and no horizontal scroll appears.

---

## 9. Risks for a Banking-style App

1. **Contrast failures** — muted grey (#C3C4C1) and white-on-coral will fail WCAG AA. Must fix before use.
2. **Viewport-unit scaling** — the `--u` trick (scaling everything via `vw`) breaks browser text zoom. Must be confined to the hero panel only.
3. **Autoplay video** — some browsers block autoplay; always have the still as a visible fallback.
4. **Heavy on-screen animation** — mid-range phones may drop frames; keep off the main thread (transform/opacity only).
5. **Third-party font CDN** — self-host for production; CDN failure should not break the UI.
6. **Italic accent** — Indic scripts have no italic; any italic accent class will silently fall back to upright and look inconsistent. Use weight/colour instead.
7. **Card "Sample" labels** — must be visible and clearly legible; do not hide behind decorative elements.
8. **Glass card on mobile** — `backdrop-filter` is expensive; test on a real mid-range device and add a `@supports` fallback.
