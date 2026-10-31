# Tara Design Tokens (v3 — Starting Point)

> These are the authoritative design tokens for all Tara v3 work (V1–V12).
> They adapt the nuvo reference palette to the Tara brand and add semantic status tokens.
> The contrast report (generated in V1) will verify every foreground/background pair and fix failures.

---

## Colour Primitives

```css
/* === BRAND PALETTE === */
--color-ground:       #F8E6DD;   /* page background — warm peach */
--color-panel:        #FAF9F5;   /* card / right-column background — warm white */
--color-ink:          #151615;   /* primary text */
--color-ink-soft:     #696C64;   /* secondary text — VERIFY contrast on panel */
--color-muted:        #C3C4C1;   /* DECORATIVE ONLY — fails WCAG AA on panel/ground */
--color-coral:        #FE8A70;   /* card accent / highlights */
--color-cta:          #FA7F62;   /* primary button fill — white text FAILS; use --color-ink */
--color-negative:     #E5714D;   /* amounts out / deficit */
--color-dark-card:    #2C3426;   /* dark card background */
--color-chip:         #EFF2E9;   /* chip / tag background */
```

## Semantic Status Colors

> Every status uses **color + icon + text together**. Color alone must never convey meaning (WCAG 1.4.1).

```css
/* === STATUS SEMANTIC COLORS === */
/* ok / online */
--status-ok-bg:       #E8F5E9;
--status-ok-text:     #1B5E20;   /* verify AA on --status-ok-bg */
--status-ok-icon:     "✓";       /* or CheckCircle icon */

/* warning / stale / low battery */
--status-warn-bg:     #FFF8E1;
--status-warn-text:   #6D4C00;   /* verify AA */
--status-warn-icon:   "⚠";

/* error / offline */
--status-error-bg:    #FFEBEE;
--status-error-text:  #B71C1C;   /* verify AA */
--status-error-icon:  "✕";

/* info */
--status-info-bg:     #E3F2FD;
--status-info-text:   #0D47A1;   /* verify AA */
--status-info-icon:   "ℹ";

/* pending-ops (awaiting ops approval) */
--status-pending-bg:  #FFF3E0;
--status-pending-text:#BF360C;   /* verify AA */
--status-pending-icon:"⏳";

/* stale / unknown (device not pinged recently) */
--status-stale-bg:    #F5F5F5;
--status-stale-text:  #424242;   /* verify AA */
--status-stale-icon:  "?";
```

## Typography Scale

```css
/* === TYPE SCALE === */
--text-xs:    0.75rem;    /* 12px — labels, fine print */
--text-sm:    0.875rem;   /* 14px — secondary content */
--text-base:  1rem;       /* 16px — body */
--text-lg:    1.125rem;   /* 18px — slightly elevated body */
--text-xl:    1.25rem;    /* 20px — sub-headings */
--text-2xl:   1.5rem;     /* 24px — section headings */
--text-3xl:   1.875rem;   /* 30px — page headings */
--text-4xl:   2.25rem;    /* 36px — large display */
--text-hero:  clamp(2.5rem, 5vw, 4rem);  /* welcome headline only */

/* === LINE HEIGHTS === */
--leading-tight:   1.2;
--leading-normal:  1.5;
--leading-relaxed: 1.75;  /* use for Indic scripts — taller descenders */

/* === FONT WEIGHTS === */
--weight-regular:  400;
--weight-medium:   500;
--weight-semibold: 600;
--weight-bold:     700;

/* === FONT FAMILIES === */
/* Latin */
--font-ui:      'Instrument Sans', system-ui, sans-serif;
--font-accent:  'Instrument Serif', Georgia, serif;   /* italic Latin only */

/* Indic — candidates (agent must verify glyph coverage and licensing in V1) */
--font-hindi:      'Noto Sans Devanagari', sans-serif;
--font-tamil:      'Noto Sans Tamil', sans-serif;
--font-telugu:     'Noto Sans Telugu', sans-serif;
--font-bengali:    'Noto Sans Bengali', sans-serif;
--font-marathi:    'Noto Sans Devanagari', sans-serif;  /* same script as Hindi */

/* Indic accent: NO italic — use weight + color instead */
/* .accent-indic { font-weight: var(--weight-semibold); color: var(--color-coral); } */
```

## Spacing Scale

```css
/* === SPACING === */
--space-1:   0.25rem;   /* 4px */
--space-2:   0.5rem;    /* 8px */
--space-3:   0.75rem;   /* 12px */
--space-4:   1rem;      /* 16px */
--space-5:   1.25rem;   /* 20px */
--space-6:   1.5rem;    /* 24px */
--space-8:   2rem;      /* 32px */
--space-10:  2.5rem;    /* 40px */
--space-12:  3rem;      /* 48px */
--space-16:  4rem;      /* 64px */
--space-20:  5rem;      /* 80px */
```

## Border Radius

```css
/* === RADIUS === */
--radius-sm:   4px;
--radius-md:   8px;
--radius-lg:   12px;
--radius-xl:   16px;
--radius-2xl:  24px;
--radius-3xl:  32px;   /* hero left panel */
--radius-full: 9999px; /* pills, chips, avatars */
```

## Shadows

```css
/* === SHADOWS === */
--shadow-sm:  0 1px 2px 0 rgba(21,22,21,0.06);
--shadow-md:  0 4px 12px 0 rgba(21,22,21,0.08);
--shadow-lg:  0 12px 32px 0 rgba(21,22,21,0.10);
--shadow-xl:  0 24px 48px 0 rgba(21,22,21,0.12);
--shadow-card-float: 0 8px 24px rgba(21,22,21,0.12), 0 2px 8px rgba(21,22,21,0.06);
```

## Z-Index Scale

```css
/* === Z-INDEX === */
--z-below:   -1;
--z-base:     0;
--z-raised:   10;   /* floating cards */
--z-sticky:   20;   /* sticky header */
--z-drawer:   30;   /* side drawer / panel */
--z-modal:    40;   /* modals */
--z-toast:    50;   /* toast notifications */
--z-tooltip:  60;   /* tooltips */
```

## Motion Tokens

```css
/* === MOTION DURATIONS === */
--duration-instant:  100ms;
--duration-fast:     200ms;
--duration-normal:   300ms;
--duration-slow:     400ms;
--duration-enter:    600ms;   /* entrance animations */

/* === EASING === */
--ease-out:    cubic-bezier(0.0, 0.0, 0.2, 1.0);
--ease-in:     cubic-bezier(0.4, 0.0, 1.0, 1.0);
--ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1.0);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1.0);  /* subtle spring for cards */

/* === REDUCED MOTION === */
/* All animations must be wrapped in: */
/* @media (prefers-reduced-motion: no-preference) { ... } */
/* or use the JS matchMedia check */
```

---

## Contrast Requirements (to be verified in V1 by script)

| Foreground | Background | Estimated ratio | Required (AA) | Action |
|---|---|---|---|---|
| `--color-ink` (#151615) | `--color-panel` (#FAF9F5) | ~18:1 | 4.5:1 | ✅ Pass |
| `--color-ink` (#151615) | `--color-ground` (#F8E6DD) | ~16:1 | 4.5:1 | ✅ Pass |
| `--color-ink-soft` (#696C64) | `--color-panel` (#FAF9F5) | ~4.1:1 | 4.5:1 | ⚠️ Borderline — measure |
| `--color-muted` (#C3C4C1) | `--color-panel` (#FAF9F5) | ~2.0:1 | N/A | ✅ Decorative only |
| White (#FFF) | `--color-cta` (#FA7F62) | ~2.7:1 | 4.5:1 | ❌ Use `--color-ink` for label |
| White (#FFF) | `--color-coral` (#FE8A70) | ~2.9:1 | 4.5:1 | ❌ Use `--color-ink` for label |
| `--color-ink` (#151615) | `--color-cta` (#FA7F62) | ~4.8:1 | 4.5:1 | ✅ Pass |
| `--color-ink` (#151615) | `--color-chip` (#EFF2E9) | ~15:1 | 4.5:1 | ✅ Pass |
| White (#FFF) | `--color-dark-card` (#2C3426) | ~12:1 | 4.5:1 | ✅ Pass |
| `--status-ok-text` | `--status-ok-bg` | TBD | 4.5:1 | Measure in V1 |
| `--status-warn-text` | `--status-warn-bg` | TBD | 4.5:1 | Measure in V1 |
| `--status-error-text` | `--status-error-bg` | TBD | 4.5:1 | Measure in V1 |

> **Rule:** The V1 contrast script must fail the build on any pair below 4.5:1 for normal text or 3:1 for large text (≥ 18px normal or ≥ 14px bold).
