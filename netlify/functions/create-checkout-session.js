// Creates a Stripe Checkout session for the one-off £4.99 Pro PDF export.
// Called by the "Pay & generate PDF" button in index.html (see the
// proGenerateBtn handler in the main <script>).
//
// SETUP — before this will work, in the Netlify dashboard for this site:
//   Site configuration → Environment variables → add STRIPE_SECRET_KEY
//   with your real Stripe secret key (starts "sk_live_..." or "sk_test_..."
//   while testing). Get it from https://dashboard.stripe.com/apikeys.
//   Never put this key in any file that gets committed or deployed as a
//   static asset — environment variables are the only safe place for it.
//
// This project doesn't have a package-lock.json checked in; Netlify runs
// `npm install` from package.json automatically during the build, so the
// `stripe` package listed there is all that's needed.

const Stripe = require('stripe');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not set — see the setup comment at the top of this file.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Payments are not configured on this site yet.' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body.' }) };
  }

  const postcode = String(body.postcode || '').trim().slice(0, 16);
  const forName = String(body.forName || '').trim().slice(0, 120);
  const byName = String(body.byName || '').trim().slice(0, 120);
  if (!postcode) {
    return { statusCode: 400, body: JSON.stringify({ error: 'A postcode is required.' }) };
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  // The origin of the actual site (works for the live domain and Netlify's
  // own *.netlify.app preview URLs without hardcoding a domain here).
  const origin = event.headers.origin || `https://${event.headers.host}`;
  const returnParams = new URLSearchParams({ pc: postcode });
  if (forName) returnParams.set('for', forName);
  if (byName) returnParams.set('by', byName);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // No payment_method_types here on purpose — Stripe's Managed Payments
      // (on by default for newer accounts) chooses payment methods itself and
      // rejects this parameter if it's set explicitly.
      line_items: [{
        price_data: {
          currency: 'gbp',
          unit_amount: 499, // £4.99 — see the project's terms.html Section 8 for the pricing/refund policy this must match
          product_data: {
            name: `TruePostcode Pro PDF Report — ${postcode}`,
            description: 'A formatted, printable PDF export of a TruePostcode report. The underlying data is already free on the site — this fee is for the formatted document.',
          },
        },
        quantity: 1,
      }],
      // {CHECKOUT_SESSION_ID} is a literal Stripe template token, filled in by
      // Stripe itself on redirect — the client then calls verify-session.js
      // with this ID to securely confirm payment before unlocking the PDF.
      success_url: `${origin}/?paid_session={CHECKOUT_SESSION_ID}&${returnParams.toString()}`,
      cancel_url: `${origin}/?${returnParams.toString()}`,
      metadata: { postcode, forName, byName },
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    console.error('Stripe checkout session creation failed', err);
    return { statusCode: 502, body: JSON.stringify({ error: 'Could not start payment. Please try again shortly.' }) };
  }
};
