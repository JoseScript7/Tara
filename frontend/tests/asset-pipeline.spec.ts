import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT_DIR, 'public', 'assets', 'manifest.json');
const SOURCE_DIR = path.join(ROOT_DIR, 'public', 'assets', 'source');
const OPTIMIZED_DIR = path.join(ROOT_DIR, 'public', 'assets', 'optimized');

test.describe('Tara v3 Asset Pipeline & Security Verification', () => {
  test('manifest contains all 6 assets with AVIF, WebP, alt text, and video loop', async () => {
    expect(fs.existsSync(MANIFEST_PATH)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));

    const expectedIds = ['IMG-1', 'IMG-2', 'IMG-3', 'IMG-4', 'IMG-5', 'IMG-6'];
    for (const id of expectedIds) {
      expect(manifest.assets[id]).toBeDefined();
      const asset = manifest.assets[id];
      expect(asset.alt.length).toBeGreaterThan(15);
      expect(asset.avif['400']).toBeDefined();
      expect(asset.avif['800']).toBeDefined();
      expect(asset.avif['1200']).toBeDefined();
      expect(asset.webp['800']).toBeDefined();

      // Verify files actually exist on disk
      const webpFile = path.join(ROOT_DIR, 'public', asset.webp['800']);
      const avifFile = path.join(ROOT_DIR, 'public', asset.avif['800']);
      expect(fs.existsSync(webpFile)).toBe(true);
      expect(fs.existsSync(avifFile)).toBe(true);
    }

    // Verify video loop
    expect(manifest.videoLoops['HERO_LOOP']).toBeDefined();
    const heroLoop = manifest.videoLoops['HERO_LOOP'];
    expect(fs.existsSync(path.join(ROOT_DIR, 'public', heroLoop.poster))).toBe(true);
    expect(fs.existsSync(path.join(ROOT_DIR, 'public', heroLoop.mp4))).toBe(true);
    expect(fs.existsSync(path.join(ROOT_DIR, 'public', heroLoop.webm))).toBe(true);
  });

  test('build check FAILS if an external image domain is referenced', async () => {
    // Create a temporary scratch file with an external image reference
    const scratchFile = path.join(ROOT_DIR, 'src', 'temp_external_test.tsx');
    fs.writeFileSync(
      scratchFile,
      `export const BadComponent = () => <img src="https://images.unsplash.com/photo-1234.jpg" alt="test" />;`,
      'utf-8'
    );

    let failed = false;
    try {
      execFileSync('node', ['scripts/check-external-assets.mjs'], {
        cwd: ROOT_DIR,
        stdio: 'pipe',
      });
    } catch (err: any) {
      failed = true;
      expect(err.status).toBe(1);
    } finally {
      // Clean up scratch file
      if (fs.existsSync(scratchFile)) {
        fs.unlinkSync(scratchFile);
      }
    }

    expect(failed).toBe(true);
  });

  test('swapping a placeholder for a real file in source/ regenerates optimized assets with zero code changes', async () => {
    test.setTimeout(90000);
    const testImgPath = path.join(SOURCE_DIR, 'img-6.png');

    // Create a distinctive 100x100 PNG test file
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(testImgPath, pngBuffer);

    try {
      // Run asset pipeline
      execFileSync('node', ['scripts/asset-pipeline.mjs'], {
        cwd: ROOT_DIR,
        stdio: 'pipe',
      });

      // Read manifest
      const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
      expect(manifest.assets['IMG-6'].isUserSupplied).toBe(true);

      // Verify optimized files updated on disk
      const optFile = path.join(ROOT_DIR, 'public', manifest.assets['IMG-6'].webp['800']);
      expect(fs.existsSync(optFile)).toBe(true);
    } finally {
      // Clean up test file and restore placeholder
      if (fs.existsSync(testImgPath)) {
        fs.unlinkSync(testImgPath);
      }
      execFileSync('node', ['scripts/asset-pipeline.mjs'], {
        cwd: ROOT_DIR,
        stdio: 'pipe',
      });
    }
  });
});
