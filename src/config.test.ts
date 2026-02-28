import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadConfig } from './config.js';

describe('loadConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns defaults when no overrides', () => {
    const config = loadConfig({});
    expect(config.output.dir).toBe('/tmp/webfetch');
    expect(config.output.format).toBe('md');
    expect(config.tiers.maxAuto).toBe('unlocker');
    expect(config.cache.ttl).toBe(3600);
  });

  it('env vars override defaults', () => {
    vi.stubEnv('WEBFETCH_OUTPUT_DIR', '/custom/path');
    vi.stubEnv('BRIGHTDATA_API_TOKEN', 'test-token');
    const config = loadConfig({});
    expect(config.output.dir).toBe('/custom/path');
    expect(config.brightdata.token).toBe('test-token');
  });

  it('CLI flags override env vars', () => {
    vi.stubEnv('WEBFETCH_OUTPUT_DIR', '/env/path');
    const config = loadConfig({ output: '/cli/path' });
    expect(config.output.dir).toBe('/cli/path');
  });

  it('domain overrides are preserved', () => {
    const config = loadConfig(
      {},
      {
        tiers: { domainOverrides: { 'example.com': 'stealth' } },
      },
    );
    expect(config.tiers.domainOverrides['example.com']).toBe('stealth');
  });
});
