import { test, expect } from '@playwright/test';

test.describe('Paytm Integration Architecture & API Guide', () => {
  test('renders Paytm Architecture page and switches tabs cleanly', async ({ page }) => {
    await page.goto('http://localhost:5173/integration');

    // 1. Verify Page Title & Rationale
    await expect(page.locator('text=Headless AI Add-on Layer for Existing Paytm Systems')).toBeVisible();
    await expect(page.locator('text=The Judge Question: "Why did you build a Web App when Paytm already has an App?"')).toBeVisible();

    // 2. Verify the 3 Pillars
    await expect(page.locator('text=Add-on Intelligence Layer, Not App Replacement')).toBeVisible();
    await expect(page.locator('text=Zero-Install Embedded WebView SDK')).toBeVisible();
    await expect(page.locator('text=Real-time Dual-Screen Verification Harness')).toBeVisible();

    // 3. Switch to Architecture tab
    await page.click('button:has-text("2. Paytm Add-on Architecture")');
    await expect(page.locator('text=How Tara Integrates with Existing Paytm Enterprise Infrastructure')).toBeVisible();
    await expect(page.locator('text=Paytm Soundbox Fleet (Dual-SIM 4G)')).toBeVisible();

    // 4. Switch to API Contracts tab
    await page.click('button:has-text("3. Headless API Contracts")');
    await expect(page.locator('text=Paytm Enterprise Integration API Suite')).toBeVisible();
    await expect(page.getByText('/api/tara/ask').first()).toBeVisible();

    // 5. Switch to Pilot Roadmap tab
    await page.click('button:has-text("4. Paytm Pilot Roadmap")');
    await expect(page.locator('text=Earned Autonomy: 6-Phase Production Rollout Plan')).toBeVisible();
    await expect(page.locator('text=Phase 0: Discovery & Taxonomy')).toBeVisible();
    await expect(page.locator('text=Phase 2: Shadow Mode (Read-Only Observation)')).toBeVisible();
    await expect(page.locator('text=Phase 4: Tier 1 Autonomous Diagnostics')).toBeVisible();
  });
});
