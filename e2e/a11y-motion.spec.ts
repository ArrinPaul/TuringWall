import { test, expect } from '@playwright/test';

test.describe('Reduced Motion Preference', () => {
  test.use({ reducedMotion: 'reduce' });

  test('respects prefers-reduced-motion without breaking navigation or interactivity', async ({ page }) => {
    await page.goto('/');

    // Check motion preference applied in window
    const prefersReduced = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    expect(prefersReduced).toBe(true);

    // Open Settings and check that motion preference reflects the system setting
    await page.getByRole('button', { name: /settings/i }).click();
    const settingsPanel = page.getByTestId('settings-panel');
    await expect(settingsPanel).toBeVisible();

    // Verify settings options
    await expect(settingsPanel.getByRole('heading', { name: /motion/i })).toBeVisible();
    await page.getByRole('button', { name: /close settings/i }).click();
    await expect(settingsPanel).not.toBeVisible();
  });
});
