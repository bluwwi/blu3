const cache = new Map<string, { data: any; timestamp: number }>();
const DEFAULT_TTL = 5000;

export async function cachedFetch(url: string, options?: RequestInit, ttl = DEFAULT_TTL) {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  const res = await fetch(url, options);
  const data = await res.json();
  cache.set(url, { data, timestamp: Date.now() });
  return data;
}

export function invalidateCache(url: string) {
  cache.delete(url);
}
