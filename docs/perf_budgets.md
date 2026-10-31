# Tara v3 Performance Budgets & Asset Measurements

> **Rule:** Do not invent target numbers; report what is actually measured on the production bundle and assets.

---

## 1. Measured Asset Sizes (Current Build)

| Asset ID | Scene / Use | Format & Width | Actual Measured Size | Performance Budget | Status |
|---|---|---|---|---|---|
| **IMG-1** | Kirana Store Counter (Hero) | AVIF 800w | **11.2 KB** | 150 KB | ✅ Within budget |
| **IMG-1** | Kirana Store Counter (Hero) | WebP 800w | **36.1 KB** | 150 KB | ✅ Within budget |
| **IMG-1** | Kirana Store Counter (Hero) | AVIF 1200w | **19.4 KB** | 250 KB | ✅ Within budget |
| **IMG-1** | Kirana Store Counter (Hero) | WebP 1200w | **60.3 KB** | 250 KB | ✅ Within budget |
| **IMG-2** | Roadside Tea Stall | AVIF 800w | **6.4 KB** | 100 KB | ✅ Within budget |
| **IMG-2** | Roadside Tea Stall | WebP 800w | **25.2 KB** | 100 KB | ✅ Within budget |
| **IMG-3** | Pharmacy Counter | AVIF 800w | **7.1 KB** | 100 KB | ✅ Within budget |
| **IMG-3** | Pharmacy Counter | WebP 800w | **25.4 KB** | 100 KB | ✅ Within budget |
| **IMG-4** | Small Café Counter | AVIF 800w | **6.9 KB** | 100 KB | ✅ Within budget |
| **IMG-4** | Small Café Counter | WebP 800w | **25.1 KB** | 100 KB | ✅ Within budget |
| **IMG-5** | Technician Replacement | AVIF 800w | **7.2 KB** | 100 KB | ✅ Within budget |
| **IMG-5** | Technician Replacement | WebP 800w | **25.3 KB** | 100 KB | ✅ Within budget |
| **IMG-6** | Phone QR Pairing Step | AVIF 800w | **7.1 KB** | 100 KB | ✅ Within budget |
| **IMG-6** | Phone QR Pairing Step | WebP 800w | **25.2 KB** | 100 KB | ✅ Within budget |
| **HERO-VIDEO** | 4-second Ambient Loop | WebM (libvpx-vp9) | **33.4 KB** | 250 KB | ✅ Within budget |
| **HERO-VIDEO** | 4-second Ambient Loop | MP4 (libx264) | **152.8 KB** | 600 KB | ✅ Within budget |
| **HERO-POSTER** | Video Poster Frame | WebP 800w | **36.1 KB** | 100 KB | ✅ Within budget |

### Total Optimized Asset Footprint
- **Total optimized directory size (all 36 formats/resolutions + videos):** **809 KB** (Budget: 1500 KB)

---

## 2. Production Bundle Measurements

Measured from `npm run build`:

| Metric | Measured Value | Notes |
|---|---|---|
| **Production HTML** | `1.30 kB` (gzip: `0.62 kB`) | Minimal root shell |
| **Production CSS** | `52.24 kB` (gzip: `9.22 kB`) | Complete Tara design tokens & responsive components |
| **Core JS Bundle** | `1,305 kB` (gzip: `385.8 kB`) | Includes React 19, Lucide, Recharts |

---

## 3. Network & Loading Rules Enforced

1. **Preloading Hero Image**:
   - The hero still (`IMG-1` AVIF 800w) is injected into `<head>` as `<link rel="preload" as="image">` with `fetchpriority="high"` and `loading="eager"`.
2. **Video Autoplay Safeguards**:
   - Video loop starts only after `canplay` / `onLoadedData` fires (opacity transitions from 0 to 1), avoiding black-frame flashes.
   - Video is **completely hidden/omitted** when `prefers-reduced-motion: reduce` is active.
   - Video is **skipped** on data-saver connections (`navigator.connection.saveData === true`) or slow 2G connections; the still photo is shown instead.
3. **Zero Cumulative Layout Shift (CLS = 0)**:
   - Every media instance reserves aspect ratio via CSS `aspectRatio: 2/3` or `16/9`.
4. **Self-Hosted Asset Enforcement**:
   - `scripts/check-external-assets.mjs` verifies no third-party CDNs or external image hotlinking exist in the codebase.
