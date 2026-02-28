import { Defuddle } from 'defuddle/node';

export interface ContentResult {
  title: string;
  content: string;
  wordCount: number;
}

export async function extractContent(html: string, url: string): Promise<ContentResult | null> {
  try {
    const result = await Defuddle(html, url);

    if (!result.content || result.wordCount < 20) return null;

    return {
      title: result.title || '',
      content: result.content,
      wordCount: result.wordCount,
    };
  } catch {
    return null;
  }
}
