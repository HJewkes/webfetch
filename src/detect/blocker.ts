export type BlockReason =
  | 'http_403'
  | 'http_429'
  | 'cloudflare'
  | 'akamai'
  | 'perimeterx'
  | 'empty_body'
  | 'meta_refresh_challenge';

export interface BlockResult {
  blocked: boolean;
  reason?: BlockReason;
}

const MIN_CONTENT_LENGTH = 512;

export function detectBlock(status: number, html: string): BlockResult {
  if (status === 403) return { blocked: true, reason: 'http_403' };
  if (status === 429) return { blocked: true, reason: 'http_429' };

  if (status === 200) {
    if (/<title>\s*Just a moment/i.test(html)) {
      return { blocked: true, reason: 'cloudflare' };
    }

    if (/Reference #[\w.]+/i.test(html) && /Access Denied/i.test(html)) {
      return { blocked: true, reason: 'akamai' };
    }

    if (/\/px\/challenge|px-captcha|_pxCaptcha/i.test(html)) {
      return { blocked: true, reason: 'perimeterx' };
    }

    if (/<meta[^>]+http-equiv=["']refresh["'][^>]+url=.*challenge/i.test(html)) {
      return { blocked: true, reason: 'meta_refresh_challenge' };
    }

    const textContent = html.replace(/<[^>]+>/g, '').trim();
    const hasSemanticContent = /<(h1|article|main|section)\b/i.test(html);
    if (textContent.length < MIN_CONTENT_LENGTH && !hasSemanticContent) {
      return { blocked: true, reason: 'empty_body' };
    }
  }

  return { blocked: false };
}
