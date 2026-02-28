export function extractJsonLd(html: string): Record<string, any> | null {
  const regex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null = regex.exec(html);

  while (match !== null) {
    try {
      const data = JSON.parse(match[1]);
      const product = findProduct(data);
      if (product) return product;
    } catch {}
    match = regex.exec(html);
  }
  return null;
}

function findProduct(data: unknown): Record<string, any> | null {
  if (!data || typeof data !== 'object') return null;
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findProduct(item);
      if (found) return found;
    }
    return null;
  }
  const obj = data as Record<string, any>;
  if (obj['@type'] === 'Product') return obj;
  if (obj['@graph'] && Array.isArray(obj['@graph'])) {
    return findProduct(obj['@graph']);
  }
  return null;
}
