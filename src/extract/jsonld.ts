export function extractJsonLd(html: string): Record<string, any> | Record<string, any>[] | null {
  const regex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const results: Record<string, any>[] = [];
  let match: RegExpExecArray | null = regex.exec(html);

  while (match !== null) {
    try {
      const data = JSON.parse(match[1]);
      if (Array.isArray(data)) {
        results.push(...data);
      } else if (data && typeof data === 'object') {
        results.push(data);
      }
    } catch {}
    match = regex.exec(html);
  }

  if (results.length === 0) return null;
  return results.length === 1 ? results[0] : results;
}
