import { describe, expect, it } from 'vitest';
import { extractJsonLd } from './jsonld.js';

describe('extractJsonLd', () => {
  it('extracts JSON-LD structured data', () => {
    const html = `<html><head>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Test Stool","offers":{"price":"499"}}</script>
    </head><body></body></html>`;
    const result = extractJsonLd(html) as Record<string, any>;
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Test Stool');
    expect(result?.offers.price).toBe('499');
  });

  it('returns null when no JSON-LD present', () => {
    const html = '<html><body><p>No structured data</p></body></html>';
    expect(extractJsonLd(html)).toBeNull();
  });

  it('returns array when multiple JSON-LD blocks found', () => {
    const html = `<html><head>
      <script type="application/ld+json">{"@type":"Organization","name":"TestCo"}</script>
      <script type="application/ld+json">{"@type":"Product","name":"Found It"}</script>
    </head></html>`;
    const result = extractJsonLd(html) as Record<string, any>[];
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0]['@type']).toBe('Organization');
    expect(result[1]['@type']).toBe('Product');
  });

  it('handles malformed JSON gracefully', () => {
    const html =
      '<html><head><script type="application/ld+json">{broken json</script></head></html>';
    expect(extractJsonLd(html)).toBeNull();
  });
});
