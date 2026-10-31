import { test, expect } from '@playwright/test';

test.describe('Tara v2 Invariant Tests - Single Source of Truth', () => {

  test.beforeEach(async ({ page }) => {
    page.on('pageerror', err => console.log('>>> UNCAUGHT PAGE ERROR:', err.message, err.stack));
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('>>> BROWSER CONSOLE ERROR:', msg.text());
    });
    await page.goto('/?mode=onboarding');
    
    // Login flow
    await page.getByPlaceholder('Enter 10 digit number').fill('9876543210');
    await page.getByRole('button', { name: /Continue/ }).click();
    
    await expect(page.getByText('Select Demo Account')).toBeVisible();
    await page.getByText('Rahul Sharma').click();
    
    await expect(page.getByText('Verify OTP')).toBeVisible();
    const otpText = await page.locator('.tracking-widest').textContent();
    const otp = otpText?.trim() || '123456';
    
    for (let i = 0; i < 6; i++) {
      const input = page.locator('input[type="text"]').nth(i);
      await input.focus();
      await page.keyboard.type(otp[i], { delay: 30 });
    }
    
    await expect(page.getByRole('heading', { name: "Today's Overview" })).toBeVisible({ timeout: 10000 });
  });

  test('Invariant 1: Device status consistency across Home, Room 3D, Devices, and Chat', async ({ page }) => {
    // 1. Home Page Verification
    await expect(page.getByText('1 Device Needs Attention').first()).toBeVisible();
    await expect(page.getByText(/Soundbox SB-4421 is offline/i).first()).toBeVisible();

    // 2. Chat Panel Verification
    // Chat panel is rendered alongside the main view
    const chatGreeting = page.locator('.bg-white-panel').filter({ hasText: /Attention needed: Your Soundbox/i }).first();
    await expect(chatGreeting).toBeVisible();
    // Must NEVER say "everything looks good"
    const chatText = await page.locator('main').locator('..').textContent();
    expect(chatText).not.toContain('everything looks good');

    // 3. Room 3D Verification
    await page.getByRole('link', { name: '3D Room' }).click();
    await expect(page).toHaveURL('/room');
    await expect(page.getByTestId('room-status-badge')).toBeVisible();
    await expect(page.getByTestId('room-status-badge')).toContainText('1 Device Needs Attention');
    await expect(page.getByText(/Soundbox SB-4421 is offline/i)).toBeVisible();
    // Soundbox chip in canvas must show Offline
    await expect(page.getByText(/Offline \(12%\)/i)).toBeVisible();

    // 4. Devices Page Verification
    await page.getByRole('link', { name: 'Devices', exact: true }).first().click();
    await expect(page).toHaveURL('/devices');
    // Soundbox card
    await expect(page.getByText('SB-4421').first()).toBeVisible();
    await expect(page.getByText('OFFLINE').first()).toBeVisible();
    await expect(page.getByText('12%').first()).toBeVisible();
  });

  test('Invariant 2: GTV single source of truth across Home, Reports, and Offers', async ({ page }) => {
    // 1. Home GTV
    const homeGtv = page.getByTestId('canonical-gtv');
    await expect(homeGtv).toContainText('₹4,82,500');

    // 2. Reports GTV
    await page.getByRole('link', { name: 'Reports', exact: true }).first().click();
    await expect(page).toHaveURL('/reports');
    await expect(page.getByText('₹4,82,500')).toBeVisible();

    // 3. Offers GTV reference
    await page.getByRole('link', { name: 'Offers', exact: true }).first().click();
    await expect(page).toHaveURL('/offers');
    // Governance banner must be displayed
    await expect(page.getByTestId('offers-governance-banner')).toBeVisible();
    await expect(page.getByText(/holding loan and upgrade offers/i)).toBeVisible();
  });

  test('Invariant 3: Reports dates are dynamic and relative to today', async ({ page }) => {
    await page.getByRole('link', { name: 'Reports', exact: true }).first().click();
    await expect(page).toHaveURL('/reports');

    // Check that stale September 2026 dates (e.g. "Sep 17") are NOT present in the trend labels
    const reportsContent = await page.locator('main').textContent();
    expect(reportsContent).not.toContain('Sep 17');
    expect(reportsContent).not.toContain('Sep 05');
  });

  test('Invariant 4: Tara greeting never falsely claims everything is good', async ({ page }) => {
    // Assert greeting contains warning and mentions SB-4421
    await expect(page.getByText(/SB-4421.*offline/i).first()).toBeVisible();
    await expect(page.getByText(/12% battery/i).first()).toBeVisible();
  });

});
