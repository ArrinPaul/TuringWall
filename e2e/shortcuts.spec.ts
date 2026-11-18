import { test, expect } from '@playwright/test';

test.describe('Kiosk Keyboard Shortcuts', () => {
  test('navigates, guesses, and reveals using only the keyboard', async ({ page }) => {
    await page.goto('/');

    // Start with click on attract
    await page.getByTestId('attract-root').click();

    // Name step: press Enter to continue
    await expect(page.getByText("Who's playing?")).toBeVisible();
    await page.keyboard.press('Enter');

    // Tier step: click Easy
    await expect(page.getByText('How hard do you want this?')).toBeVisible();
    await page.getByRole('button', { name: /^Easy/ }).click();

    // Length step: select 3 questions
    await expect(page.getByText('How many questions?')).toBeVisible();
    await page.getByTestId('rounds-3').click();

    // In playing screen
    await expect(page.getByTestId('playing-root')).toBeVisible();

    // Press 'H' to select Human
    await page.keyboard.press('h');
    await expect(page.getByText('Your call:')).toBeVisible();
    await expect(page.getByText('Human-made')).toBeVisible();

    // Press '3' to select High confidence
    await page.keyboard.press('3');
    await expect(page.locator('button:has-text("high")')).toHaveClass(/bg-signal/);

    // Press Enter to reveal
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('verdict')).toBeVisible();

    // Toggle bookmark with 'B'
    const saveBtn = page.getByRole('button', { name: /save/i });
    const initialSaveText = await saveBtn.innerText();
    await page.keyboard.press('b');
    const toggledSaveText = await saveBtn.innerText();
    expect(toggledSaveText).not.toBe(initialSaveText);

    // Toggle mute with 'M'
    const muteBtn = page.getByRole('button', { name: /sound/i });
    const initialText = await muteBtn.innerText();
    await page.keyboard.press('m');
    const toggledText = await muteBtn.innerText();
    expect(toggledText).not.toBe(initialText);
  });
});
