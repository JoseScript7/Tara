import { test, expect } from '@playwright/test';

test.describe('Tara v3 Design System & Style Guide (/design)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/design');
    await expect(page.locator('h1')).toContainText('Tara Design System');
  });

  test('renders accurately in all 5 Indian scripts plus English', async ({ page }) => {
    // English default
    await expect(page.locator('h2')).toContainText("Your shop’s problems, handled before you ask");
    const enAccent = page.locator('.accent-latin');
    await expect(enAccent).toBeVisible();

    // Hindi (Devanagari)
    await page.getByRole('button', { name: 'HI', exact: true }).click();
    await expect(page.locator('h2')).toContainText('आपकी दुकान की समस्याएं, पूछने से पहले हल');
    await expect(page.locator('.accent-indic')).toBeVisible();
    await expect(page.locator('.accent-indic')).toContainText('तारा');

    // Tamil
    await page.getByRole('button', { name: 'TA', exact: true }).click();
    await expect(page.locator('h2')).toContainText('உங்கள் கடையின் பிரச்சனைகள்');
    await expect(page.locator('.accent-indic')).toContainText('தாரா');

    // Telugu
    await page.getByRole('button', { name: 'TE', exact: true }).click();
    await expect(page.locator('h2')).toContainText('మీ దుకాణం సమస్యలు');
    await expect(page.locator('.accent-indic')).toContainText('తారా');

    // Bengali
    await page.getByRole('button', { name: 'BN', exact: true }).click();
    await expect(page.locator('h2')).toContainText('আপনার দোকানের সমস্যা');
    await expect(page.locator('.accent-indic')).toContainText('তারা');

    // Marathi (Devanagari)
    await page.getByRole('button', { name: 'MR', exact: true }).click();
    await expect(page.locator('h2')).toContainText('तुमच्या दुकानातील समस्या');
    await expect(page.locator('.accent-indic')).toContainText('तारा');
  });

  test('verifies semantic status badges pairing color, icon, and text', async ({ page }) => {
    await expect(page.locator('.tara-status-ok').filter({ hasText: 'Soundbox Online' })).toBeVisible();
    await expect(page.locator('.tara-status-warning').filter({ hasText: 'Low Battery (12%)' })).toBeVisible();
    await expect(page.locator('.tara-status-error').filter({ hasText: 'Soundbox Offline' })).toBeVisible();
    await expect(page.locator('.tara-status-info').filter({ hasText: 'Verifying Telemetry' })).toBeVisible();
    await expect(page.locator('.tara-status-pending-ops').filter({ hasText: 'Pending Ops Approval' })).toBeVisible();
    await expect(page.locator('.tara-status-stale').filter({ hasText: 'Stale / Unknown (7h)' })).toBeVisible();
  });

  test('interacts with Avatar mascot states, OTP inputs, and drawer', async ({ page }) => {
    // Check avatar
    const avatar = page.locator('.tara-avatar').first();
    await expect(avatar).toBeVisible();

    // Change mascot state
    await page.getByRole('button', { name: 'listening', exact: true }).click();
    await expect(page.locator('.tara-avatar-listening').first()).toBeVisible();

    // Fill OTP
    const firstDigit = page.getByRole('textbox', { name: 'Digit 1 of 6' });
    await firstDigit.fill('1');
    const secondDigit = page.getByRole('textbox', { name: 'Digit 2 of 6' });
    await secondDigit.fill('2');
    await expect(page.locator('text=Current OTP: 12')).toBeVisible();

    // Trigger Toast
    await page.getByRole('button', { name: 'Success', exact: true }).click();
    await expect(page.locator('.tara-toast')).toContainText('SUCCESS Notification');

    // Open Explainability Drawer
    await page.getByRole('button', { name: 'Open Explainability Drawer' }).click();
    await expect(page.locator('#drawer-title')).toContainText('Why did Tara take this action?');
    await expect(page.locator('text=DECISION VERIFIED BY POLICY ENGINE')).toBeVisible();

    // Close Drawer via Understood button
    await page.getByRole('button', { name: 'Understood' }).click();
    await expect(page.locator('#drawer-title')).not.toBeVisible();
  });

  test('survives 200% text zoom and 360px mobile viewport without horizontal scroll', async ({ page }) => {
    // Set mobile viewport 360px width
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/design');

    // Simulate 200% text zoom by increasing root font-size to 32px (default is 16px)
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '32px';
    });

    // Verify no page-level horizontal overflow occurs (scrollWidth <= clientWidth + margin)
    const overflowDiff = await page.evaluate(() => {
      return Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);
    });

    expect(overflowDiff).toBeLessThanOrEqual(5);

    // Verify headline is still legible and visible
    await expect(page.locator('h1')).toBeVisible();
  });
});
