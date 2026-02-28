import { NodeHtmlMarkdown } from 'node-html-markdown';

const nhm = new NodeHtmlMarkdown({
  keepDataImages: false,
  useLinkReferenceDefinitions: false,
  useInlineLinks: true,
});

export function htmlToMarkdown(html: string): string {
  return nhm.translate(html).trim();
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
