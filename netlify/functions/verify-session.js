// Securely confirms a Stripe Checkout session actually completed payment.
// Called by index.html right after the user is redirected back from Stripe
// (see the `?paid_session=...` handling near the bottom of the main
// <script>). This is the step that makes the payment gate real rather than
// just a URL parameter anyone could type in by hand: the client only trusts
// "paid" once THIS function — using the secret key, server-side — confirms
// Stripe's own records agree.
//
// Requires the same STRIPE_SECRET_KEY environment variable as
// create-checkout-session.js. See that file's header comment for setup.

const Stripe = require('stripe');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not set — see create-checkout-session.js setup comment.');
    return { statusCode: 500, body: JSON.stringify({ paid: false, error: 'Payments are not configured on this site yet.' }) };
  }

  const sessionId = event.queryStringParameters && event.queryStringParameters.session_id;
  if (!sessionId || !sessionId.startsWith('cs_')) {
    return { statusCode: 400, body: JSON.stringify({ paid: false, error: 'Missing or invalid session id.' }) };
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === 'paid';
    return {
      statusCode: 200,
      body: JSON.stringify({
        paid,
        postcode: (session.metadata && session.metadata.postcode) || null,
      }),
    };
  } catch (err) {
    console.error('Stripe session verification failed', err);
    return { statusCode: 502, body: JSON.stringify({ paid: false, error: 'Could not verify payment right now.' }) };
  }
};
