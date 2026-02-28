export type TierName = 'direct' | 'stealth' | 'unlocker' | 'browser';

export interface FetchResult {
  url: string;
  html: string;
  status: number;
  tier: TierName;
  durationMs: number;
  headers: Record<string, string>;
}

export interface Fetcher {
  name: TierName;
  fetch(url: string): Promise<FetchResult>;
}
