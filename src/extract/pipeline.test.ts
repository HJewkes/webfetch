import { describe, expect, it } from 'vitest';
import { extractionPipeline } from './pipeline.js';

describe('extractionPipeline', () => {
  it('returns JSON-LD when present', async () => {
    const html = `<html><head>
      <script type="application/ld+json">{"@type":"Product","name":"Test","offers":{"price":"99"}}</script>
    </head><body><p>Content</p></body></html>`;
    const result = await extractionPipeline(html, 'https://example.com');
    expect(result.jsonld).not.toBeNull();
    expect(result.jsonld?.name).toBe('Test');
  });

  it('falls through to readability + markdown when no JSON-LD', async () => {
    const html = `<html><head><title>Article</title></head><body>
      <article><h1>Big Article</h1><p>This is a long article with substantial content that should pass the content threshold for extraction. It contains multiple sentences and paragraphs worth of text.</p></article>
    </body></html>`;
    const result = await extractionPipeline(html, 'https://example.com');
    expect(result.jsonld).toBeNull();
    expect(result.markdown).toContain('Big Article');
    expect(result.estimatedTokens).toBeGreaterThan(0);
  });
});
