import { describe, it, expect, vi } from 'vitest';
import { directFetch } from './direct.js';

vi.mock('undici', () => {
  const mockRequest = vi.fn().mockImplementation(async (url: string, opts?: any) => {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname === 'example.com') {
      return {
        statusCode: 200,
        headers: { 'content-type': 'text/html' },
        body: { text: () => Promise.resolve('<html><body><h1>Example Domain</h1></body></html>') },
      };
    }

    if (parsedUrl.pathname === '/status/403') {
      return {
        statusCode: 403,
        headers: {},
        body: { text: () => Promise.resolve('Forbidden') },
      };
    }

    if (parsedUrl.pathname === '/headers') {
      const reqHeaders = opts?.headers ?? {};
      return {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: { text: () => Promise.resolve(JSON.stringify({ headers: reqHeaders })) },
      };
    }

    return {
      statusCode: 404,
      headers: {},
      body: { text: () => Promise.resolve('Not found') },
    };
  });

  return {
    request: mockRequest,
    interceptors: { redirect: () => () => {} },
    Agent: vi.fn().mockImplementation(() => ({ compose: () => ({}) })),
  };
});

describe('directFetch', () => {
  it('fetches a simple page successfully', async () => {
    const result = await directFetch('https://example.com');
    expect(result.status).toBe(200);
    expect(result.html).toContain('Example Domain');
    expect(result.tier).toBe('direct');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
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
