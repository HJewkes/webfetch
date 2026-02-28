import { describe, expect, it, vi } from 'vitest';
import { type BrightDataConfig, unlockerFetch } from './brightdata.js';

// Mock undici to avoid real API calls in tests
vi.mock('undici', () => ({
  request: vi.fn().mockResolvedValue({
    statusCode: 200,
    headers: { 'content-type': 'text/html' },
    body: {
      text: () =>
        Promise.resolve(
          '<html><body><h1>Unblocked Content</h1><p>Real page content from Bright Data.</p></body></html>',
        ),
    },
  }),
}));

describe('unlockerFetch', () => {
  const config: BrightDataConfig = {
    token: 'test-token',
    zone: 'test_zone',
  };

  it('calls Bright Data API and returns FetchResult', async () => {
    const result = await unlockerFetch('https://blocked-site.com', { config });
    expect(result.status).toBe(200);
    expect(result.html).toContain('Unblocked Content');
    expect(result.tier).toBe('unlocker');
  });

  it('throws when no API token configured', async () => {
    await expect(
      unlockerFetch('https://example.com', { config: { token: null, zone: 'z' } }),
    ).rejects.toThrow('Bright Data API token not configured');
  });
});
