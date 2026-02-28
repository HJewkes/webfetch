import { existsSync, rmSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Cache } from './cache.js';

const TEST_DIR = '/tmp/webfetch-cache-test';

beforeEach(() => {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
});

describe('Cache', () => {
  it('stores and retrieves URL cache entries', () => {
    const cache = new Cache(TEST_DIR, 3600);
    cache.set('https://example.com', '/tmp/webfetch/example.com/page.md', 'direct');
    const entry = cache.get('https://example.com');
    expect(entry).not.toBeNull();
    expect(entry?.filePath).toBe('/tmp/webfetch/example.com/page.md');
    expect(entry?.tier).toBe('direct');
  });

  it('returns null for expired entries', () => {
    const cache = new Cache(TEST_DIR, 0); // 0 second TTL
    cache.set('https://example.com', '/tmp/file.md', 'direct');
    const entry = cache.get('https://example.com');
    expect(entry).toBeNull();
  });

  it('tracks domain tier preferences', () => {
    const cache = new Cache(TEST_DIR, 3600);
    cache.setDomainTier('potterybarn.com', 'stealth');
    expect(cache.getDomainTier('potterybarn.com')).toBe('stealth');
    expect(cache.getDomainTier('unknown.com')).toBeNull();
  });

  it('clears entries for a specific domain', () => {
    const cache = new Cache(TEST_DIR, 3600);
    cache.set('https://example.com/a', '/tmp/a.md', 'direct');
    cache.set('https://example.com/b', '/tmp/b.md', 'direct');
    cache.set('https://other.com/c', '/tmp/c.md', 'direct');
    cache.clearDomain('example.com');
    expect(cache.get('https://example.com/a')).toBeNull();
    expect(cache.get('https://other.com/c')).not.toBeNull();
  });

  it('lists all cached entries', () => {
    const cache = new Cache(TEST_DIR, 3600);
    cache.set('https://a.com/', '/tmp/a.md', 'direct');
    cache.set('https://b.com/', '/tmp/b.md', 'stealth');
    const entries = cache.list();
    expect(entries).toHaveLength(2);
  });

  it('persists to disk and reloads', () => {
    const cache1 = new Cache(TEST_DIR, 3600);
    cache1.set('https://example.com', '/tmp/file.md', 'direct');

    const cache2 = new Cache(TEST_DIR, 3600);
    const entry = cache2.get('https://example.com');
    expect(entry).not.toBeNull();
  });
});
