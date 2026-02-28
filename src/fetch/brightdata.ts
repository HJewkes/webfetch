import { request } from 'undici';
import { VERSION } from '../index.js';
import type { FetchResult } from './types.js';

export interface BrightDataConfig {
  token: string | null;
  zone: string;
}

interface UnlockerOptions {
  config: BrightDataConfig;
  timeoutMs?: number;
}

export async function unlockerFetch(url: string, options: UnlockerOptions): Promise<FetchResult> {
  const { config, timeoutMs = 30_000 } = options;

  if (!config.token) {
    throw new Error(
      'Bright Data API token not configured. Set BRIGHTDATA_API_TOKEN env var or add {"brightdata":{"token":"..."}} to .webfetchrc',
    );
  }

  const start = performance.now();

  const { statusCode, body } = await request('https://api.brightdata.com/request', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
      'User-Agent': `webfetch/${VERSION}`,
    },
    body: JSON.stringify({
      zone: config.zone,
      url,
      format: 'raw',
    }),
    headersTimeout: timeoutMs,
    bodyTimeout: timeoutMs,
  });

  const html = await body.text();
  const durationMs = Math.round(performance.now() - start);

  return {
    url,
    html,
    status: statusCode,
    tier: 'unlocker',
    durationMs,
    headers: {},
  };
}
