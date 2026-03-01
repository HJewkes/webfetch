import { describe, expect, it, vi } from 'vitest';
import { createRouter } from './router.js';
import type { FetchResult } from './types.js';

const okResult: FetchResult = {
  url: 'https://example.com',
  html: '<html><body><h1>Real Content</h1><p>This is a real page with substantial content that passes the block detection threshold easily.</p></body></html>',
  status: 200,
  tier: 'direct',
  durationMs: 50,
  headers: {},
};

const blockedResult: FetchResult = {
  url: 'https://example.com',
  html: '<html><head><title>Just a moment...</title></head><body></body></html>',
  status: 200,
  tier: 'direct',
  durationMs: 50,
  headers: {},
};

describe('createRouter', () => {
  it('returns on first successful fetch', async () => {
    const directFetch = vi.fn().mockResolvedValue(okResult);
    const router = createRouter({ directFetch, maxAuto: 'unlocker' });
    const result = await router.fetch('https://example.com');
    expect(result.success).toBe(true);
    expect(result.result?.tier).toBe('direct');
    expect(directFetch).toHaveBeenCalledTimes(1);
  });

  it('escalates from tier 0 to tier 1 on block', async () => {
    const directFetch = vi
      .fn()
      .mockResolvedValueOnce(blockedResult)
      .mockResolvedValueOnce(okResult);
    const router = createRouter({ directFetch, maxAuto: 'unlocker' });
    const result = await router.fetch('https://example.com');
    expect(result.success).toBe(true);
    expect(directFetch).toHaveBeenCalledTimes(2);
  });

  it('reports failure when all available tiers exhausted', async () => {
    const directFetch = vi.fn().mockResolvedValue(blockedResult);
    const router = createRouter({ directFetch, maxAuto: 'direct' });
    const result = await router.fetch('https://example.com');
    expect(result.success).toBe(false);
    expect(result.lastBlockReason).toBeDefined();
  });

  it('catches fetch errors and reports fetch_error', async () => {
    const directFetch = vi.fn().mockRejectedValue(new Error('network failure'));
    const router = createRouter({ directFetch, maxAuto: 'direct' });
    const result = await router.fetch('https://example.com');
    expect(result.success).toBe(false);
    expect(result.lastBlockReason).toBe('fetch_error');
    expect(result.tiersAttempted).toEqual(['direct']);
  });

  it('skips tiers with no fetcher configured', async () => {
    const directFetch = vi.fn().mockResolvedValue(blockedResult);
    const unlockerFetch = vi.fn().mockResolvedValue({ ...okResult, tier: 'unlocker' });
    const router = createRouter({
      directFetch,
      // stealthFetch intentionally omitted
      unlockerFetch,
      maxAuto: 'unlocker',
    });
    const result = await router.fetch('https://example.com');
    expect(result.success).toBe(true);
    expect(result.result?.tier).toBe('unlocker');
    // direct attempted twice (plain + browser headers), stealth skipped, unlocker succeeds
    expect(result.tiersAttempted).toEqual(['direct', 'direct', 'unlocker']);
    expect(unlockerFetch).toHaveBeenCalledTimes(1);
  });

  it('retries direct tier with browserHeaders before escalating', async () => {
    const directFetch = vi.fn().mockResolvedValue(blockedResult);
    const stealthFetch = vi.fn().mockResolvedValue({ ...okResult, tier: 'stealth' });
    const router = createRouter({ directFetch, stealthFetch, maxAuto: 'stealth' });
    const result = await router.fetch('https://example.com');
    expect(result.success).toBe(true);
    // First call: plain, second call: browserHeaders, then escalate to stealth
    expect(directFetch).toHaveBeenCalledTimes(2);
    expect(directFetch).toHaveBeenNthCalledWith(2, 'https://example.com', {
      browserHeaders: true,
    });
  });

  it('succeeds on direct retry with browserHeaders without escalating', async () => {
    const directFetch = vi
      .fn()
      .mockResolvedValueOnce(blockedResult)
      .mockResolvedValueOnce(okResult);
    const stealthFetch = vi.fn();
    const router = createRouter({ directFetch, stealthFetch, maxAuto: 'stealth' });
    const result = await router.fetch('https://example.com');
    expect(result.success).toBe(true);
    expect(stealthFetch).not.toHaveBeenCalled();
  });

  it('escalates past fetch error to next tier', async () => {
    const directFetch = vi.fn().mockRejectedValue(new Error('timeout'));
    const stealthFetch = vi.fn().mockResolvedValue({ ...okResult, tier: 'stealth' });
    const router = createRouter({ directFetch, stealthFetch, maxAuto: 'stealth' });
    const result = await router.fetch('https://example.com');
    expect(result.success).toBe(true);
    expect(result.result?.tier).toBe('stealth');
    expect(result.tiersAttempted).toEqual(['direct', 'stealth']);
  });

  it('respects domain overrides for starting tier', async () => {
    const stealthFetch = vi.fn().mockResolvedValue({ ...okResult, tier: 'stealth' });
    const router = createRouter({
      directFetch: vi.fn(),
      stealthFetch,
      maxAuto: 'unlocker',
      domainOverrides: { 'example.com': 'stealth' },
    });
    const result = await router.fetch('https://example.com');
    expect(result.success).toBe(true);
    expect(stealthFetch).toHaveBeenCalled();
  });
});
