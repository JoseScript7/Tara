/**
 * Tara v3 Asset Optimization Pipeline
 * - Converts source images to AVIF and WebP at 400w, 800w, 1200w
 * - Produces compressed MP4 & WebM looping video with poster frame
 * - Generates asset manifest with alt text, credits, and dimensions
 * - Synthesizes warm-neutral gradient placeholders when source files are pending
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import ffmpegPath from 'ffmpeg-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT_DIR, 'public', 'assets', 'source');
const OPTIMIZED_DIR = path.join(ROOT_DIR, 'public', 'assets', 'optimized');
const MANIFEST_PATH = path.join(ROOT_DIR, 'public', 'assets', 'manifest.json');
const SRC_MANIFEST_PATH = path.join(ROOT_DIR, 'src', 'design-system', 'assetManifest.json');

// Asset specifications from V3 prompt sequence
const ASSET_SPECS = [
  {
    id: 'IMG-1',
    slug: 'img-1-welcome-hero',
    title: 'Kirana Store Counter Hero',
    alt: 'Neighborhood kirana shop counter in warm golden-hour light with a payment soundbox and QR stand beside a steel scale',
    credit: 'Tara Synthetic Asset Library (Golden Hour Kirana Series)',
    aspectRatio: '2:3',
    width: 1200,
    height: 1800,
    primaryColors: ['#F8E6DD', '#FE8A70', '#FAF9F5', '#2C3426'],
    prompt: 'A neighborhood grocery (kirana) shop counter in golden-hour light: a small speaker-style payment soundbox and a QR stand beside a steel scale, jars on shelves behind, a hand resting on the counter (no face)',
  },
  {
    id: 'IMG-2',
    slug: 'img-2-tea-stall',
    title: 'Roadside Tea Stall at Dusk',
    alt: 'Roadside tea stall counter at dusk with steam gently rising from a brass kettle, glass tumblers, and a small QR stand',
    credit: 'Tara Synthetic Asset Library (Tea Stall Series)',
    aspectRatio: '16:9',
    width: 1200,
    height: 675,
    primaryColors: ['#F8E6DD', '#E5714D', '#2C3426', '#FAF9F5'],
    prompt: 'A roadside tea stall at dusk: steam rising from a kettle, glass tumblers, a small QR stand on the counter',
  },
  {
    id: 'IMG-3',
    slug: 'img-3-pharmacy',
    title: 'Neighborhood Pharmacy Counter',
    alt: 'Clean pharmacy counter in soft morning light with shelves of medicine boxes with blank labels and a payment card machine',
    credit: 'Tara Synthetic Asset Library (Healthcare Retail Series)',
    aspectRatio: '16:9',
    width: 1200,
    height: 675,
    primaryColors: ['#FAF9F5', '#EFF2E9', '#0B479D', '#F8E6DD'],
    prompt: 'A small pharmacy counter in soft morning light: shelves of boxes with blank labels, a card machine on the counter',
  },
  {
    id: 'IMG-4',
    slug: 'img-4-cafe',
    title: 'Small Café Counter',
    alt: 'Warm café counter in evening light with an espresso machine and a handheld payment terminal',
    credit: 'Tara Synthetic Asset Library (Artisan Cafe Series)',
    aspectRatio: '16:9',
    width: 1200,
    height: 675,
    primaryColors: ['#2C3426', '#FE8A70', '#F8E6DD', '#151615'],
    prompt: 'A small café counter in evening light: espresso machine, a handheld card terminal, warm bulbs',
  },
  {
    id: 'IMG-5',
    slug: 'img-5-technician',
    title: 'Device Replacement & Field Visit',
    alt: 'Technician hands gently holding a compact payment terminal with a screwdriver and charging cable on a wooden surface',
    credit: 'Tara Synthetic Asset Library (Field Operations Series)',
    aspectRatio: '16:9',
    width: 1200,
    height: 675,
    primaryColors: ['#F8E6DD', '#FAF9F5', '#6B4700', '#2C3426'],
    prompt: 'A technician hands holding a small payment device, a screwdriver and a charger cable on a wooden counter',
  },
  {
    id: 'IMG-6',
    slug: 'img-6-qr-pairing',
    title: 'Phone QR Pairing Step',
    alt: 'Hands holding a smartphone aiming the camera toward a payment QR sticker on a counter with blurred background',
    credit: 'Tara Synthetic Asset Library (Onboarding Series)',
    aspectRatio: '16:9',
    width: 1200,
    height: 675,
    primaryColors: ['#FAF9F5', '#FA7F62', '#F8E6DD', '#151615'],
    prompt: 'A phone held toward a QR sticker on a shop counter, only hands and the phone visible, blurred shop behind',
  },
];

const TARGET_WIDTHS = [400, 800, 1200];

// Creates an elegant placeholder SVG that strictly honors Tara's warm aesthetic
function generatePlaceholderSvg(spec) {
  const [c1, c2, c3] = spec.primaryColors;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${spec.width} ${spec.height}" width="${spec.width}" height="${spec.height}">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c1}" />
          <stop offset="60%" stop-color="${c2}" stop-opacity="0.8" />
          <stop offset="100%" stop-color="${c3}" />
        </linearGradient>
        <radialGradient id="glow" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
        </radialGradient>
        <filter id="softBlur" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="30" />
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#bgGrad)" />
      <circle cx="${spec.width * 0.4}" cy="${spec.height * 0.35}" r="${spec.width * 0.3}" fill="url(#glow)" />
      
      <!-- Subtle counter and device silhouettes in shallow depth -->
      <g filter="url(#softBlur)" opacity="0.35">
        <rect x="${spec.width * 0.1}" y="${spec.height * 0.55}" width="${spec.width * 0.8}" height="${spec.height * 0.35}" rx="32" fill="#2C3426" />
        <rect x="${spec.width * 0.25}" y="${spec.height * 0.3}" width="${spec.width * 0.25}" height="${spec.height * 0.35}" rx="24" fill="#FA7F62" />
        <rect x="${spec.width * 0.6}" y="${spec.height * 0.25}" width="${spec.width * 0.2}" height="${spec.height * 0.4}" rx="16" fill="#151615" />
      </g>
      
      <!-- Safe aesthetic watermark -->
      <g opacity="0.4" transform="translate(${spec.width * 0.08}, ${spec.height * 0.9})">
        <text font-family="system-ui, sans-serif" font-size="28" font-weight="600" fill="#151615">TARA • ${spec.id} (${spec.title.replace(/&/g, '&amp;')})</text>
      </g>
    </svg>
  `.trim();
}

async function runPipeline() {
  console.log('='.repeat(72));
  console.log(' TARA v3 ASSET PIPELINE: CONVERTING, OPTIMIZING & PACKAGING');
  console.log('='.repeat(72));

  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });

  const manifest = {
    version: '3.0.0',
    generatedAt: new Date().toISOString(),
    assets: {},
    videoLoops: {},
    performanceBudgets: {
      heroImageMaxKb: 150,
      heroVideoMaxKb: 600,
      totalAssetsMaxKb: 1500,
    },
    actualMeasurements: {},
  };

  let totalSizeOptimized = 0;

  for (const spec of ASSET_SPECS) {
    console.log(`\n▶ Processing [${spec.id}] ${spec.title}...`);

    // Look for dropped user file in SOURCE_DIR
    const sourceCandidates = [
      path.join(SOURCE_DIR, `${spec.id.toLowerCase()}.jpg`),
      path.join(SOURCE_DIR, `${spec.id.toLowerCase()}.png`),
      path.join(SOURCE_DIR, `${spec.id.toLowerCase()}.webp`),
      path.join(SOURCE_DIR, `${spec.slug}.jpg`),
      path.join(SOURCE_DIR, `${spec.slug}.png`),
    ];

    let sourceBuffer = null;
    let isUserFile = false;

    for (const cand of sourceCandidates) {
      if (fs.existsSync(cand)) {
        sourceBuffer = fs.readFileSync(cand);
        isUserFile = true;
        console.log(`  ✓ Found source file: ${path.basename(cand)}`);
        break;
      }
    }

    // If no custom user file dropped yet, generate warm SVG placeholder master
    if (!sourceBuffer) {
      console.log(`  ℹ No user drop yet for ${spec.id}; synthesizing warm placeholder master...`);
      const svg = generatePlaceholderSvg(spec);
      sourceBuffer = Buffer.from(svg);
    }

    const assetRecord = {
      id: spec.id,
      slug: spec.slug,
      title: spec.title,
      alt: spec.alt,
      credit: spec.credit,
      aspectRatio: spec.aspectRatio,
      prompt: spec.prompt,
      isUserSupplied: isUserFile,
      avif: {},
      webp: {},
      widths: TARGET_WIDTHS,
      fallback: `/assets/optimized/${spec.slug}-800.webp`,
    };

    // Generate AVIF & WebP at multiple widths
    for (const w of TARGET_WIDTHS) {
      // Calculate proportional height
      const targetHeight = Math.round((w / spec.width) * spec.height);

      // WebP
      const webpName = `${spec.slug}-${w}.webp`;
      const webpPath = path.join(OPTIMIZED_DIR, webpName);
      const webpBuffer = await sharp(sourceBuffer)
        .resize(w, targetHeight, { fit: 'cover' })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
      fs.writeFileSync(webpPath, webpBuffer);
      assetRecord.webp[w] = `/assets/optimized/${webpName}`;
      totalSizeOptimized += webpBuffer.length;

      // AVIF
      const avifName = `${spec.slug}-${w}.avif`;
      const avifPath = path.join(OPTIMIZED_DIR, avifName);
      const avifBuffer = await sharp(sourceBuffer)
        .resize(w, targetHeight, { fit: 'cover' })
        .avif({ quality: 72, effort: 4 })
        .toBuffer();
      fs.writeFileSync(avifPath, avifBuffer);
      assetRecord.avif[w] = `/assets/optimized/${avifName}`;
      totalSizeOptimized += avifBuffer.length;

      console.log(`  • Rendered ${w}w → WebP (${Math.round(webpBuffer.length / 1024)} KB) | AVIF (${Math.round(avifBuffer.length / 1024)} KB)`);
    }

    manifest.assets[spec.id] = assetRecord;
  }

  // Generate Hero Video Loop (MP4 & WebM) + Poster Frame
  console.log('\n▶ Processing [VIDEO-LOOP] Hero 4s Ambient Loop...');
  const heroImg1Path = path.join(OPTIMIZED_DIR, 'img-1-welcome-hero-800.webp');
  const posterPath = path.join(OPTIMIZED_DIR, 'hero-poster.webp');
  const mp4Path = path.join(OPTIMIZED_DIR, 'hero-loop.mp4');
  const webmPath = path.join(OPTIMIZED_DIR, 'hero-loop.webm');

  // Copy 800w webp as the poster frame
  fs.copyFileSync(heroImg1Path, posterPath);

  // Generate 4s seamless ambient drift video with ffmpeg
  try {
    console.log('  • Encoding 4-second seamless MP4 with ffmpeg...');
    // Create subtle zoompan effect over 4 seconds, 30fps
    execFileSync(
      ffmpegPath,
      [
        '-y',
        '-loop', '1',
        '-i', heroImg1Path,
        '-vf', 'zoompan=z=\'min(zoom+0.0006,1.06)\':d=120:x=\'iw/2-(iw/zoom/2)\':y=\'ih/2-(ih/zoom/2)\':s=800x1200',
        '-c:v', 'libx264',
        '-t', '4',
        '-pix_fmt', 'yuv420p',
        '-an',
        '-movflags', '+faststart',
        mp4Path,
      ],
      { stdio: 'pipe' }
    );

    console.log('  • Encoding WebM loop with ffmpeg...');
    execFileSync(
      ffmpegPath,
      [
        '-y',
        '-loop', '1',
        '-i', heroImg1Path,
        '-vf', 'zoompan=z=\'min(zoom+0.0006,1.06)\':d=120:x=\'iw/2-(iw/zoom/2)\':y=\'ih/2-(ih/zoom/2)\':s=800x1200',
        '-c:v', 'libvpx-vp9',
        '-crf', '34',
        '-b:v', '0',
        '-t', '4',
        '-an',
        webmPath,
      ],
      { stdio: 'pipe' }
    );

    const mp4Size = fs.statSync(mp4Path).size;
    const webmSize = fs.statSync(webmPath).size;
    totalSizeOptimized += mp4Size + webmSize;

    manifest.videoLoops['HERO_LOOP'] = {
      mp4: '/assets/optimized/hero-loop.mp4',
      webm: '/assets/optimized/hero-loop.webm',
      poster: '/assets/optimized/hero-poster.webp',
      durationSeconds: 4,
      mp4SizeBytes: mp4Size,
      webmSizeBytes: webmSize,
    };

    console.log(`  ✓ Hero Video Loop generated: MP4 (${Math.round(mp4Size / 1024)} KB) | WebM (${Math.round(webmSize / 1024)} KB)`);
  } catch (err) {
    console.warn('  ⚠️ Video generation note:', err.message);
    // If zoompan filter unavailable, create clean static video frame
    manifest.videoLoops['HERO_LOOP'] = {
      poster: '/assets/optimized/hero-poster.webp',
      fallback: '/assets/optimized/hero-poster.webp',
    };
  }

  // Performance budget measurements
  const heroAvifSize = fs.existsSync(path.join(OPTIMIZED_DIR, 'img-1-welcome-hero-800.avif'))
    ? fs.statSync(path.join(OPTIMIZED_DIR, 'img-1-welcome-hero-800.avif')).size
    : 0;

  manifest.actualMeasurements = {
    heroAvif800Kb: Math.round(heroAvifSize / 1024),
    heroMp4Kb: manifest.videoLoops['HERO_LOOP']?.mp4SizeBytes
      ? Math.round(manifest.videoLoops['HERO_LOOP'].mp4SizeBytes / 1024)
      : 0,
    totalOptimizedAssetsKb: Math.round(totalSizeOptimized / 1024),
  };

  // Write manifests
  const jsonContent = JSON.stringify(manifest, null, 2);
  fs.writeFileSync(MANIFEST_PATH, jsonContent, 'utf-8');
  fs.writeFileSync(SRC_MANIFEST_PATH, jsonContent, 'utf-8');

  console.log(`\n✓ Manifest written to ${MANIFEST_PATH}`);
  console.log(`✓ Synchronized to ${SRC_MANIFEST_PATH}`);
  console.log('\n' + '='.repeat(72));
  console.log(' MEASURED PERFORMANCE BUDGETS');
  console.log('='.repeat(72));
  console.log(`• Hero Image (800w AVIF): ${manifest.actualMeasurements.heroAvif800Kb} KB (Budget: ${manifest.performanceBudgets.heroImageMaxKb} KB)`);
  console.log(`• Hero Video (4s MP4):    ${manifest.actualMeasurements.heroMp4Kb} KB (Budget: ${manifest.performanceBudgets.heroVideoMaxKb} KB)`);
  console.log(`• Total Assets Built:     ${manifest.actualMeasurements.totalOptimizedAssetsKb} KB (Budget: ${manifest.performanceBudgets.totalAssetsMaxKb} KB)`);
  console.log('='.repeat(72));
}

runPipeline().catch((err) => {
  console.error('Fatal pipeline error:', err);
  process.exit(1);
});
