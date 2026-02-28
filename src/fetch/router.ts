import { detectBlock } from '../detect/blocker.js';
import type { FetchResult, TierName } from './types.js';

const TIER_ORDER: TierName[] = ['direct', 'stealth', 'unlocker', 'browser'];

export interface RouterResult {
  success: boolean;
  result?: FetchResult;
  tiersAttempted: TierName[];
  lastBlockReason?: string;
}

type FetchFn = (url: string, options?: any) => Promise<FetchResult>;

interface RouterConfig {
  directFetch: FetchFn;
  stealthFetch?: FetchFn;
  unlockerFetch?: FetchFn;
  browserFetch?: FetchFn;
  maxAuto: TierName;
  domainOverrides?: Record<string, TierName>;
}

export function createRouter(config: RouterConfig) {
  const maxIndex = TIER_ORDER.indexOf(config.maxAuto);

  function getFetcher(tier: TierName): FetchFn | null {
    switch (tier) {
      case 'direct': return config.directFetch;
      case 'stealth': return config.stealthFetch ?? null;
      case 'unlocker': return config.unlockerFetch ?? null;
      case 'browser': return config.browserFetch ?? null;
    }
  }

  function getStartTier(url: string): number {
    if (config.domainOverrides) {
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      const override = config.domainOverrides[hostname];
      if (override) return TIER_ORDER.indexOf(override);
    }
    return 0;
  }

  async function fetch(url: string): Promise<RouterResult> {
    const tiersAttempted: TierName[] = [];
    let lastBlockReason: string | undefined;
    const startIndex = getStartTier(url);

    for (let i = startIndex; i <= maxIndex; i++) {
      const tier = TIER_ORDER[i];
      const fetcher = getFetcher(tier);
      if (!fetcher) continue;

      tiersAttempted.push(tier);

      try {
        const result = await fetcher(url);
        const block = detectBlock(result.status, result.html);

        if (!block.blocked) {
          return { success: true, result, tiersAttempted };
        }

        lastBlockReason = block.reason;

        // For direct tier at index 0, retry with browser headers before escalating
        if (tier === 'direct' && i === 0) {
          tiersAttempted.push('direct');
          const retryResult = await fetcher(url, { browserHeaders: true });
          const retryBlock = detectBlock(retryResult.status, retryResult.html);
          if (!retryBlock.blocked) {
            return { success: true, result: retryResult, tiersAttempted };
          }
          lastBlockReason = retryBlock.reason;
        }
      } catch {
        lastBlockReason = 'fetch_error';
      }
    }

    return { success: false, tiersAttempted, lastBlockReason };
  }

  return { fetch };
}
