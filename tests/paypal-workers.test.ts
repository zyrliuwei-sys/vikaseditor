import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

// Exercise the real Workers fetch implementation. Node-only fetch mocks accept
// redirect modes that workerd rejects before making any network request.
const require = createRequire(import.meta.url);
const wranglerRequire = createRequire(require.resolve('wrangler'));
const { Miniflare, convertV4MiniflareOptions } = wranglerRequire('miniflare');
const { build } = wranglerRequire('esbuild');

async function runtime(redirectAt?: string) {
  const bundle = await build({
    stdin: {
      resolveDir: process.cwd(),
      contents: `
        import { PayPalProvider } from './src/core/payment/paypal';
        const provider = new PayPalProvider({clientId:'test-placeholder',clientSecret:'test-placeholder',environment:'sandbox'});
        export default {async fetch(request) {
          const monthly = new URL(request.url).pathname === '/monthly';
          try {
            const result = await provider.createPayment({order:{
              orderNo:monthly?'worker-monthly':'worker-once',
              price:{amount:monthly?1900:900,currency:'usd'},
              type:monthly?'subscription':'one-time',
              description:'Vikas Starter',
              successUrl:'https://example.test/callback',
              cancelUrl:'https://example.test/pricing',
              customer:{email:'buyer@example.test',name:'PaymentQA'},
              ...(monthly?{plan:{name:'Starter',interval:'month',intervalCount:1}}:{})
            }});
            return Response.json({url:result.checkoutInfo.checkoutUrl});
          } catch(error) {return Response.json({error:error.message},{status:502});}
        }};`,
      loader: 'ts',
    },
    write: false,
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    target: 'es2022',
  });
  const requests: string[] = [];
  const worker = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: bundle.outputFiles[0].text,
      compatibilityDate: '2026-10-01',
      compatibilityFlags: ['nodejs_compat'],
      outboundService: async (request: Request) => {
        const url = new URL(request.url);
        requests.push(url.href);
        assert.equal(url.origin, 'https://api-m.sandbox.paypal.com');
        if (url.pathname === redirectAt)
          return Response.redirect(
            'https://untrusted.example/credentials',
            307
          );
        if (url.pathname === '/v1/oauth2/token')
          return Response.json({
            access_token: 'test-token-placeholder',
            expires_in: 3600,
          });
        assert.equal(
          request.headers.get('authorization'),
          'Bearer test-token-placeholder'
        );
        if (url.pathname === '/v1/catalogs/products')
          return Response.json({ id: 'PROD-TEST' });
        if (url.pathname === '/v1/billing/plans')
          return Response.json({ id: 'PLAN-TEST' });
        assert.ok(
          ['/v2/checkout/orders', '/v1/billing/subscriptions'].includes(
            url.pathname
          )
        );
        return Response.json({
          id: 'CHECKOUT-TEST',
          links: [
            {
              rel: 'approve',
              href: 'https://www.sandbox.paypal.com/checkoutnow?token=TEST',
            },
          ],
        });
      },
    })
  );
  return { worker, requests };
}

test('Workers creates one-time and monthly PayPal checkouts, including concurrent requests', async () => {
  const { worker, requests } = await runtime();
  try {
    const results = await Promise.all(
      ['/once', '/monthly'].map(async (path) => {
        const response = await worker.dispatchFetch(
          `https://app.example${path}`
        );
        return { status: response.status, body: await response.json() };
      })
    );
    for (const result of results) {
      assert.equal(result.status, 200, JSON.stringify(result.body));
      assert.equal(new URL(result.body.url).hostname, 'www.sandbox.paypal.com');
    }
    assert.ok(requests.some((url) => url.endsWith('/v2/checkout/orders')));
    assert.ok(
      requests.some((url) => url.endsWith('/v1/billing/subscriptions'))
    );
  } finally {
    await worker.dispose();
  }
});

for (const endpoint of [
  '/v1/oauth2/token',
  '/v2/checkout/orders',
  '/v1/billing/subscriptions',
]) {
  test(`Workers rejects a redirect from ${endpoint} without forwarding credentials`, async () => {
    const { worker, requests } = await runtime(endpoint);
    try {
      const path = endpoint.includes('subscriptions') ? '/monthly' : '/once';
      const response = await worker.dispatchFetch(`https://app.example${path}`);
      assert.equal(response.status, 502);
      assert.ok(
        requests.some((url) => url.endsWith(endpoint)),
        'request must reach the provider before rejecting its redirect'
      );
      assert.ok(
        requests.every(
          (url) => new URL(url).hostname === 'api-m.sandbox.paypal.com'
        )
      );
    } finally {
      await worker.dispose();
    }
  });
}
