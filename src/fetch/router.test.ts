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
