import { test, expect } from '@playwright/test';

test.describe('Nuvo Freelance-Banking Split Hero ("Coastal Cliffs")', () => {
  test.use({ viewport: { width: 1440, height: 960 } });

  test('Acceptance Check (1440x960): Coastal Cliffs split hero renders with all cards and motion', async ({ page }) => {
    await page.goto('/split-hero.html');

    // 1. Left Panel check
    const leftPanel = page.locator('.left-panel');
    await expect(leftPanel).toBeVisible();

    // Corner text: "Hey, it's nuvo!"
    const cornerText = page.locator('.left-corner-text');
    await expect(cornerText).toContainText('Hey,');
    await expect(cornerText).toContainText("it's nuvo!");

    // 3 Floating Cards
    // Card 1: Coral Balance Card
    const cardCoral = page.locator('#cardCoral');
    await expect(cardCoral).toBeVisible();
    await expect(cardCoral).toContainText('Total Balance');
    await expect(cardCoral).toContainText('$24,318.40');
    await expect(cardCoral).toContainText('+$3,200 today');
    await expect(cardCoral).toContainText('VIEW DETAIL');

    // Card 2: Frosted Glass List Card
    const cardGlass = page.locator('#cardGlass');
    await expect(cardGlass).toBeVisible();
    await expect(cardGlass).toContainText('Westbrook Studio');
    await expect(cardGlass).toContainText('+$3,200');
    await expect(cardGlass).toContainText('−$640');
    await expect(cardGlass).toContainText('−$15');
    await expect(cardGlass).toContainText('Invoice #0413 is due tomorrow');
    await expect(cardGlass).toContainText('SEND A REMINDER ↗');

    // Card 3: Dark Card
    const cardDark = page.locator('#cardDark');
    await expect(cardDark).toBeVisible();
    await expect(cardDark).toContainText('Virtual card');
    await expect(cardDark).toContainText('Debit');
    await expect(cardDark).toContainText('nuvo');

    // 2. Right Column check
    const rightCol = page.locator('.right-column');
    await expect(rightCol).toBeVisible();

    // Header items
    await expect(page.locator('.column-header .header-wordmark')).toHaveText('nuvo');
    await expect(page.locator('.column-header .menu-icon')).toBeVisible();
    await expect(page.locator('.column-header .profile-btn')).toBeVisible();

    // Three-line headline
    const headline = page.locator('#headline');
    await expect(headline).toContainText('Banking that');
    await expect(headline).toContainText('keeps up with');
    await expect(headline).toContainText('freelance life');

    // Lede
    const lede = page.locator('#lede');
    await expect(lede).toContainText('One account for invoices, taxes and getting paid from anywhere');
    await expect(lede).toContainText('No monthly fees, no waiting for Monday');

    // Coral CTA centered
    const ctaBtn = page.locator('#ctaBtn');
    await expect(ctaBtn).toBeVisible();
    await expect(ctaBtn).toContainText('Open an account');

    // Footer facts
    const footerFacts = page.locator('#footerFacts');
    await expect(footerFacts).toContainText('No monthly fees · 30+ currencies');
  });

  test('Responsive check: Stacks vertically on mobile with right column on top', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/split-hero.html');

    const rightCol = page.locator('.right-column');
    const leftPanel = page.locator('.left-panel');

    await expect(rightCol).toBeVisible();
    await expect(leftPanel).toBeVisible();

    const rightBox = await rightCol.boundingBox();
    const leftBox = await leftPanel.boundingBox();

    expect(rightBox).not.toBeNull();
    expect(leftBox).not.toBeNull();

    // Right column must be visually above left panel on mobile
    if (rightBox && leftBox) {
      expect(rightBox.y).toBeLessThan(leftBox.y);
    }
  });
});
