import { describe, it, expect } from 'vitest';
import { extractContent } from './readability.js';

describe('extractContent', () => {
  it('extracts main content and strips nav/footer', async () => {
    const html = `<html><head><title>Test Page</title></head><body>
      <nav><a href="/">Home</a><a href="/about">About</a></nav>
      <article><h1>Main Article</h1><p>This is the main content of the article with enough text to pass the content threshold for extraction purposes. We need to ensure that the word count exceeds the minimum threshold of twenty words so that the extraction logic does not discard this content block as too short. Adding several more sentences here will help guarantee that the article body is considered substantial enough for processing by the readability engine.</p></article>
      <footer><p>Copyright 2026</p></footer>
    </body></html>`;
    const result = await extractContent(html, 'https://example.com');
    expect(result).not.toBeNull();
    expect(result!.content).toContain('Main Article');
    expect(result!.content).not.toContain('Copyright');
    expect(result!.title).toBe('Test Page');
  });

  it('returns null for pages with insufficient content', async () => {
    const html = '<html><body><p>Hi</p></body></html>';
    const result = await extractContent(html, 'https://example.com');
    expect(result).toBeNull();
  });
});
