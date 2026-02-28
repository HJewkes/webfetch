import { request, interceptors } from 'undici';
import { Agent } from 'undici';
import type { FetchResult } from './types.js';

const redirectAgent = new Agent().compose(interceptors.redirect({ maxRedirections: 5 }));

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

interface DirectFetchOptions {
  browserHeaders?: boolean;
  timeoutMs?: number;
}

export async function directFetch(
  url: string,
  options: DirectFetchOptions = {},
): Promise<FetchResult> {
  const { browserHeaders = false, timeoutMs = 15_000 } = options;
  const start = performance.now();

  const headers = browserHeaders ? BROWSER_HEADERS : { 'User-Agent': 'webfetch/0.1.0' };

  const { statusCode, headers: resHeaders, body } = await request(url, {
    headers,
    dispatcher: redirectAgent,
    headersTimeout: timeoutMs,
    bodyTimeout: timeoutMs,
  });

  const html = await body.text();
  const durationMs = Math.round(performance.now() - start);

  const flatHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(resHeaders)) {
    if (typeof value === 'string') flatHeaders[key] = value;
  }

  return {
    url,
    html,
    status: statusCode,
    tier: 'direct',
    durationMs,
    headers: flatHeaders,
  };
}
