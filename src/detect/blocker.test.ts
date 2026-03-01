import { describe, expect, it } from 'vitest';
import { detectBlock } from './blocker.js';

describe('detectBlock', () => {
  it('returns not blocked for normal content', () => {
    const result = detectBlock(
      200,
      '<html><body><h1>Product Page</h1><p>Lots of real content here about a product with description and pricing information.</p></body></html>',
    );
    expect(result.blocked).toBe(false);
  });

  it('detects HTTP 403', () => {
    const result = detectBlock(403, '<html><body>Forbidden</body></html>');
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('http_403');
  });

  it('detects HTTP 429', () => {
    const result = detectBlock(429, '<html><body>Rate limited</body></html>');
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('http_429');
  });

  it('detects Cloudflare challenge', () => {
    const html =
      '<html><head><title>Just a moment...</title></head><body>Checking your browser</body></html>';
    const result = detectBlock(200, html);
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('cloudflare');
  });

  it('detects Akamai block', () => {
    const html = '<html><body><p>Access Denied</p><p>Reference #18.abc123</p></body></html>';
    const result = detectBlock(200, html);
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('akamai');
  });

  it('detects PerimeterX challenge', () => {
    const html =
      '<html><head><script src="/px/challenge"></script></head><body><div id="px-captcha"></div></body></html>';
    const result = detectBlock(200, html);
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('perimeterx');
  });

  it('detects empty or suspiciously short body', () => {
    const result = detectBlock(200, '<html><body></body></html>');
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('empty_body');
  });

  it('detects meta refresh challenge', () => {
    const html =
      '<html><head><meta http-equiv="refresh" content="0;url=/challenge?token=abc"></head><body></body></html>';
    const result = detectBlock(200, html);
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('meta_refresh_challenge');
  });

  it('does not flag meta refresh without challenge keyword', () => {
    const html =
      '<html><head><meta http-equiv="refresh" content="5;url=/home"></head><body><h1>Redirecting</h1><p>You will be redirected to the homepage shortly. Please wait while we process your request.</p></body></html>';
    const result = detectBlock(200, html);
    expect(result.blocked).toBe(false);
  });

  it('does not flag short but legitimate pages', () => {
    const result = detectBlock(
      200,
      '<html><body><h1>404 - Page Not Found</h1><p>The page you requested could not be found.</p></body></html>',
    );
    expect(result.blocked).toBe(false);
  });
});
