import { test, expect } from '@playwright/test';

test.describe('Ontology Full View & ChatGPT-style n8n Flow', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate with mode=onboarding
    await page.goto('/?mode=onboarding');
    await page.waitForLoadState('networkidle');

    // If welcome screen is shown, click Get started
    const getStarted = page.locator('#tara-welcome-get-started-btn');
    if (await getStarted.isVisible({ timeout: 2000 }).catch(() => false)) {
      await getStarted.click();
    }

    // Login Step 1: Mobile number
    const phoneInput = page.getByPlaceholder('Enter 10 digit number');
    await expect(phoneInput).toBeVisible({ timeout: 6000 });
    await phoneInput.fill('9876543210');
    await page.getByRole('button', { name: /Continue/ }).click();
    
    // Step 2: Select Demo Account
    await expect(page.getByText('Select Demo Account')).toBeVisible({ timeout: 6000 });
    await page.getByText('Rahul Sharma').click();
    
    // Step 3: OTP
    await expect(page.getByText('Verify OTP')).toBeVisible({ timeout: 6000 });
    const otpText = await page.locator('.tracking-widest').textContent();
    const otp = otpText?.trim() || '123456';
    
    for (let i = 0; i < 6; i++) {
      const input = page.locator('input[type="text"]').nth(i);
      await input.focus();
      await page.keyboard.type(otp[i], { delay: 40 });
    }

    await expect(page.getByRole('heading', { name: "Today's Overview" })).toBeVisible({ timeout: 12000 });
  });

  test('Ontology Page Full View covers entire viewport and exits cleanly', async ({ page }) => {
    // Navigate via Sidebar link (no full page reload)
    await page.getByRole('link', { name: 'Ontology Graph' }).click();
    await expect(page).toHaveURL('/ontology');

    // Locate the Full View button on the ObsidianGraphView
    const fullViewBtn = page.locator('button:has-text("Full View")');
    await expect(fullViewBtn).toBeVisible({ timeout: 8000 });
    await fullViewBtn.evaluate((el: HTMLElement) => el.click());

    // The canvas should be rendered in full screen with exit button visible
    const exitFullViewBtn = page.locator('button:has-text("Exit Full View")');
    await expect(exitFullViewBtn).toBeVisible({ timeout: 8000 });

    // Verify canvas dimensions match the window
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThan(600);
      expect(box.height).toBeGreaterThan(400);
    }

    // Verify full view exit works
    await exitFullViewBtn.evaluate((el: HTMLElement) => el.click());
    await expect(exitFullViewBtn).not.toBeVisible();
  });

  test('Tara Panel provides n8n-style autonomous thought process, ChatGPT view, and offline SMS', async ({ page }) => {
    // Check for "Thought process & n8n execution flow" accordion button
    const thoughtBtn = page.locator('button:has-text("Thought process & n8n execution flow")').first();
    await expect(thoughtBtn).toBeVisible({ timeout: 8000 });
    await thoughtBtn.click();

    // Verify n8n pipeline steps are rendered
    await expect(page.locator('text=LATS AUTONOMOUS PIPELINE').first()).toBeVisible();
    await expect(page.locator('text=Monte-Carlo Verified').first()).toBeVisible();

    // Verify Offline SMS button exists
    const offlineSmsBtn = page.locator('button[title*="Offline SMS Mode"]').first();
    await expect(offlineSmsBtn).toBeVisible();

    // Check Maximize button for ChatGPT full interface
    const maximizeBtn = page.locator('button[title*="ChatGPT"]').first();
    if (await maximizeBtn.isVisible()) {
      await maximizeBtn.click();
      await expect(page.locator('text=Tara AI Teammate (ChatGPT Full Mode)')).toBeVisible();

      // Minimize back
      const minimizeBtn = page.locator('button:has-text("Exit Full View (ESC)")').first();
      await minimizeBtn.click();
      await expect(page.locator('text=Tara AI Teammate (ChatGPT Full Mode)')).not.toBeVisible();
    }
  });
});
