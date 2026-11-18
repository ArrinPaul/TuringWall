import { test, expect } from '@playwright/test';

const KEYS = [
  'real-or-ai-wall:leaderboard:v2',
  'real-or-ai-wall:mastery:v2',
  'real-or-ai-wall:missed-questions:v2',
  'real-or-ai-wall:sessions:v1',
  'real-or-ai-wall:prefs:v1',
];

const GARBAGE = [
  '{bad json',
  '{"3":"x","5":[1,"two",null,{"score":"abc"}],"10":[{"name":{},"score":{}}]}',
  '[null,1,"x",{"status":"weird"}]',
];

test.describe('Resilience on the production build', () => {
  for (const garbage of GARBAGE) {
    test(`survives corrupt saved data: ${garbage.slice(0, 24)}`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on('pageerror', (e) => pageErrors.push(e.message));

      await page.addInitScript(
        ([keys, value]) => {
          for (const k of keys) localStorage.setItem(k, value);
        },
        [KEYS, garbage] as const
      );

      await page.goto('/');
      await expect(page.getByText(/real or ai\?/i).first()).toBeVisible();

      // The leaderboard / analysis page renders from the same corrupt data.
      await page.goto('/leaderboard');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      expect(pageErrors).toEqual([]);
    });
  }

  test.describe('with the item bank blocked', () => {
    // page.route cannot see requests made by the service worker, so disable it for this test.
    test.use({ serviceWorkers: 'block' });

    test('a failed question-bank chunk shows a retry message, not an endless spinner', async ({ page }) => {
    // Block the lazily loaded item bank, as a flaky network or a stale deploy would.
    await page.route('**/assets/items-*.js', (route) => route.abort());
    await page.goto('/');

    await page.getByTestId('attract-root').click();
    await page.getByRole('button', { name: /continue/i }).click();
    await page.getByRole('button', { name: /^Easy/ }).click();
    await page.getByTestId('rounds-3').click();

    await expect(page.getByTestId('load-error')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('loading-screen')).toHaveCount(0);
    });
  });

  test('idle reset applies only in kiosk mode (real time, both pages side by side)', async ({ browser, baseURL }) => {
    // Real time on purpose: Playwright's fake clock does not drive the app's idle timer.
    test.setTimeout(120_000);

    const startRound = async (page: import('@playwright/test').Page, url: string) => {
      await page.goto(url);
      await page.getByTestId('attract-root').click();
      await page.getByRole('button', { name: /continue/i }).click();
      await page.getByRole('button', { name: /^Easy/ }).click();
      await page.getByTestId('rounds-3').click();
      await expect(page.getByTestId('playing-root')).toBeVisible();
    };

    const kioskPage = await (await browser.newContext({ baseURL })).newPage();
    const visitorPage = await (await browser.newContext({ baseURL })).newPage();
    await Promise.all([startRound(kioskPage, '/?kiosk=1'), startRound(visitorPage, '/')]);

    // Wait past the 45 s idle window with no interaction on either page.
    await kioskPage.waitForTimeout(48_000);

    // Kiosk: back on the landing screen. Normal visitor: still mid-round.
    await expect(kioskPage.getByTestId('attract-root')).toBeVisible();
    await expect(visitorPage.getByTestId('playing-root')).toBeVisible();
  });
});
