// Thin Firecrawl v2 wrappers. Failures return null + error string so the
// AI prep step can continue with whatever intel was available.

const BASE = "https://api.firecrawl.dev/v2";

function authHeaders() {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) throw new Error("FIRECRAWL_API_KEY not configured");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

export async function scrapeUrl(url: string): Promise<{ markdown: string; title?: string } | null> {
  try {
    const res = await fetch(`${BASE}/scrape`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const doc = json.data ?? json;
    const md: string | undefined = doc?.markdown;
    if (!md) return null;
    return { markdown: md.slice(0, 8000), title: doc?.metadata?.title };
  } catch {
    return null;
  }
}

export interface SearchHit {
  url: string;
  title: string;
  description?: string;
}

export async function searchWeb(query: string, limit = 6): Promise<SearchHit[]> {
  try {
    const res = await fetch(`${BASE}/search`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ query, limit }),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as any;
    const results: any[] =
      json.data?.web ?? json.data ?? json.web ?? json.results ?? [];
    return results
      .map((r): SearchHit => ({
        url: r.url ?? r.link,
        title: r.title ?? r.url,
        description: r.description ?? r.snippet,
      }))
      .filter((r) => Boolean(r.url));
  } catch {
    return [];
  }
}
