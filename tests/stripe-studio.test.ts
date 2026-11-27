import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { eq } from 'drizzle-orm';

const directory = await mkdtemp(join(tmpdir(), 'vikas-stripe-test-'));
Object.assign(process.env, {
  DATABASE_PROVIDER: 'sqlite',
  DATABASE_URL: `file:${directory}/test.db`,
  AUTH_SECRET: 'isolated-test-placeholder-not-a-credential',
  NODE_ENV: 'test',
  VITE_APP_URL: 'http://localhost:3000',
});
execFileSync(
  process.execPath,
  [
    'node_modules/drizzle-kit/bin.cjs',
    'push',
    '--dialect=sqlite',
    '--schema=./src/config/db/schema.sqlite.ts',
    `--url=${process.env.DATABASE_URL}`,
    '--force',
  ],
  { stdio: 'pipe', env: process.env }
);
let disposeD1: (() => Promise<void>) | undefined;
if (process.env.ATOMIC_D1 === '1') {
  // Copy the pushed SQLite schema into a throwaway local D1, then point the
  // app's D1 driver at it the way src/server.ts does on Workers.
  const { createClient } = await import('@libsql/client');
  const sqlite = createClient({ url: process.env.DATABASE_URL! });
  const ddl = (
    await sqlite.execute(
      "select sql from sqlite_master where sql is not null and name not like 'sqlite_%' and name not like '__drizzle%' order by type = 'index'"
    )
  ).rows.map((r) => String(r.sql));
  sqlite.close();
  const { getPlatformProxy } = await import('wrangler');
  const proxy = await getPlatformProxy<{ DB: any }>({
    configPath: 'wrangler.jsonc',
    // Never use the live database, even when development shares remote D1.
    remoteBindings: false,
    persist: { path: join(directory, 'd1') },
  });
  for (const statement of ddl) await proxy.env.DB.prepare(statement).run();
  (globalThis as any).__CF_ENV__ = proxy.env;
  process.env.DATABASE_PROVIDER = 'd1';
  disposeD1 = proxy.dispose;
}
const { db } = await import('../src/core/db');
const { setAtomicModeForTests } = await import('../src/core/db/atomic');
const schema = await import('../src/config/db/schema');
const { createCheckout, handleWebhook, handlePaymentCallback } =
  await import('../src/modules/payment/service');
const { studioProducts, studioVideoOffer } =
  await import('../src/server/payment/storefront');
const { getPaidBalance } = await import('../src/modules/credits/service');
const { createHmac } = await import('node:crypto');
const originalFetch = globalThis.fetch;
const sessions = new Map<string, any>();
const subscriptions = new Map<string, any>();
const calls: { path: string; body: URLSearchParams; headers: Headers }[] = [];
let sequence = 0;
const signingSecret = 'isolated-stripe-signature-placeholder';
before(async () => {
  setAtomicModeForTests('batch');
  for (const [name, value] of Object.entries({
    stripe_enabled: 'true',
    stripe_secret_key: 'sk_test_isolated_placeholder',
    stripe_signing_secret: signingSecret,
    default_payment_provider: 'stripe',
  }))
    await db().insert(schema.config).values({ name, value });
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.hostname, 'api.stripe.com');
    const body = new URLSearchParams(String(init?.body ?? ''));
    const headers = new Headers(init?.headers);
    calls.push({ path: url.pathname, body, headers });
    if (url.pathname === '/v1/checkout/sessions' && init?.method === 'POST') {
      const id = `cs_test_${++sequence}`;
      const row = {
        id,
        object: 'checkout.session',
        url: `https://checkout.stripe.com/c/pay/${id}`,
        status: 'open',
        payment_status: 'unpaid',
        mode: body.get('mode'),
        currency: body.get('line_items[0][price_data][currency]'),
        amount_subtotal: Number(
          body.get('line_items[0][price_data][unit_amount]')
        ),
        amount_total: Number(
          body.get('line_items[0][price_data][unit_amount]')
        ),
        created: Math.floor(Date.now() / 1000),
        metadata: { order_no: body.get('metadata[order_no]') },
      };
      sessions.set(id, row);
      return Response.json(row);
    }
    if (url.pathname.startsWith('/v1/checkout/sessions/'))
      return Response.json(sessions.get(url.pathname.split('/').at(-1)!));
    if (url.pathname.startsWith('/v1/subscriptions/'))
      return Response.json(subscriptions.get(url.pathname.split('/').at(-1)!));
    throw new Error(
      `Unexpected Stripe request ${init?.method} ${url.pathname}`
    );
  };
});
after(async () => {
  globalThis.fetch = originalFetch;
  setAtomicModeForTests(undefined);
  await disposeD1?.();
  await rm(directory, { recursive: true, force: true });
});
async function checkout(productId = 'vikas_starter_once') {
  const p = [...studioProducts(), studioVideoOffer()].find(
    (p) => p?.productId === productId
  )!;
  assert.ok(p, productId);
  const userId = `buyer-${++sequence}`;
  await db()
    .insert(schema.user)
    .values({ id: userId, name: 'QA Buyer', email: `${userId}@example.test` });
  const result = await createCheckout({
    userId,
    provider: 'stripe',
    credits: p.credits,
    creditsValidDays: p.creditsValidDays,
    productName: p.productName,
    planName: p.planName,
    paymentOrder: {
      productId: p.productId,
      price: { amount: p.priceInCents, currency: p.currency },
      type: p.type,
      description: p.description,
      plan: p.plan,
      successUrl: 'http://localhost:3000/create?payment=success',
      cancelUrl: 'http://localhost:3000/pricing',
    },
  });
  const [row] = await db()
    .select()
    .from(schema.order)
    .where(eq(schema.order.paymentSessionId, result.checkoutInfo.sessionId));
  return {
    p,
    userId,
    result,
    row,
    remote: sessions.get(result.checkoutInfo.sessionId!),
  };
}
function paid(remote: any) {
  remote.status = 'complete';
  remote.payment_status = 'paid';
  if (remote.mode === 'subscription') {
    remote.subscription = `sub_${remote.id}`;
    const now = Math.floor(Date.now() / 1000);
    subscriptions.set(remote.subscription, {
      id: remote.subscription,
      status: 'active',
      items: {
        data: [
          {
            price: {
              id: 'price_test',
              product: 'prod_test',
              unit_amount: remote.amount_subtotal,
              currency: remote.currency,
            },
            plan: { interval: 'month', interval_count: 1 },
            current_period_start: now,
            current_period_end: now + 30 * 86400,
          },
        ],
      },
      metadata: {},
    });
  }
}
function webhook(type: string, remote: any, valid = true) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({
    id: `evt_${++sequence}`,
    object: 'event',
    type,
    data: { object: remote },
  });
  const signature = createHmac(
    'sha256',
    valid ? signingSecret : 'wrong-placeholder'
  )
    .update(`${timestamp}.${payload}`)
    .digest('hex');
  return handleWebhook({
    provider: 'stripe',
    req: new Request('http://localhost/api/payment/notify/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': `t=${timestamp},v1=${signature}` },
      body: payload,
    }),
  });
}
test('all six packages use catalog amounts, correct billing modes and idempotent creation', async () => {
  for (const p of studioProducts()) {
    const { row, result } = await checkout(p.productId);
    assert.equal(result.provider, 'stripe');
    assert.match(
      result.checkoutInfo.checkoutUrl!,
      /^https:\/\/checkout.stripe.com\//
    );
    const call = calls
      .filter((c) => c.path === '/v1/checkout/sessions')
      .at(-1)!;
    assert.equal(
      Number(call.body.get('line_items[0][price_data][unit_amount]')),
      p.priceInCents
    );
    assert.equal(
      call.body.get('mode'),
      p.type === 'subscription' ? 'subscription' : 'payment'
    );
    assert.equal(
      call.body.get('line_items[0][price_data][currency]'),
      p.currency
    );
    assert.equal(
      call.headers.get('idempotency-key'),
      `checkout_${row.orderNo}`
    );
    assert.match(
      call.body.get('success_url')!,
      /api\/payment\/callback\?order_no=/
    );
    assert.equal(call.body.get('cancel_url'), 'http://localhost:3000/pricing');
    if (p.type === 'subscription') {
      assert.equal(
        call.body.get('line_items[0][price_data][recurring][interval]'),
        'month'
      );
      assert.equal(
        call.body.get('line_items[0][price_data][recurring][interval_count]'),
        '1'
      );
    }
  }
});
test('signed webhook and browser callback racing grant exactly once for one-time and monthly', async () => {
  for (const p of studioProducts().filter(
    (p) => p.priceInCents === 900 || p.priceInCents === 1900
  )) {
    const { row, remote, userId } = await checkout(p.productId);
    paid(remote);
    await Promise.all([
      webhook('checkout.session.completed', remote),
      handlePaymentCallback(row.orderNo),
      webhook('checkout.session.completed', remote),
    ]);
    assert.equal(await getPaidBalance(userId), p.credits);
    const credits = await db()
      .select()
      .from(schema.credit)
      .where(eq(schema.credit.userId, userId));
    assert.equal(credits.length, 1);
    const subs = await db()
      .select()
      .from(schema.subscription)
      .where(eq(schema.subscription.userId, userId));
    assert.equal(subs.length, p.type === 'subscription' ? 1 : 0);
  }
});
test('unpaid completion grants nothing, async success grants once', async () => {
  const { row, remote, userId, p } = await checkout(
    studioProducts()[0].productId
  );
  remote.status = 'complete';
  await webhook('checkout.session.completed', remote);
  await handlePaymentCallback(row.orderNo);
  assert.equal(await getPaidBalance(userId), 0);
  paid(remote);
  await webhook('checkout.session.async_payment_succeeded', remote);
  await webhook('checkout.session.async_payment_succeeded', remote);
  assert.equal(await getPaidBalance(userId), p.credits);
});

test('US$3.99 single video settles once and is excluded from regular credits', async () => {
  const offer = studioVideoOffer()!;
  assert.equal(offer.priceInCents, 399);
  assert.equal(offer.type, 'one-time');
  assert.equal(offer.kind, 'video_pass');
  assert.equal(
    studioProducts().some((p) => p.productId === offer.productId),
    false
  );
  const { row, remote, userId } = await checkout(offer.productId);
  assert.equal(remote.amount_total, 399);
  await handlePaymentCallback(row.orderNo);
  assert.equal(await getPaidBalance(userId, true), 0);
  paid(remote);
  await Promise.all([
    webhook('checkout.session.completed', remote),
    handlePaymentCallback(row.orderNo),
    webhook('checkout.session.completed', remote),
  ]);
  assert.equal(await getPaidBalance(userId), 0);
  assert.equal(await getPaidBalance(userId, true), offer.credits);
  const grants = await db()
    .select()
    .from(schema.credit)
    .where(eq(schema.credit.userId, userId));
  assert.equal(grants.length, 1);
  assert.equal(grants[0].transactionScene, 'video_pass');
});
test('invalid signature and mismatched price or currency never grant credits', async () => {
  for (const kind of ['signature', 'amount', 'currency']) {
    const { remote, userId } = await checkout(studioProducts()[0].productId);
    paid(remote);
    if (kind === 'amount') remote.amount_subtotal = 1;
    if (kind === 'currency') remote.currency = 'eur';
    await assert.rejects(
      webhook('checkout.session.completed', remote, kind !== 'signature')
    );
    assert.equal(await getPaidBalance(userId), 0);
  }
});
test('Stripe-managed discount remains valid against original catalog subtotal', async () => {
  const { remote, userId, p } = await checkout(studioProducts()[0].productId);
  paid(remote);
  remote.amount_total -= 100;
  remote.total_details = { amount_discount: 100 };
  await webhook('checkout.session.completed', remote);
  assert.equal(await getPaidBalance(userId), p.credits);
});
test('expired and async-failed sessions cannot be marked paid, including incomplete subscriptions', async () => {
  for (const type of [
    'checkout.session.expired',
    'checkout.session.async_payment_failed',
  ]) {
    const { row, remote, userId } = await checkout(
      studioProducts().find((p) => p.type === 'subscription')!.productId
    );
    remote.status = type.endsWith('expired') ? 'expired' : 'complete';
    remote.subscription = 'incomplete_sub';
    await webhook(type, remote);
    assert.equal(await getPaidBalance(userId), 0);
    const [updated] = await db()
      .select()
      .from(schema.order)
      .where(eq(schema.order.id, row.id));
    assert.equal(updated.status, 'failed');
  }
});
