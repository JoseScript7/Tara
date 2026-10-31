import { test, expect } from '@playwright/test';

test.describe('Clickable Elements Audit', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/?mode=onboarding');
    // Login Step 1: Mobile number
    await page.getByPlaceholder('Enter 10 digit number').fill('9876543210');
    await page.getByRole('button', { name: /Continue/ }).click();
    
    // Login Step 2: Select Demo Account
    await expect(page.getByText('Select Demo Account')).toBeVisible();
    await page.getByText('Rahul Sharma').click();
    
    // Login Step 3: OTP
    await expect(page.getByText('Verify OTP')).toBeVisible();
    // In demo mode, it shows the OTP in a banner, e.g. "your OTP is: 123456"
    const otpText = await page.locator('.tracking-widest').textContent();
    const otp = otpText?.trim() || '123456';
    
    // Fill the 6 individual inputs
    for (let i = 0; i < 6; i++) {
      const input = page.locator('input[type="text"]').nth(i);
      await input.focus();
      await page.keyboard.type(otp[i], { delay: 50 });
    }
    
    // Wait for Dashboard (increase timeout to 10s just in case)
    try {
      await expect(page.getByRole('heading', { name: "Today's Overview" })).toBeVisible({ timeout: 10000 });
    } catch (e) {
      await page.screenshot({ path: 'login-failure.png' });
      throw e;
    }
  });

  test('Global & Layout elements', async ({ page }) => {
    // Nav Links
    await page.getByRole('link', { name: 'Transactions' }).click();
    await expect(page).toHaveURL('/transactions');
    
    await page.getByRole('link', { name: 'Settlements' }).click();
    await expect(page).toHaveURL('/settlements');

    // Shield Icon
    await page.locator('button[title="Security & Trust Center"]').click();
    await expect(page).toHaveURL('/security');
    
    // Notifications Popover
    await page.locator('.lucide-bell').locator('..').click();
    await expect(page.getByText('Notifications')).toBeVisible();
    await page.locator('.lucide-bell').locator('..').click(); // close

    // Profile Popover
    await page.getByText('Kumar Stores').first().click();
    await expect(page.getByText('Log Out')).toBeVisible();

    // Verify Tara chat is open (desktop side panel)
    await expect(page.getByText(/Hi Rahul|Hi Kumar/).first()).toBeVisible();

    // Quick action chip
    await page.getByText('Resolve Disputes').first().click();
    // Close Tara (No close button on desktop, just skip)
    // await page.locator('.lucide-x').locator('..').click();lter({ hasText: '' }).nth(2).click(); // Approximate close button of Tara
  });

  test('Transactions Page elements', async ({ page }) => {
    await page.getByRole('link', { name: 'Transactions', exact: true }).first().click();
    
    // Search input
    await page.getByPlaceholder('Search by Order ID').fill('TXN-9934');

    // "CSV" Button
    // We won't actually download to avoid blocking, just click and check spinner
    const csvBtn = page.getByRole('button', { name: /CSV/ });
    await csvBtn.click();
    await expect(csvBtn.locator('.animate-spin')).toBeVisible();

    // Table Row click
    await expect(page.getByText('TXN-9934').first()).toBeVisible();
    await page.getByText('TXN-9934').first().click();
    
    // Drawer opens
    await expect(page.getByText('Transaction Timeline')).toBeVisible();
  });

  test('Settlements Page elements', async ({ page }) => {
    await page.getByRole('link', { name: 'Settlements', exact: true }).first().click();

    // Help Icon (MDR Deduction)
    const mdrBtn = page.locator('button[title="Why did my settlement change?"]').first();
    await mdrBtn.scrollIntoViewIfNeeded();
    await mdrBtn.click({ force: true });
  });

  test('Devices Page elements', async ({ page }) => {
    await page.getByRole('link', { name: 'Devices', exact: true }).first().click();

    // Request Additional Device
    await page.getByRole('button', { name: 'Request Additional Device' }).click();
    await expect(page).toHaveURL('/offers');

    await page.getByRole('link', { name: 'Devices', exact: true }).first().click();
    
    // Click "Report an Issue"
    await page.getByRole('button', { name: 'Report an Issue' }).first().click();
    await expect(page.getByText('Replacement Pending Approval')).toBeVisible();
  });

  test('Disputes Page elements', async ({ page }) => {
    await page.getByRole('link', { name: 'Disputes', exact: true }).first().click();

    // Expand accordion
    await page.getByText('DSP-8910').click(); // Expands DSP-8910 row
    await expect(page.getByText('Tara Reasoning Trace')).toBeVisible();

    // Approve Credit
    const approveBtn = page.getByRole('button', { name: /Approve Credit/ });
    await approveBtn.click();
    await expect(approveBtn.locator('.animate-spin')).toBeVisible();
    await expect(page.getByText('Resolved').first()).toBeVisible({ timeout: 5000 });

    // Reject Credit
    await page.getByRole('link', { name: 'Disputes', exact: true }).first().click();
    await page.getByText('DSP-8910').click(); 
    const rejectBtn = page.getByRole('button', { name: /Reject/ });
    if(await rejectBtn.isVisible()) {
      await rejectBtn.click();
      await expect(page.getByText('Compensation proposal rejected')).toBeVisible();
    }
  });

  test('Offers & Loans Page elements', async ({ page }) => {
    await page.getByRole('link', { name: 'Offers', exact: true }).first().click();

    // Why am I eligible?
    await page.getByRole('button', { name: 'Why am I eligible?' }).click();
    await expect(page.getByText(/Based on your.*GTV/)).toBeVisible();

    // Slider
    const slider = page.locator('input[type="range"]');
    await slider.fill('24'); // Change tenure to 24
    await expect(page.getByText('24 Months')).toBeVisible();

    // Apply Now
    await page.getByRole('button', { name: 'Apply Now' }).click();
    
    // Modal Flow
    await page.getByRole('button', { name: 'Proceed to E-Sign' }).click();
    await expect(page.getByText('Sign Agreement')).toBeVisible();
    
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole('button', { name: 'Submit Application' }).click();
    
    await expect(page.getByText('Loan Approved!')).toBeVisible();
    await page.getByRole('button', { name: 'Back to Dashboard' }).click();
  });

  test('Reports Page elements', async ({ page }) => {
    await page.getByRole('link', { name: 'Reports', exact: true }).first().click();

    // Generate AI Insight
    await page.getByRole('button', { name: 'Generate Insights' }).click();
    await expect(page.getByText(/I've analyzed your performance this month/)).toBeVisible();
  });

  test('Support Page elements', async ({ page }) => {
    await page.getByRole('link', { name: 'Merchant Support', exact: true }).first().click();

    // Category click
    await page.getByRole('button', { name: 'Settlements', exact: true }).click();
    await expect(page.getByText(/Why is there a 0.4% deduction on my settlement\?/)).toBeVisible();

    // FAQ Accordion click
    await page.getByText(/Why is there a 0.4% deduction on my settlement\?/).click();
    await expect(page.locator('.animate-in')).toBeVisible();

    // Chat with Tara
    await page.getByRole('button', { name: 'Chat with Tara' }).click();
  });

  test('Settings Page elements', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings', exact: true }).first().click();

    // Language Toggle
    await page.getByRole('button', { name: 'हिंदी (HI)' }).click();
    await expect(page.getByRole('button', { name: 'हिंदी (HI)' })).toHaveClass(/bg-paytm-blue\/10/);

    // Logout
    await page.getByRole('button', { name: 'Log Out' }).click();
    await expect(page.getByRole('button', { name: /Get started|Enter Merchant App/ })).toBeVisible();
  });

  test('Security & Trust Center elements', async ({ page }) => {
    await page.locator('button[title="Security & Trust Center"]').click();

    // Wait for load or header
    await expect(page.getByRole('heading', { name: /Security & Trust/i })).toBeVisible({ timeout: 10000 });

    // Trigger Test Case
    const triggerBtn = page.getByRole('button', { name: /Trigger Adversarial Test Case/ });
    if (await triggerBtn.isVisible()) {
      await triggerBtn.click();
      await expect(triggerBtn).toBeEnabled({ timeout: 5000 });
    }
  });

});
