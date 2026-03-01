import { existsSync, readFileSync, rmSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { buildOutputPath, slugify, writeOutput } from './writer.js';

const TEST_DIR = '/tmp/webfetch-test';

afterEach(() => {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
});

describe('slugify', () => {
  it('converts URL path to filesystem-safe slug', () => {
    expect(slugify('/products/layton-leather-swivel-bar-counter-stool/')).toBe(
      'products-layton-leather-swivel-bar-counter-stool',
    );
  });

  it('handles empty path', () => {
    expect(slugify('/')).toBe('index');
  });

  it('truncates long slugs', () => {
    const long = `/${'a'.repeat(200)}`;
    expect(slugify(long).length).toBeLessThanOrEqual(80);
  });
});

describe('buildOutputPath', () => {
  it('creates domain-based directory structure', () => {
    const path = buildOutputPath('https://www.potterybarn.com/products/layton/', TEST_DIR, 'md');
    expect(path).toContain('potterybarn.com');
    expect(path.endsWith('.md')).toBe(true);
  });
});

describe('writeOutput', () => {
  it('writes markdown file and returns summary', () => {
    const result = writeOutput({
      url: 'https://example.com/test',
      markdown: '# Test\n\nSome content here.',
      jsonld: null,
      title: 'Test',
      estimatedTokens: 8,
      outputDir: TEST_DIR,
    });
    expect(result.mdPath).toBeTruthy();
    expect(existsSync(result.mdPath)).toBe(true);
    expect(readFileSync(result.mdPath, 'utf-8')).toContain('# Test');
    expect(result.summary).toContain('Saved');
    expect(result.summary).toContain('~8 tokens');
  });

  it('includes large-file hint when tokens exceed 8000', () => {
    const result = writeOutput({
      url: 'https://example.com/large',
      markdown: 'x'.repeat(40000),
      jsonld: null,
      title: 'Large',
      estimatedTokens: 10000,
      outputDir: TEST_DIR,
    });
    expect(result.summary).toContain('large file, use Grep for targeted reading');
  });

  it('omits large-file hint for small files', () => {
    const result = writeOutput({
      url: 'https://example.com/small',
      markdown: '# Small',
      jsonld: null,
      title: 'Small',
      estimatedTokens: 100,
      outputDir: TEST_DIR,
    });
    expect(result.summary).not.toContain('large file');
  });

  it('writes JSON-LD file alongside markdown when present', () => {
    const result = writeOutput({
      url: 'https://example.com/product',
      markdown: '# Product',
      jsonld: { '@type': 'Product', name: 'Stool' },
      title: 'Product',
      estimatedTokens: 4,
      outputDir: TEST_DIR,
    });
    expect(result.jsonldPath).toBeTruthy();
    expect(existsSync(result.jsonldPath!)).toBe(true);
    const data = JSON.parse(readFileSync(result.jsonldPath!, 'utf-8'));
    expect(data.name).toBe('Stool');
  });
});
