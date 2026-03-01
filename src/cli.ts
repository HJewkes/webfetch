#!/usr/bin/env node
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Command } from 'commander';
import { Cache } from './cache/cache.js';
import { loadConfig, type TierName } from './config.js';
import { extractJsonLd } from './extract/jsonld.js';
import { extractionPipeline } from './extract/pipeline.js';
import { unlockerFetch } from './fetch/brightdata.js';
import { directFetch } from './fetch/direct.js';
import { stealthFetch } from './fetch/patchright.js';
import { createRouter } from './fetch/router.js';
import { detectBlock } from './detect/blocker.js';
import { estimateTokens } from './extract/markdown.js';
import { VERSION } from './index.js';
import { buildOutputPath, writeOutput } from './output/writer.js';

const KNOWN_HARD_BLOCKS: Record<string, string> = {
  'allrecipes.com': 'Use "webfetch browse <url>" instead.',
};

const program = new Command();

program
  .name('webfetch')
  .description('Smart web fetching with tiered escalation and content extraction')
  .version(VERSION);

program
  .argument('[url]', 'URL to fetch')
  .option('--raw', 'Save raw HTML instead of extracted markdown')
  .option('--jsonld', 'Extract only JSON-LD structured data')
  .option('--output <dir>', 'Output directory')
  .option('--tier <tier>', 'Force a specific tier (direct|stealth|unlocker|browser)')
  .option('--no-cache', 'Skip cache lookup and do not update cache')
  .action(async (url: string | undefined, options) => {
    if (!url) {
      program.help();
      return;
    }

    const tier = options.tier as TierName | undefined;

    const config = loadConfig({
      output: options.output,
      tier,
    });

    const cache = new Cache(config.output.dir, config.cache.ttl);
    const useCache = options.cache !== false;

    // Check cache before fetching
    if (useCache) {
      const cached = cache.get(url);
      if (cached) {
        console.error(`Cache hit: ${cached.filePath} (tier: ${cached.tier})`);
        console.log(`Saved to ${cached.filePath} (cached)`);
        return;
      }
    }

    // Merge domain tier memory into overrides
    const domainOverrides = { ...config.tiers.domainOverrides };
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    const rememberedTier = cache.getDomainTier(hostname);
    if (rememberedTier && !domainOverrides[hostname]) {
      domainOverrides[hostname] = rememberedTier;
    }

    const router = createRouter({
      directFetch,
      stealthFetch,
      unlockerFetch: (fetchUrl) => unlockerFetch(fetchUrl, { config: config.brightdata }),
      maxAuto: tier ?? config.tiers.maxAuto,
      domainOverrides,
    });

    const hardBlock = KNOWN_HARD_BLOCKS[hostname];
    if (hardBlock) {
      console.error(`⚠ ${hostname} is a known hard block — all fetch tiers will fail.`);
      console.error(hardBlock);
    }

    console.error(`Fetching ${url}...`);
    const routerResult = await router.fetch(url);

    if (!routerResult.success || !routerResult.result) {
      console.error(`Failed to fetch ${url}`);
      console.error(`Tiers attempted: ${routerResult.tiersAttempted.join(' → ')}`);
      console.error(`Last block reason: ${routerResult.lastBlockReason ?? 'unknown'}`);
      process.exit(1);
    }

    const { result } = routerResult;
    console.error(`Fetched via tier: ${result.tier} (${result.durationMs}ms)`);

    if (options.raw) {
      const path = buildOutputPath(url, config.output.dir, 'html');
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, result.html, 'utf-8');
      if (useCache) {
        cache.set(url, path, result.tier);
        cache.setDomainTier(hostname, result.tier);
      }
      const rawTokens = estimateTokens(result.html);
      if (rawTokens < 50) {
        console.error(`⚠ Content appears thin (~${rawTokens} tokens). The site may be soft-blocking — consider using browse mode.`);
      }
      console.log(`Saved raw HTML to ${path}`);
      return;
    }

    if (options.jsonld) {
      const jsonld = extractJsonLd(result.html);
      if (!jsonld) {
        console.error('No JSON-LD structured data found on this page.');
        process.exit(1);
      }
      const path = buildOutputPath(url, config.output.dir, 'json');
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, JSON.stringify(jsonld, null, 2), 'utf-8');
      if (useCache) {
        cache.set(url, path, result.tier);
        cache.setDomainTier(hostname, result.tier);
      }
      console.log(`Saved JSON-LD to ${path}`);
      return;
    }

    const extraction = await extractionPipeline(result.html, url);
    const output = writeOutput({
      url,
      markdown: extraction.markdown,
      jsonld: extraction.jsonld,
      title: extraction.title,
      estimatedTokens: extraction.estimatedTokens,
      outputDir: config.output.dir,
    });

    if (useCache) {
      cache.set(url, output.mdPath, result.tier);
      cache.setDomainTier(hostname, result.tier);
    }

    if (extraction.estimatedTokens < 25) {
      console.error(`⚠ Content appears thin (~${extraction.estimatedTokens} tokens). The site may be soft-blocking — consider using browse mode.`);
    }

    console.log(output.summary);
    if (output.jsonldPath) {
      console.log(`JSON-LD also saved to ${output.jsonldPath}`);
    }
  });

program
  .command('extract <file>')
  .description('Re-run extraction on an already-fetched HTML file')
  .option('--format <format>', 'Output format (md|json|jsonld)', 'md')
  .action(async (file: string, options) => {
    const { readFileSync } = await import('node:fs');
    const html = readFileSync(file, 'utf-8');

    if (options.format === 'jsonld') {
      const jsonld = extractJsonLd(html);
      if (!jsonld) {
        console.error('No JSON-LD found.');
        process.exit(1);
      }
      console.log(JSON.stringify(jsonld, null, 2));
      return;
    }

    const extraction = await extractionPipeline(html, `file://${file}`);
    if (options.format === 'json') {
      console.log(JSON.stringify(extraction, null, 2));
    } else {
      console.log(extraction.markdown);
    }
  });

program
  .command('browse <url>')
  .description('Fetch a URL using Patchright stealth browser or Bright Data')
  .option('--brightdata', 'Use Bright Data Web Unlocker instead of local Patchright')
  .action(async (url: string, opts) => {
    const config = loadConfig({});

    if (opts.brightdata) {
      if (!config.brightdata.token) {
        console.error('Bright Data API token not configured.');
        console.error('Set BRIGHTDATA_API_TOKEN env var or add to .webfetchrc');
        process.exit(1);
      }
      console.error('Fetching via Bright Data Web Unlocker...');
      const result = await unlockerFetch(url, { config: config.brightdata });
      const block = detectBlock(result.status, result.html);
      if (block.blocked) {
        console.error(`Browse fetch was blocked: ${block.reason}`);
        console.error('The page returned a challenge/error page, not real content.');
        process.exit(1);
      }
      const extraction = await extractionPipeline(result.html, url);
      if (extraction.estimatedTokens < 25) {
        console.error(`⚠ Content appears thin (~${extraction.estimatedTokens} tokens). The site may be soft-blocking even with Bright Data.`);
      }
      const output = writeOutput({
        url,
        markdown: extraction.markdown,
        jsonld: extraction.jsonld,
        title: extraction.title,
        estimatedTokens: extraction.estimatedTokens,
        outputDir: config.output.dir,
      });
      console.log(output.summary);
    } else {
      console.error('Fetching via Patchright stealth browser...');
      const result = await stealthFetch(url);
      const block = detectBlock(result.status, result.html);
      if (block.blocked) {
        console.error(`Browse fetch was blocked: ${block.reason}`);
        console.error('The page returned a challenge/error page, not real content.');
        process.exit(1);
      }
      const extraction = await extractionPipeline(result.html, url);
      if (extraction.estimatedTokens < 25) {
        console.error(`⚠ Content appears thin (~${extraction.estimatedTokens} tokens). The site may be soft-blocking even with Patchright.`);
      }
      const output = writeOutput({
        url,
        markdown: extraction.markdown,
        jsonld: extraction.jsonld,
        title: extraction.title,
        estimatedTokens: extraction.estimatedTokens,
        outputDir: config.output.dir,
      });
      console.log(output.summary);
    }
  });

const cacheCmd = program.command('cache').description('Manage fetch cache');

cacheCmd
  .command('list')
  .description('List cached entries')
  .action(() => {
    const config = loadConfig({});
    const cache = new Cache(config.output.dir, config.cache.ttl);
    const entries = cache.list();
    if (entries.length === 0) {
      console.log('Cache is empty.');
      return;
    }
    for (const entry of entries) {
      const age = Math.round((Date.now() - entry.timestamp) / 1000);
      console.log(`${entry.url} → ${entry.filePath} (tier: ${entry.tier}, ${age}s ago)`);
    }
  });

cacheCmd
  .command('clear [domain]')
  .description('Clear cache entries (optionally for a specific domain)')
  .action((domain?: string) => {
    const config = loadConfig({});
    const cache = new Cache(config.output.dir, config.cache.ttl);
    if (domain) {
      cache.clearDomain(domain);
      console.log(`Cleared cache for ${domain}`);
    } else {
      rmSync(join(config.output.dir, 'cache.json'), { force: true });
      rmSync(join(config.output.dir, 'domains.json'), { force: true });
      console.log('Cache cleared.');
    }
  });

cacheCmd
  .command('stats')
  .description('Show cache statistics')
  .action(() => {
    const config = loadConfig({});
    const cache = new Cache(config.output.dir, config.cache.ttl);
    const stats = cache.stats();
    console.log(`Cached URLs: ${stats.totalEntries}`);
    console.log(`Known domains: ${stats.domains}`);
  });

program.parse();
