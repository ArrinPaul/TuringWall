import { test, expect } from '@playwright/test';

test.describe('Full Playthrough', () => {
  test('completes a 3-question session from attract screen to final stats', async ({ page }) => {
    await page.goto('/');

    // 1. Attract screen
    await expect(page.getByText(/real or ai\?/i)).toBeVisible();
    await page.getByTestId('attract-root').click();

    // 2. Select wizard - Step 1: Name
    await expect(page.getByText("Who's playing?")).toBeVisible();
    const nameInput = page.locator('input[type="text"]');
    await nameInput.fill('PlaywrightPlayer');
    await page.getByRole('button', { name: /continue/i }).click();

    // Step 2: Difficulty Tier
    await expect(page.getByText('How hard do you want this?')).toBeVisible();
    await page.getByRole('button', { name: /^Easy/ }).click();

    // Step 3: Rounds Length
    await expect(page.getByText('How many questions?')).toBeVisible();
    await page.getByTestId('rounds-3').click();

    // 3. Play 3 rounds
    for (let round = 1; round <= 3; round++) {
      // In playing screen
      await expect(page.getByTestId('playing-root')).toBeVisible();
      await expect(page.getByText(new RegExp(`Round\\s+${round}\\s+/\\s+3`))).toBeVisible();

      // Pick Human
      await page.getByRole('button', { name: /Human-made/i }).click();

      // Submit inquiry
      await page.getByRole('button', { name: /Reveal Verdict/i }).click();

      // In revealed screen
      await expect(page.getByTestId('verdict')).toBeVisible();

      // Advance to next round or stats
      if (round < 3) {
        await page.getByRole('button', { name: /Next/i }).click();
      } else {
        await page.getByRole('button', { name: /Next/i }).click();
      }
    }

    // 4. Final Stats Screen
    await expect(page.getByTestId('stats-root')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Leaderboard & Analysis/i })).toBeVisible();
    await expect(page.getByText('PlaywrightPlayer').first()).toBeVisible();

    // Verify switching to Analysis view
    await page.getByRole('button', { name: /View Analysis/i }).click();
    await expect(page.getByText(/Your Session Results/i)).toBeVisible();
  });
});
