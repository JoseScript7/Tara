import { test, expect } from '@playwright/test';

test.describe('Tara v3: Welcome Screen (Nuvo Split Hero, Adapted)', () => {
  test('renders adapted nuvo split hero layout with 3 floating cards marked SAMPLE', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // Verify main landmarks
    const main = page.locator('main[aria-label="Welcome to Tara"]');
    await expect(main).toBeVisible();

    // Verify brand wordmark
    await expect(page.locator('.tara-welcome-brand')).toHaveText(/Tara/);

    // Verify 3-line headline
    const headline = page.locator('.tara-welcome-headline');
    await expect(headline).toContainText("Your shop's");
    await expect(headline).toContainText("problems, handled");
    await expect(headline).toContainText("before you ask");

    // Verify lede
    const lede = page.locator('.tara-welcome-lede');
    await expect(lede).toContainText('Tara watches your soundbox and settlements');

    // Verify Primary CTA
    const cta = page.locator('#tara-welcome-get-started-btn');
    await expect(cta).toBeVisible();
    await expect(cta).toContainText('Get started');

    // Verify Left panel corner text
    await expect(page.locator('.tara-welcome-corner-intro')).toHaveText("Hi, I'm");
    await expect(page.locator('.tara-welcome-corner-name')).toHaveText('Tara.');

    // Verify 3 floating cards and SAMPLE / DEMO badges
    const sampleBadges = page.locator('.tara-card-sample-badge');
    await expect(sampleBadges).toHaveCount(3);

    // Card 1: Coral settlement card
    const coralCard = page.locator('.tara-card-coral');
    await expect(coralCard).toContainText("Today's settlement");
    await expect(coralCard).toContainText('₹4,280');
    await expect(coralCard).toContainText('Settled');

    // Card 2: Glass card with 3 rows
    const glassCard = page.locator('.tara-card-glass');
    await expect(glassCard).toContainText('Soundbox back online');
    await expect(glassCard).toContainText('Settlement difference explained');
    await expect(glassCard).toContainText('Compensation proposed');

    // Card 3: Dark card
    const darkCard = page.locator('.tara-card-dark');
    await expect(darkCard).toContainText('Tara Teammate Active');

    // Truthful facts at bottom
    const facts = page.locator('.tara-welcome-fact-item');
    await expect(facts).toHaveCount(2);
    await expect(facts.first()).toContainText('Autonomous device recovery');
  });

  test('explainability drawer opens when clicking "See why"', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // Click "See why" in the frosted glass card
    await page.getByRole('button', { name: /See why/i }).click();

    // Verify explainability drawer appears
    const drawerTitle = page.locator('#drawer-title');
    await expect(drawerTitle).toHaveText('Why did Tara do this?');
    await expect(page.locator('text=Case #DEMO-701')).toBeVisible();
    await expect(page.locator('text=NPCI Soundbox Operational Guidelines §4.2')).toBeVisible();
    await expect(page.locator('text=Merchant Impact: Zero')).toBeVisible();

    // Close drawer
    await page.getByRole('button', { name: 'Close drawer' }).click();
    await expect(drawerTitle).not.toBeVisible();
  });

  test('multilingual language switcher translates content with upright Indic styling', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // Switch to Hindi (HI)
    await page.getByRole('button', { name: 'HI', exact: true }).click();
    await expect(page.locator('.tara-welcome-headline')).toContainText('आपकी दुकान की');
    await expect(page.locator('.tara-welcome-corner-intro')).toHaveText('नमस्ते, मैं हूँ');
    await expect(page.locator('.tara-welcome-corner-name')).toHaveText('तारा।');
    await expect(page.locator('#tara-welcome-get-started-btn')).toContainText('शुरू करें');

    // Verify no italics in Indic (upright accent class applied)
    const indicCornerSpan = page.locator('.tara-welcome-accent-indic');
    await expect(indicCornerSpan).toBeVisible();

    // Switch to Tamil (TA)
    await page.getByRole('button', { name: 'TA', exact: true }).click();
    await expect(page.locator('.tara-welcome-headline')).toContainText('உங்கள் கடையின்');
    await expect(page.locator('#tara-welcome-get-started-btn')).toContainText('தொடங்கவும்');

    // Switch to Bengali (BN)
    await page.getByRole('button', { name: 'BN', exact: true }).click();
    await expect(page.locator('.tara-welcome-headline')).toContainText('আপনার দোকানের');

    // Switch back to English (EN)
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page.locator('#tara-welcome-get-started-btn')).toContainText('Get started');
  });

  test('responsive at mobile 360px viewport: zero horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('http://localhost:5173/');

    // Check right column appears above left panel on mobile
    const rightBox = await page.locator('.tara-welcome-right').boundingBox();
    const leftBox = await page.locator('.tara-welcome-left').boundingBox();
    expect(rightBox).not.toBeNull();
    expect(leftBox).not.toBeNull();
    if (rightBox && leftBox) {
      expect(rightBox.y).toBeLessThan(leftBox.y);
    }

    // Zero horizontal scroll test in all 6 scripts
    const languages = ['EN', 'HI', 'TA', 'TE', 'BN', 'MR'];
    for (const lang of languages) {
      await page.getByRole('button', { name: lang, exact: true }).click();
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll, `Horizontal scroll detected on 360px viewport in ${lang}`).toBe(false);
    }
  });

  test('clicking Get Started advances to phone number entry', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    await page.locator('#tara-welcome-get-started-btn').click();

    // Verify step 1 appears with phone number input and Back button
    await expect(page.locator('text=Enter Mobile Number')).toBeVisible();
    await expect(page.locator('button', { hasText: 'Back' })).toBeVisible();

    // Click Back to return to WelcomeHero
    await page.locator('button', { hasText: 'Back' }).click();
    await expect(page.locator('.tara-welcome-headline')).toBeVisible();
  });
});
