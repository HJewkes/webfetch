#!/usr/bin/env node
import { Command } from 'commander';
import { loadConfig, type TierName } from './config.js';
import { directFetch } from './fetch/direct.js';
import { createRouter } from './fetch/router.js';
import { extractionPipeline } from './extract/pipeline.js';
import { extractJsonLd } from './extract/jsonld.js';
import { writeOutput, buildOutputPath } from './output/writer.js';
import { VERSION } from './index.js';

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

    const router = createRouter({
      directFetch,
      maxAuto: tier ?? config.tiers.maxAuto,
      domainOverrides: config.tiers.domainOverrides,
    });

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
      const { writeFileSync, mkdirSync } = await import('node:fs');
      const { dirname } = await import('node:path');
      const path = buildOutputPath(url, config.output.dir, 'html');
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, result.html, 'utf-8');
      console.log(`Saved raw HTML to ${path}`);
      return;
    }

    if (options.jsonld) {
      const jsonld = extractJsonLd(result.html);
      if (!jsonld) {
        console.error('No JSON-LD structured data found on this page.');
        process.exit(1);
      }
      const { writeFileSync, mkdirSync } = await import('node:fs');
      const { dirname } = await import('node:path');
      const path = buildOutputPath(url, config.output.dir, 'json');
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, JSON.stringify(jsonld, null, 2), 'utf-8');
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

    const extraction = await extractionPipeline(html, 'file://' + file);
    if (options.format === 'json') {
      console.log(JSON.stringify(extraction, null, 2));
    } else {
      console.log(extraction.markdown);
    }
  });

program.parse();
