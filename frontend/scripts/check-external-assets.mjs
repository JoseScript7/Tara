/**
 * Tara v3 External Asset & Alt Text Linter
 * Fails the build (exit code 1) if:
 * 1. Any image, video, audio, or media asset is referenced from an external domain
 * 2. Any <img> element has missing or empty alt text without explicit decorative flag
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '..', 'src');
const INDEX_HTML = path.resolve(__dirname, '..', 'index.html');

// Allowed external origins (only official web font stylesheet preconnect)
const ALLOWED_EXTERNAL_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// Disallowed asset extensions from external URLs
const MEDIA_EXTENSIONS = /\.(png|jpe?g|webp|avif|gif|svg|mp4|webm|ogg|glb|gltf|woff2?|ttf|otf)(\?.*)?$/i;

let violations = 0;
const auditedFiles = [];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relPath = path.relative(path.resolve(__dirname, '..'), filePath);
  auditedFiles.push(relPath);

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // 1. Check for external URLs in src, href (media), or css url()
    const urlMatches = line.matchAll(/https?:\/\/([^\s"'`\)]+)/gi);
    for (const match of urlMatches) {
      const fullUrl = match[0];
      const host = match[1].split('/')[0].split(':')[0].toLowerCase();

      // Check if it's an external media/asset link or unapproved CDN
      const isMedia = MEDIA_EXTENSIONS.test(fullUrl) || line.includes('<img') || line.includes('<video');
      const isAllowed = ALLOWED_EXTERNAL_HOSTS.includes(host);

      if (isMedia && !isAllowed) {
        console.error(`❌ EXTERNAL ASSET VIOLATION:`);
        console.error(`   File: ${relPath}:${lineNum}`);
        console.error(`   Url:  ${fullUrl}`);
        console.error(`   Rule: All assets must be self-hosted under assets/.\n`);
        violations++;
      }
    }
  });

  // 2. Check for <img> tags across full content for multiline tag support
  const imgMatches = content.matchAll(/<img\s+([^>]*?)(\/?>)/gis);
  for (const match of imgMatches) {
    const attrs = match[1];
    const hasAlt = /alt\s*=\s*["'{]/i.test(attrs);
    const isAriaHidden = /aria-hidden\s*=\s*["']?true["']?/i.test(attrs);
    const isPresentation = /role\s*=\s*["']presentation["']/i.test(attrs);

    if (!hasAlt && !isAriaHidden && !isPresentation) {
      console.error(`❌ MISSING ALT TEXT VIOLATION:`);
      console.error(`   File: ${relPath}`);
      console.error(`   Code: <img ${attrs.slice(0, 60)}...`);
      console.error(`   Rule: Every <img> element must specify an alt attribute.\n`);
      violations++;
    }
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist') {
        walkDir(fullPath);
      }
    } else if (entry.isFile() && /\.(tsx?|jsx?|html|css)$/i.test(entry.name)) {
      checkFile(fullPath);
    }
  }
}

console.log('='.repeat(72));
console.log(' TARA v3 ASSET SECURITY & ACCESSIBILITY AUDIT: EXTERNAL ASSET CHECK');
console.log('='.repeat(72));

walkDir(SRC_DIR);
if (fs.existsSync(INDEX_HTML)) {
  checkFile(INDEX_HTML);
}

console.log(`Audited ${auditedFiles.length} files across frontend.`);

if (violations > 0) {
  console.error(`\n❌ BUILD FAILED: Found ${violations} asset policy violation(s).`);
  process.exit(1);
} else {
  console.log(`\n✅ ALL ASSETS SELF-HOSTED. No external CDN media or missing alt text found.`);
  process.exit(0);
}
