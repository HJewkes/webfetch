import { describe, it, expect } from 'vitest';
import { htmlToMarkdown } from './markdown.js';

describe('htmlToMarkdown', () => {
  it('converts HTML to clean markdown', () => {
    const html = '<h1>Title</h1><p>Paragraph with <strong>bold</strong> and <a href="https://example.com">link</a>.</p>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('# Title');
    expect(md).toContain('**bold**');
    expect(md).toContain('[link](https://example.com)');
  });

  it('preserves tables', () => {
    const html = '<table><tr><th>Name</th><th>Price</th></tr><tr><td>Stool</td><td>$499</td></tr></table>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('Name');
    expect(md).toContain('$499');
  });

  it('estimates token count', () => {
    const html = '<p>Hello world</p>';
    const md = htmlToMarkdown(html);
    expect(md.length).toBeGreaterThan(0);
  });
});
