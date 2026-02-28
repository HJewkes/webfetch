import { describe, expect, it } from 'vitest';
import { extractJsonLd } from './jsonld.js';

describe('extractJsonLd', () => {
  it('extracts Product schema from JSON-LD', () => {
    const html = `<html><head>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Test Stool","offers":{"price":"499"}}</script>
    </head><body></body></html>`;
    const result = extractJsonLd(html);
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Test Stool');
    expect(result?.offers.price).toBe('499');
  });

  it('returns null when no JSON-LD present', () => {
    const html = '<html><body><p>No structured data</p></body></html>';
    expect(extractJsonLd(html)).toBeNull();
  });

  it('handles multiple JSON-LD blocks and finds Product', () => {
    const html = `<html><head>
      <script type="application/ld+json">{"@type":"Organization","name":"TestCo"}</script>
      <script type="application/ld+json">{"@type":"Product","name":"Found It"}</script>
    </head></html>`;
    const result = extractJsonLd(html);
    expect(result?.name).toBe('Found It');
  });

  it('handles malformed JSON gracefully', () => {
    const html =
      '<html><head><script type="application/ld+json">{broken json</script></head></html>';
    expect(extractJsonLd(html)).toBeNull();
  });
});
