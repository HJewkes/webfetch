import { describe, expect, it } from 'vitest';
import { stealthFetch } from './patchright.js';

describe('stealthFetch', () => {
  it('fetches a page with full JS rendering', async () => {
    const result = await stealthFetch('https://example.com');
    expect(result.status).toBe(200);
    expect(result.html).toContain('Example Domain');
    expect(result.tier).toBe('stealth');
    expect(result.durationMs).toBeGreaterThan(0);
  }, 30_000);

  it('renders JS-dependent content', async () => {
    const result = await stealthFetch('https://httpbin.org/html');
    expect(result.status).toBe(200);
    expect(result.html.length).toBeGreaterThan(100);
  }, 30_000);
});
