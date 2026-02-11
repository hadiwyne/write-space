import * as cheerio from 'cheerio';

const FETCH_TIMEOUT_MS = 5000;
const USER_AGENT =
  'Mozilla/5.0 (compatible; WriteSpace/1.0; +https://github.com/writespace)';

export interface LinkPreviewData {
  url: string;
  image?: string | null;
  title?: string | null;
  description?: string | null;
  siteName?: string | null;
}

/** Internal post image path – skip these when looking for a link to preview. */
const POST_IMAGE_PATH = '/posts/images/';

/** Decode common HTML entities in a URL (e.g. &amp; from rich text). */
function decodeUrl(url: string): string {
  return url
    .replace(/&amp;/gi, '&')
    .replace(/&#38;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"');
}

/** Extract first HTTP(S) URL from post content that is suitable for link preview. Skips internal post image URLs. */
export function extractFirstUrl(content: string): string | null {
  if (!content || typeof content !== 'string') return null;

  const skip = (url: string) => decodeUrl(url).includes(POST_IMAGE_PATH);
  const take = (url: string) => (skip(url) ? null : decodeUrl(url));

  // Markdown [text](url) – check all and take first non-image
  const mdLinks = content.matchAll(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g);
  for (const m of mdLinks) {
    const u = take(m[1]);
    if (u) return u;
  }
  // HTML <a href="url"> – permissive for rich text (optional spaces, any attribute order, URL until closing quote)
  const aTags = content.matchAll(/<a\s[^>]*href\s*=\s*["'](https?:\/\/[^"']+)["']/gi);
  for (const m of aTags) {
    const u = take(m[1]);
    if (u) return u;
  }
  // Plain URL
  const plainUrls = content.matchAll(/https?:\/\/[^\s<>"']+/g);
  for (const m of plainUrls) {
    const u = take(m[0]);
    if (u) return u;
  }
  return null;
}

/** Fetch URL and parse Open Graph (and fallback) metadata. */
export async function fetchLinkPreview(url: string): Promise<LinkPreviewData | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    const getMeta = (selector: string): string | null => {
      const el = $(selector).first();
      return (el.attr('content') || el.attr('value') || null) ?? null;
    };

    const image =
      getMeta('meta[property="og:image"]') ||
      getMeta('meta[name="twitter:image"]');
    const title =
      getMeta('meta[property="og:title"]') ||
      getMeta('meta[name="twitter:title"]') ||
      $('title').first().text().trim() ||
      null;
    const description =
      getMeta('meta[property="og:description"]') ||
      getMeta('meta[name="twitter:description"]') ||
      getMeta('meta[name="description"]');
    const siteName = getMeta('meta[property="og:site_name"]') || null;

    // Resolve relative image URL
    let imageUrl: string | null = image;
    if (imageUrl && !imageUrl.startsWith('http')) {
      try {
        imageUrl = new URL(imageUrl, url).href;
      } catch {
        imageUrl = null;
      }
    }

    return {
      url,
      image: imageUrl || null,
      title: title || null,
      description: description || null,
      siteName: siteName || null,
    };
  } catch {
    return null;
  }
}
