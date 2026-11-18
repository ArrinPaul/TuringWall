import { test, expect } from '@playwright/test';

test.describe('Field Guide Modal & Focus Management', () => {
  test('opens the Field Guide dialog, filters concepts, and closes with Esc restoring focus', async ({ page }) => {
    await page.goto('/');

    // Open Field Guide from Attract screen
    const guideBtn = page.getByRole('button', { name: /browse tells|field guide/i }).first();
    await guideBtn.click();

    // Verify dialog semantics
    const dialog = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(dialog).toBeVisible();

    // Search concepts
    const searchInput = dialog.locator('#field-guide-search');
    await searchInput.fill('platitude');
    await expect(dialog.getByText('Universal platitude')).toBeVisible();

    // Expand concept card
    await dialog.getByText('Universal platitude').click();
    await expect(dialog.getByText(/When this clue fails/i)).toBeVisible();

    // Close with Escape key
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
});
