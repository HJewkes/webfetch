import { extractJsonLd } from './jsonld.js';
import { extractContent } from './readability.js';
import { htmlToMarkdown, estimateTokens } from './markdown.js';

export interface ExtractionResult {
  jsonld: Record<string, any> | null;
  markdown: string;
  title: string;
  estimatedTokens: number;
}

export async function extractionPipeline(html: string, url: string): Promise<ExtractionResult> {
  const jsonld = extractJsonLd(html);
  const content = await extractContent(html, url);

  let markdown: string;
  let title: string;

  if (content) {
    markdown = htmlToMarkdown(content.content);
    title = content.title;
  } else {
    markdown = htmlToMarkdown(html);
    title = '';
  }

  return {
    jsonld,
    markdown,
    title,
    estimatedTokens: estimateTokens(markdown),
  };
}
