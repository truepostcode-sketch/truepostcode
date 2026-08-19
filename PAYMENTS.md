# Getting the £4.99 Pro PDF payment live

This wires the "Pay & generate PDF" button to real Stripe Checkout. I can't
create a Stripe account or handle real payment credentials myself — this is
the setup you'll need to do, but it's a normal Stripe integration and should
take about 15 minutes.

## How it works (so you know what you're deploying)

- `netlify/functions/create-checkout-session.js` — when someone clicks "Pay &
  generate PDF", this creates a one-off £4.99 Stripe Checkout session and the
  browser is redirected to Stripe's own secure checkout page. No card details
  ever touch this site's code.
- `netlify/functions/verify-session.js` — when Stripe redirects the browser
  back after payment, this checks Stripe's own records (server-side, using
  your secret key) to confirm the payment actually completed before the PDF
  is unlocked. This is the real security boundary — a URL parameter alone is
  never trusted.
- Both are Netlify Functions, deployed automatically alongside the static
  site from the `netlify/functions` folder — see `netlify.toml`.

**Note on what's actually being sold:** every figure in the PDF is already
free to view on the site (see `terms.html` Section 8) — the £4.99 is for the
formatted, personalised document, not for otherwise-hidden data. That's
relevant to the security model: if someone were somehow able to trigger a PDF
without paying, the "loss" is a free copy of already-public data, not exposed
sensitive information. The verify-session step still makes this a real,
standard payment gate — just worth knowing the actual stakes.

## Setup steps

1. **Create a Stripe account** at https://dashboard.stripe.com/register if
   you don't have one (this part only you can do — it needs your business/
   bank details).
2. **Get your API keys**: https://dashboard.stripe.com/apikeys. While
   testing, use the **test mode** secret key (starts `sk_test_...`) — you can
   fully test the whole flow with Stripe's test card `4242 4242 4242 4242`,
   any future expiry date, and any CVC, without moving real money.
3. **Add the key to Netlify** (never commit it to a file): in your Netlify
   site dashboard, go to **Site configuration → Environment variables → Add a
   variable**, name it `STRIPE_SECRET_KEY`, and paste your Stripe secret key
   as the value.
4. **Deploy this whole folder** to Netlify (not just `index.html` — the
   `netlify/` folder, `netlify.toml`, and `package.json` need to go too, so
   Netlify picks up the functions and installs the `stripe` package). If
   you're using Netlify Drop from `DEPLOY.md`, drag the *whole unzipped
   folder* in, not just the HTML files.
5. **Test it**: on your live (or Netlify preview) URL, search a postcode,
   click "PDF report · £4.99" → "Pay & generate PDF", pay with the test card
   above, and confirm you're bounced back and the print dialog opens
   automatically with the right postcode on the cover.
6. **Go live**: switch to your Stripe **live** secret key
   (`sk_live_...`) in the same Netlify environment variable once you're happy
   — no code changes needed, just swap the value.

## Refunds

If a customer disputes a charge or the PDF genuinely fails to generate, issue
the refund directly from your Stripe dashboard (Payments → find the charge →
Refund). `terms.html` Section 8 already documents the refund policy this
should follow.
