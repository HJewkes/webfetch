import { chromium } from 'patchright';
import type { FetchResult } from './types.js';

interface StealthFetchOptions {
  timeoutMs?: number;
  waitFor?: string;
}

export async function stealthFetch(
  url: string,
  options: StealthFetchOptions = {},
): Promise<FetchResult> {
  const { timeoutMs = 30_000, waitFor } = options;
  const start = performance.now();

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
    });
    const page = await context.newPage();

    const response = await page.goto(url, {
      timeout: timeoutMs,
      waitUntil: 'domcontentloaded',
    });

    if (waitFor) {
      await page.waitForSelector(waitFor, { timeout: timeoutMs });
    } else {
      // Give JS a moment to hydrate
      await page.waitForTimeout(2000);
    }

    const html = await page.content();
    const status = response?.status() ?? 0;
    const durationMs = Math.round(performance.now() - start);

    await context.close();

    return {
      url,
      html,
      status,
      tier: 'stealth',
      durationMs,
      headers: {},
    };
  } finally {
    await browser.close();
  }
}
