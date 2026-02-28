import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { TierName } from './fetch/types.js';

export type { TierName };

export interface WebfetchConfig {
  output: {
    dir: string;
    format: 'md' | 'json' | 'html';
  };
  brightdata: {
    token: string | null;
    zone: string;
  };
  tiers: {
    maxAuto: TierName;
    domainOverrides: Record<string, TierName>;
  };
  cache: {
    ttl: number;
  };
}

export const DEFAULT_CONFIG: WebfetchConfig = {
  output: { dir: '/tmp/webfetch', format: 'md' },
  brightdata: { token: null, zone: 'mcp_unlocker' },
  tiers: { maxAuto: 'unlocker', domainOverrides: {} },
  cache: { ttl: 3600 },
};

function loadRcFile(): Partial<WebfetchConfig> {
  const paths = [
    join(process.cwd(), '.webfetchrc'),
    join(homedir(), '.webfetchrc'),
  ];
  for (const p of paths) {
    try {
      return JSON.parse(readFileSync(p, 'utf-8'));
    } catch {
      continue;
    }
  }
  return {};
}

function loadEnvVars(): Partial<WebfetchConfig> {
  const partial: Partial<WebfetchConfig> = {};
  if (process.env.WEBFETCH_OUTPUT_DIR) {
    partial.output = { ...DEFAULT_CONFIG.output, dir: process.env.WEBFETCH_OUTPUT_DIR };
  }
  if (process.env.BRIGHTDATA_API_TOKEN) {
    partial.brightdata = { ...DEFAULT_CONFIG.brightdata, token: process.env.BRIGHTDATA_API_TOKEN };
  }
  return partial;
}

function deepMerge<T extends object>(target: T, ...sources: Partial<T>[]): T {
  const result = { ...target };
  for (const source of sources) {
    for (const key of Object.keys(source) as (keyof T)[]) {
      const val = source[key];
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        result[key] = deepMerge(
          (result[key] as Record<string, unknown>) ?? {},
          val as Record<string, unknown>,
        ) as T[keyof T];
      } else if (val !== undefined) {
        result[key] = val as T[keyof T];
      }
    }
  }
  return result;
}

export function loadConfig(
  cliFlags: { output?: string; tier?: TierName },
  rcOverride?: Partial<WebfetchConfig>,
): WebfetchConfig {
  const rc = rcOverride ?? loadRcFile();
  const env = loadEnvVars();

  const cliPartial: Partial<WebfetchConfig> = {};
  if (cliFlags.output) {
    cliPartial.output = { ...DEFAULT_CONFIG.output, dir: cliFlags.output };
  }
  if (cliFlags.tier) {
    cliPartial.tiers = { ...DEFAULT_CONFIG.tiers, maxAuto: cliFlags.tier };
  }

  return deepMerge(DEFAULT_CONFIG, rc, env, cliPartial);
}
