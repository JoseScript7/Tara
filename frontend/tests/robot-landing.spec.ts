import { test, expect } from '@playwright/test';

test.describe('Tara 3D Robot Landing Page', () => {
  test('loads single-file 3D robot landing page with Tara merchant branding and interactive elements', async ({ page }) => {
    // Collect console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    await page.goto('http://localhost:5173/robot-landing.html');

    // 1. Verify Canvas exists and has WebGL
    const canvas = page.locator('#c');
    await expect(canvas).toBeVisible();

    // 2. Verify fixed chrome
    const topBar = page.locator('#top-bar');
    await expect(topBar).toContainText('Tara 3.0 Is Live');

    const nav = page.locator('#nav');
    await expect(nav.locator('.logo-text')).toHaveText('TARA');
    await expect(nav.locator('.btn-launch')).toContainText('•• LAUNCH TARA');

    // 3. Verify 3 vertical grid lines
    await expect(page.locator('.grid-line.col-1')).toBeVisible();
    await expect(page.locator('.grid-line.col-2')).toBeVisible();
    await expect(page.locator('.grid-line.col-3')).toBeVisible();

    // 4. Verify Section 1: Intro elements
    const promptTab = page.locator('.prompt-tab');
    await expect(promptTab).toHaveText('“');
    await expect(page.locator('.prompt-card')).toBeVisible();
    await expect(page.locator('.intro-bottom-left')).toContainText('Store');
    await expect(page.locator('.intro-bottom-left')).toContainText('Intelligence');

    // Wait for typing to produce text
    await page.waitForTimeout(500);
    const typedText = await page.locator('#typed-prompt').textContent();
    expect(typedText?.length).toBeGreaterThan(0);

    // 5. Scroll to Section 2: Product
    await page.locator('#sec-product').scrollIntoViewIfNeeded();
    await expect(page.locator('.product-box')).toHaveText('Your Teammate');
    await expect(page.locator('.product-line-2')).toHaveText('For Indian Retail');

    // Verify Tab carousel exists
    const carouselTrack = page.locator('#tab-carousel-track');
    await expect(carouselTrack).toBeVisible();
    await expect(page.locator('.carousel-tab.active')).toBeVisible();

    // 6. Scroll to Section 3: Reviews
    await page.locator('#sec-reviews').scrollIntoViewIfNeeded();
    await expect(page.locator('#review-author')).toHaveText('Ramesh Gupta');
    await expect(page.locator('#review-quote-text')).toContainText('When my soundbox went silent');

    // Test review arrows
    await page.locator('#review-next').click();
    await page.waitForTimeout(550);
    await expect(page.locator('#review-author')).toHaveText('Sunita Patel');

    // 7. Verify no fatal console errors
    const fatalErrors = consoleErrors.filter(e => !e.includes('favicon'));
    expect(fatalErrors).toEqual([]);
  });
});
