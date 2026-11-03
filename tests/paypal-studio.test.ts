import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { eq } from 'drizzle-orm';

const directory = await mkdtemp(join(tmpdir(), 'vikas-paypal-test-'));
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
const { PayPalProvider, PaymentManager } = await import('../src/core/payment');
const { studioProducts } = await import('../src/server/payment/storefront');
const { getPaidBalance } = await import('../src/modules/credits/service');
const originalFetch = globalThis.fetch;
let sequence = 0;
const orders = new Map<string, any>(),
  subscriptions = new Map<string, any>(),
  plans = new Map<string, any>();
const transactions = new Map<string, any[]>();
const calls: { url: string; method: string; body: any; headers: Headers }[] =
  [];
let signature = 'SUCCESS';

before(async () => {
  setAtomicModeForTests('batch');
  for (const [name, value] of Object.entries({
    paypal_enabled: 'true',
    paypal_client_id: 'test-placeholder',
    paypal_client_secret: 'test-placeholder',
    paypal_webhook_id: 'test-webhook',
    paypal_environment: 'sandbox',
    default_payment_provider: 'paypal',
  }))
    await db().insert(schema.config).values({ name, value });
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.hostname, 'api-m.sandbox.paypal.com');
    assert.equal(init?.redirect, 'error');
    assert.ok(init?.signal);
    const method = init?.method || 'GET';
    const body =
      typeof init?.body === 'string' && init.body.startsWith('{')
        ? JSON.parse(init.body)
        : {};
    calls.push({
      url: url.pathname,
      method,
      body,
      headers: new Headers(init?.headers),
    });
    if (url.pathname === '/v1/oauth2/token')
      return Response.json({
        access_token: 'test-access-placeholder',
        expires_in: 3600,
      });
    if (url.pathname === '/v1/notifications/verify-webhook-signature')
      return Response.json({ verification_status: signature });
    if (url.pathname === '/v2/checkout/orders' && method === 'POST') {
      const id = `PAYPAL-${++sequence}`;
      const row = {
        id,
        status: 'CREATED',
        ...body,
        links: [
          {
            rel: 'approve',
            href: `https://www.sandbox.paypal.com/checkoutnow?token=${id}`,
          },
        ],
      };
      orders.set(id, row);
      return Response.json(row);
    }
    if (url.pathname === '/v1/catalogs/products')
      return Response.json({ id: `PROD-${++sequence}` });
    if (url.pathname === '/v1/billing/plans' && method === 'POST') {
      const id = `PLAN-${++sequence}`;
      plans.set(id, { id, ...body });
      return Response.json({ id });
    }
    if (url.pathname === '/v1/billing/subscriptions' && method === 'POST') {
      const id = `I-${++sequence}`;
      const row = {
        id,
        ...body,
        status: 'APPROVAL_PENDING',
        create_time: new Date(Date.now() - 60000).toISOString(),
        links: [
          {
            rel: 'approve',
            href: `https://www.sandbox.paypal.com/webapps/billing/subscriptions?ba_token=${id}`,
          },
        ],
      };
      subscriptions.set(id, row);
      transactions.set(id, []);
      return Response.json(row);
    }
    const id = url.pathname.split('/')[4];
    if (url.pathname.startsWith('/v2/checkout/orders/')) {
      const row = orders.get(id);
      if (!row) return new Response('', { status: 404 });
      if (url.pathname.endsWith('/capture')) {
        assert.equal(
          new Headers(init?.headers).get('PayPal-Request-Id'),
          `capture_${id}`
        );
        row.status = 'COMPLETED';
        row.purchase_units[0].payments = {
          captures: [
            {
              id: `CAPTURE-${id}`,
              status: 'COMPLETED',
              amount: row.purchase_units[0].amount,
              create_time: new Date().toISOString(),
            },
          ],
        };
      }
      return Response.json(row);
    }
    if (url.pathname.startsWith('/v1/billing/plans/'))
      return Response.json(plans.get(id));
    if (url.pathname.startsWith('/v1/billing/subscriptions/'))
      return Response.json(
        url.pathname.endsWith('/transactions')
          ? { transactions: transactions.get(id) }
          : subscriptions.get(id)
      );
    throw new Error(`Unexpected test request ${method} ${url.pathname}`);
  };
});
after(async () => {
  globalThis.fetch = originalFetch;
  setAtomicModeForTests(undefined);
  await disposeD1?.();
  await rm(directory, { recursive: true, force: true });
});

async function checkout(productId: string) {
  const p = studioProducts().find((p) => p.productId === productId)!;
  const userId = `buyer-${++sequence}`;
  await db()
    .insert(schema.user)
    .values({ id: userId, name: 'QA Buyer', email: `${userId}@example.test` });
  const result = await createCheckout({
    userId,
    provider: 'paypal',
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
    },
  });
  const [row] = await db()
    .select()
    .from(schema.order)
    .where(eq(schema.order.paymentSessionId, result.checkoutInfo.sessionId));
  return { userId, result, row, p };
}
function webhook(event_type: string, resource: any) {
  return handleWebhook({
    provider: 'paypal',
    req: new Request('http://localhost/api/payment/notify/paypal', {
      method: 'POST',
      headers: {
        'paypal-auth-algo': 'SHA256withRSA',
        'paypal-cert-url': 'https://api.paypal.com/cert/test',
        'paypal-transmission-id': 'test-id',
        'paypal-transmission-sig': 'test-signature',
        'paypal-transmission-time': new Date().toISOString(),
      },
      body: JSON.stringify({ id: 'test-event', event_type, resource }),
    }),
  });
}

test('all six packages create the correct PayPal amount, monthly cycle and approval URL', async () => {
  for (const product of studioProducts()) {
    const { result } = await checkout(product.productId);
    assert.match(
      result.checkoutInfo.checkoutUrl!,
      /^https:\/\/www.sandbox.paypal.com\//
    );
    const id = result.checkoutInfo.sessionId!;
    if (product.type === 'subscription') {
      const plan = plans.get(subscriptions.get(id).plan_id);
      assert.equal(
        plan.billing_cycles[0].pricing_scheme.fixed_price.value,
        (product.priceInCents / 100).toFixed(2)
      );
      assert.deepEqual(plan.billing_cycles[0].frequency, {
        interval_unit: 'MONTH',
        interval_count: 1,
      });
    } else
      assert.equal(
        orders.get(id).purchase_units[0].amount.value,
        (product.priceInCents / 100).toFixed(2)
      );
  }
  assert.ok(
    calls
      .filter((c) => c.method === 'POST' && c.url !== '/v1/oauth2/token')
      .every((c) => c.headers.has('PayPal-Request-Id'))
  );
});

test('approval captures a one-time order; callback and webhook concurrency grant credits once', async () => {
  const { userId, result, row, p } = await checkout('vikas_starter_once');
  const id = result.checkoutInfo.sessionId!;
  orders.get(id).status = 'APPROVED';
  await Promise.all([
    handlePaymentCallback(row.orderNo),
    webhook('CHECKOUT.ORDER.APPROVED', { id }),
  ]);
  const capture = orders.get(id).purchase_units[0].payments.captures[0];
  await Promise.all(
    Array.from({ length: 8 }, () =>
      webhook('PAYMENT.CAPTURE.COMPLETED', {
        ...capture,
        supplementary_data: { related_ids: { order_id: id } },
      })
    )
  );
  assert.equal(await getPaidBalance(userId), p.credits);
});

test('an approved subscription without a completed payment never grants credits', async () => {
  const { userId, result, row } = await checkout('vikas_starter_monthly');
  subscriptions.get(result.checkoutInfo.sessionId!).status = 'APPROVED';
  await handlePaymentCallback(row.orderNo);
  assert.equal(await getPaidBalance(userId), 0);
  const [saved] = await db()
    .select()
    .from(schema.order)
    .where(eq(schema.order.id, row.id));
  assert.equal(saved.status, 'created');
});

test('subscription sale webhooks and callback use actual transaction IDs and renew exactly once', async () => {
  const { userId, result, row, p } = await checkout('vikas_starter_monthly');
  const id = result.checkoutInfo.sessionId!;
  const sub = subscriptions.get(id);
  const first = new Date(Date.now() - 30000).toISOString();
  Object.assign(sub, {
    status: 'ACTIVE',
    billing_info: {
      last_payment: {
        time: first,
        amount: { value: '19.00', currency_code: 'USD' },
      },
      cycle_executions: [{ cycles_completed: 1 }],
    },
  });
  const sale = {
    id: `SALE-${id}-1`,
    state: 'completed',
    billing_agreement_id: id,
    amount: { total: '19.00', currency: 'USD' },
    create_time: first,
  };
  transactions.set(id, [
    {
      id: sale.id,
      status: 'COMPLETED',
      time: first,
      amount_with_breakdown: {
        gross_amount: { value: '19.00', currency_code: 'USD' },
      },
    },
  ]);
  await Promise.all([
    handlePaymentCallback(row.orderNo),
    ...Array.from({ length: 6 }, () => webhook('PAYMENT.SALE.COMPLETED', sale)),
  ]);
  assert.equal(await getPaidBalance(userId), p.credits);
  const nextDate = new Date(first);
  nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
  sub.billing_info.last_payment.time = nextDate.toISOString();
  sub.billing_info.cycle_executions[0].cycles_completed = 2;
  const renewal = {
    ...sale,
    id: `SALE-${id}-2`,
    create_time: nextDate.toISOString(),
  };
  await Promise.all(
    Array.from({ length: 8 }, () => webhook('PAYMENT.SALE.COMPLETED', renewal))
  );
  assert.equal(await getPaidBalance(userId), p.credits * 2);
  await webhook('PAYMENT.SALE.COMPLETED', sale);
  assert.equal(await getPaidBalance(userId), p.credits * 2);
  await assert.rejects(
    webhook('PAYMENT.SALE.COMPLETED', {
      ...renewal,
      id: 'BAD-CURRENCY',
      amount: { total: '19.00', currency: 'EUR' },
    }),
    /currency/
  );
  assert.equal(await getPaidBalance(userId), p.credits * 2);
});

test('signed notifications with a wrong amount and invalid signatures grant nothing', async () => {
  const { userId, result } = await checkout('vikas_starter_once');
  const id = result.checkoutInfo.sessionId!;
  orders.get(id).status = 'COMPLETED';
  orders.get(id).purchase_units[0].payments = {
    captures: [
      {
        id: 'BAD-CAPTURE',
        status: 'COMPLETED',
        amount: { value: '0.01', currency_code: 'USD' },
      },
    ],
  };
  await assert.rejects(webhook('CHECKOUT.ORDER.COMPLETED', { id }), /amount/);
  assert.equal(await getPaidBalance(userId), 0);
  orders.get(id).purchase_units[0].payments.captures[0].amount = {
    value: '9.00',
    currency_code: 'EUR',
  };
  await assert.rejects(webhook('CHECKOUT.ORDER.COMPLETED', { id }), /currency/);
  signature = 'FAILURE';
  await assert.rejects(
    webhook('CHECKOUT.ORDER.COMPLETED', { id }),
    /signature/
  );
  signature = 'SUCCESS';
  const provider = new PayPalProvider({
    clientId: 'test-placeholder',
    clientSecret: 'test-placeholder',
    webhookId: 'test-webhook',
    environment: 'sandbox',
  });
  await assert.rejects(
    provider.getPaymentEvent({
      req: new Request('http://localhost/', {
        method: 'POST',
        body: JSON.stringify({
          event_type: 'CHECKOUT.ORDER.COMPLETED',
          resource: { id },
        }),
      }),
    }),
    /signature/
  );
  const manager = new PaymentManager();
  manager.addProvider(provider, true);
  assert.equal(manager.getProvider('stripe'), undefined);
});

test('monthly billing periods clamp to the end of a short month', async () => {
  const { result } = await checkout('vikas_starter_monthly');
  const id = result.checkoutInfo.sessionId!;
  const sub = subscriptions.get(id);
  sub.status = 'ACTIVE';
  const provider = new PayPalProvider({
    clientId: 'test-placeholder',
    clientSecret: 'test-placeholder',
    webhookId: 'test-webhook',
    environment: 'sandbox',
  });
  const event = await provider.getPaymentEvent({
    req: new Request('http://localhost/', {
      method: 'POST',
      headers: {
        'paypal-auth-algo': 'SHA256withRSA',
        'paypal-cert-url': 'https://api.paypal.com/cert/test',
        'paypal-transmission-id': 'test-id',
        'paypal-transmission-sig': 'test-signature',
        'paypal-transmission-time': new Date().toISOString(),
      },
      body: JSON.stringify({
        event_type: 'PAYMENT.SALE.COMPLETED',
        resource: {
          id: 'SALE-JAN31',
          state: 'completed',
          billing_agreement_id: id,
          amount: { total: '19.00', currency: 'USD' },
          create_time: '2026-01-31T12:00:00.000Z',
        },
      }),
    }),
  });
  assert.equal(
    event.paymentSession?.subscriptionInfo?.currentPeriodEnd.toISOString(),
    '2026-02-28T12:00:00.000Z'
  );
});
