# Getting TruePostcode live — the 2-minute version

I can't do this last step myself (no login access to any hosting account from
here), but it's genuinely quick. Two options, easiest first.

**Important — deploy the whole folder, not just the HTML files.** The site
now includes Stripe payment (`netlify/functions/`), the per-postcode SEO edge
function (`netlify/edge-functions/`), and their config (`netlify.toml`,
`package.json`). Netlify Drop's plain drag-and-drop only serves static files
and won't pick up the functions — for those to work you need either a proper
Netlify site deploy (connected to a repo, or via the Netlify CLI) rather than
the drop-a-folder flow below. The drop flow is still the fastest way to
eyeball the free report working with real internet access; just know payment
won't be live until you deploy properly. See `PAYMENTS.md` for the payment
setup steps once you're at that point.

## Option A — Netlify Drop (no account needed, live in ~30 seconds)

1. Unzip `truepostcode-deploy.zip` on your computer.
2. Go to **https://app.netlify.com/drop** in your browser.
3. Drag the unzipped folder (containing `index.html`, `privacy-policy.html`,
   `terms.html`) straight onto the page.
4. That's it — you'll get a live URL immediately, something like
   `https://random-name-123.netlify.app`. No signup required for this step.
5. To keep it long-term, add a free-tier custom domain, or claim the site with
   a free Netlify account (click "Claim your site" — it'll ask you to sign up,
   but the site is already live before that point).
6. For payment and the per-postcode SEO pages to actually work, follow up
   with a real Netlify site (Site configuration → Deploys → drag-and-drop
   still works for a *claimed* site's deploys, or connect a Git repo) so the
   `netlify/functions` and `netlify/edge-functions` folders get picked up —
   see `PAYMENTS.md`.

This is the fastest way to see the whole thing — including the live map and
the sold-price lookup — working with real internet access, which is the one
thing I can't check from my side.

## Option B — Cloudflare Pages (also free, a bit more setup, better for the long term)

1. Create a free Cloudflare account at https://dash.cloudflare.com/sign-up if
   you don't have one.
2. Go to **Workers & Pages → Create → Pages → Upload assets**.
3. Upload the three files from the zip.
4. Cloudflare gives you a `*.pages.dev` URL immediately, and lets you attach a
   real domain (bought anywhere — Cloudflare, Namecheap, etc.) for free
   afterwards, with free SSL.
5. Note: the Stripe payment functions and the per-postcode SEO edge function
   were built specifically for Netlify Functions/Edge Functions (per your
   choice) — they won't run on Cloudflare Pages as-is. If you go this route
   instead of Netlify, the static site and free report work fine, but
   payment and per-postcode SEO URLs would need re-implementing for
   Cloudflare's equivalent (Pages Functions).

## After it's live — quick checklist

- [ ] Open it on your phone and a couple of browsers, just to eyeball it for
      real (I've tested everything I can from here, but a live look always
      catches things a sandboxed test can't).
- [ ] Check the browser console (F12 → Console tab) on a couple of searches —
      if the "Sold price history" card ever says "couldn't load," that's the
      one integration I flagged as unverified (see the code comment above
      `loadPriceHistory` in `index.html`) — it may need a small proxy if HM
      Land Registry's endpoint doesn't allow direct browser requests.
- [ ] Once you're happy, replace `truepostcode.example` with your real domain
      — it's used as a placeholder in several SEO/meta tags now (canonical,
      og:url, og:image, twitter:image, the JSON-LD block, `robots.txt`,
      `sitemap.xml`, `about.html`, and the widget's "Powered by" link). The
      "Share this report" link itself doesn't need this — it already builds
      its URL dynamically from whatever domain the page is actually running
      on.
- [ ] Set up Stripe payment — see `PAYMENTS.md`. Nothing charges real money
      until you add your `STRIPE_SECRET_KEY` in Netlify; until then the "Pay
      & generate PDF" button will show a friendly "payment isn't available
      right now" message rather than breaking.
- [ ] Apply for AdSense — it needs a live URL with real content, so this is
      the earliest point you can start that application. Approval isn't
      instant, so worth kicking off early. See the ADSENSE setup comment at
      the top of `index.html`'s `<head>` for the exact activation steps.
