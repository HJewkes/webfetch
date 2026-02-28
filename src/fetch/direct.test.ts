import { describe, it, expect } from 'vitest';
import { directFetch } from './direct.js';

describe('directFetch', () => {
  it('fetches a simple page successfully', async () => {
    const result = await directFetch('https://example.com');
    expect(result.status).toBe(200);
    expect(result.html).toContain('Example Domain');
    expect(result.tier).toBe('direct');
    expect(result.durationMs).toBeGreaterThan(0);
  });

  it('returns status code on non-200 responses', async () => {
    const result = await directFetch('https://httpbin.org/status/403');
    expect(result.status).toBe(403);
  });

  it('includes browser-like headers in tier 1 mode', async () => {
    const result = await directFetch('https://httpbin.org/headers', { browserHeaders: true });
    const body = JSON.parse(result.html);
    expect(body.headers['User-Agent']).toContain('Mozilla');
    expect(body.headers['Accept']).toBeDefined();
  });
});
