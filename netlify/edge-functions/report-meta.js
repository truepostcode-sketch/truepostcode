// Gives every postcode report its own crawlable, distinctly-titled URL —
// e.g. /report/dy12-2ee — instead of everything living behind one generic
// homepage URL. This is the fix for the SEO gap flagged in the pre-launch
// council review: Google can now index "flood risk for DY12 2EE" as its own
// page with its own <title>/description, even though the actual report is
// still rendered client-side by index.html's existing JS.
//
// How it works: index.html is served as-is (same file for every URL, via the
// SPA redirect rule in netlify.toml), and this edge function rewrites just
// the <head> meta tags on the way out for any /report/* request, based on the
// postcode in the URL. The page's own JS (see the routing code near the
// bottom of index.html's <script>) reads the same URL segment client-side
// and runs the actual search — the two are deliberately kept in sync by both
// reading the same slug format (lowercase, dashes for spaces).
//
// This does NOT server-render the report's data (flood risk, crime figures,
// etc.) — that still requires a live browser to fetch from postcodes.io/EA/
// data.police.uk/etc. A search engine that executes JavaScript (Googlebot
// does) will still see the real content; one that doesn't will at least see
// an accurate, unique title and description per postcode, which is what
// actually gets a result clicked in search listings.
//
// HTMLRewriter isn't a built-in global here (unlike Cloudflare Workers) —
// it's imported via the "html-rewriter" specifier, mapped to a real module
// URL in netlify/edge-functions/import_map.json, which netlify.toml points
// to via `deno_import_map`. Without that import map this line fails with
// "HTMLRewriter is not defined" and the whole function crashes.
import { HTMLRewriter } from 'html-rewriter';

export default async (request, context) => {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/report\/([a-z0-9-]+)\/?$/i);
  const response = await context.next();
  if (!match) return response;

  const slug = match[1].toLowerCase();
  const postcode = slug.replace(/-/g, ' ').toUpperCase();
  const title = `${postcode} — Flood Risk, Crime & Property Data | TruePostcode`;
  const description = `Check flood risk, crime, sold prices, schools and local amenities for ${postcode} — free, official UK government data, no account needed.`;
  const canonical = `${url.origin}/report/${slug}`;

  return new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(title); } })
    .on('meta[name="description"]', { element(el) { el.setAttribute('content', description); } })
    .on('link[rel="canonical"]', { element(el) { el.setAttribute('href', canonical); } })
    .on('meta[property="og:title"]', { element(el) { el.setAttribute('content', title); } })
    .on('meta[property="og:description"]', { element(el) { el.setAttribute('content', description); } })
    .on('meta[property="og:url"]', { element(el) { el.setAttribute('content', canonical); } })
    .on('meta[name="twitter:title"]', { element(el) { el.setAttribute('content', title); } })
    .on('meta[name="twitter:description"]', { element(el) { el.setAttribute('content', description); } })
    .transform(response);
};

export const config = { path: '/report/*' };
