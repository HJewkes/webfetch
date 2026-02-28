import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';

export function slugify(urlPath: string): string {
  const cleaned = urlPath
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
  if (!cleaned) return 'index';
  return cleaned.slice(0, 80);
}

function shortHash(url: string): string {
  return createHash('md5').update(url).digest('hex').slice(0, 6);
}

export function buildOutputPath(url: string, outputDir: string, ext: string): string {
  const parsed = new URL(url);
  const domain = parsed.hostname.replace(/^www\./, '');
  const slug = slugify(parsed.pathname);
  const hash = shortHash(url);
  const filename = `${slug}-${hash}.${ext}`;
  return join(outputDir, domain, filename);
}

interface WriteInput {
  url: string;
  markdown: string;
  jsonld: Record<string, any> | null;
  title: string;
  estimatedTokens: number;
  outputDir: string;
}

interface WriteResult {
  mdPath: string;
  jsonldPath: string | null;
  summary: string;
}

export function writeOutput(input: WriteInput): WriteResult {
  const mdPath = buildOutputPath(input.url, input.outputDir, 'md');
  mkdirSync(dirname(mdPath), { recursive: true });
  writeFileSync(mdPath, input.markdown, 'utf-8');

  let jsonldPath: string | null = null;
  if (input.jsonld) {
    jsonldPath = buildOutputPath(input.url, input.outputDir, 'json');
    writeFileSync(jsonldPath, JSON.stringify(input.jsonld, null, 2), 'utf-8');
  }

  const sizeKB = (Buffer.byteLength(input.markdown, 'utf-8') / 1024).toFixed(1);
  const summary = `Saved to ${mdPath} (${sizeKB}KB, ~${input.estimatedTokens} tokens)`;

  return { mdPath, jsonldPath, summary };
}
