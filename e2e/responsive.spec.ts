import { test, expect } from '@playwright/test';

test.describe('Responsive Viewport (320px)', () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test('renders cleanly with zero horizontal overflow on small mobile screens', async ({ page }) => {
    await page.goto('/');

    // Check no horizontal scroll on attract screen
    const noOverflowOnAttract = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth;
    });
    expect(noOverflowOnAttract).toBe(true);

    // Tap attract
    await page.getByTestId('attract-root').click();
    await expect(page.getByTestId('select-root')).toBeVisible();

    // Check no horizontal scroll on setup screen
    const noOverflowOnSetup = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth;
    });
    expect(noOverflowOnSetup).toBe(true);

    // Continue to tier selection
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(page.getByText('How hard do you want this?')).toBeVisible();

    const noOverflowOnTiers = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth;
    });
    expect(noOverflowOnTiers).toBe(true);
  });
});
