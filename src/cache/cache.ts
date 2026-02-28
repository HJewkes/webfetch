import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { TierName } from '../fetch/types.js';

interface CacheEntry {
  url: string;
  filePath: string;
  tier: TierName;
  timestamp: number;
}

interface CacheData {
  entries: Record<string, CacheEntry>;
  domains: Record<string, TierName>;
}

export class Cache {
  private data: CacheData;
  private cacheFile: string;
  private domainsFile: string;

  constructor(
    private dir: string,
    private ttlSeconds: number,
  ) {
    this.cacheFile = join(dir, 'cache.json');
    this.domainsFile = join(dir, 'domains.json');
    this.data = this.load();
  }

  private load(): CacheData {
    const data: CacheData = { entries: {}, domains: {} };
    try {
      if (existsSync(this.cacheFile)) {
        const raw = JSON.parse(readFileSync(this.cacheFile, 'utf-8'));
        data.entries = raw.entries ?? {};
      }
    } catch {
      /* start fresh */
    }
    try {
      if (existsSync(this.domainsFile)) {
        data.domains = JSON.parse(readFileSync(this.domainsFile, 'utf-8'));
      }
    } catch {
      /* start fresh */
    }
    return data;
  }

  private save(): void {
    mkdirSync(this.dir, { recursive: true });
    writeFileSync(this.cacheFile, JSON.stringify({ entries: this.data.entries }, null, 2));
    writeFileSync(this.domainsFile, JSON.stringify(this.data.domains, null, 2));
  }

  get(url: string): { filePath: string; tier: TierName } | null {
    const entry = this.data.entries[url];
    if (!entry) return null;
    const age = (Date.now() - entry.timestamp) / 1000;
    if (age >= this.ttlSeconds) {
      delete this.data.entries[url];
      this.save();
      return null;
    }
    return { filePath: entry.filePath, tier: entry.tier };
  }

  set(url: string, filePath: string, tier: TierName): void {
    this.data.entries[url] = { url, filePath, tier, timestamp: Date.now() };
    this.save();
  }

  getDomainTier(domain: string): TierName | null {
    return this.data.domains[domain] ?? null;
  }

  setDomainTier(domain: string, tier: TierName): void {
    this.data.domains[domain] = tier;
    this.save();
  }

  clearDomain(domain: string): void {
    for (const [url, entry] of Object.entries(this.data.entries)) {
      try {
        const hostname = new URL(entry.url).hostname.replace(/^www\./, '');
        if (hostname === domain) delete this.data.entries[url];
      } catch {
        /* skip bad URLs */
      }
    }
    delete this.data.domains[domain];
    this.save();
  }

  list(): CacheEntry[] {
    return Object.values(this.data.entries);
  }

  stats(): { totalEntries: number; domains: number } {
    return {
      totalEntries: Object.keys(this.data.entries).length,
      domains: Object.keys(this.data.domains).length,
    };
  }
}
