import { test, expect } from '@playwright/test';

test.describe('Tara Mobile PWA & Language Experience', () => {
  test('renders mobile PWA simulator and navigates tabs', async ({ page }) => {
    await page.goto('http://localhost:5173/mobile');

    // 1. Verify PWA Mobile UI Header & Dynamic Island
    await expect(page.locator('text=Tara PWA Mobile UI Simulator')).toBeVisible();
    await expect(page.locator('text=Kumar Stores').first()).toBeVisible();

    // 2. Verify Today\'s UPI Collections card
    await expect(page.locator("text=Today's UPI Collections")).toBeVisible();
    await expect(page.locator('text=₹42,500.00')).toBeVisible();

    // 3. Navigate to Soundbox tab and verify controls
    await page.click('button:has-text("Soundbox")');
    await expect(page.locator('text=Demo Soundbox (Simulated)')).toBeVisible();
    await expect(page.locator('text=Trigger ₹420 Live Payment & Audio')).toBeVisible();

    // 4. Navigate to Transactions tab
    await page.click('button:has-text("Txns")');
    await expect(page.locator('text=Live Feed')).toBeVisible();
    await expect(page.locator('text=Vikram Singh')).toBeVisible();

    // 5. Navigate to Tara AI Chat tab and verify language selection
    await page.click('button:has-text("Tara AI")');
    await expect(page.locator('button:has-text("Total amount received today in bank?")')).toBeVisible();
  });
});
