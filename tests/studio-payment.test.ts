import assert from 'node:assert/strict';
import { test } from 'node:test';

import { studioCheckoutUrl } from '../src/lib/studio-payment';
import {
  selectStudioPaymentProvider,
  studioPaymentProvider,
  studioPaymentProviders,
} from '../src/server/payment/storefront';

const config = {
  stripe_enabled: 'true',
  stripe_secret_key: 'test-placeholder',
  stripe_signing_secret: 'test-placeholder',
  paypal_enabled: 'true',
  paypal_client_id: 'test-placeholder',
  paypal_client_secret: 'test-placeholder',
  paypal_webhook_id: 'test-placeholder',
  default_payment_provider: 'stripe',
};
test('both configured providers are available and explicit choice wins over default', () => {
  assert.deepEqual(studioPaymentProviders(config), ['stripe', 'paypal']);
  assert.equal(studioPaymentProvider(config), 'stripe');
  for (const provider of ['stripe', 'paypal'])
    assert.equal(selectStudioPaymentProvider(config, provider), provider);
  assert.equal(selectStudioPaymentProvider(config, undefined), 'stripe');
  for (const invalid of [null, {}, 'creem', 'Stripe', 42])
    assert.equal(selectStudioPaymentProvider(config, invalid), null);
});
test('disabled or incomplete provider cannot be selected or silently replaced', () => {
  for (const key of [
    'stripe_enabled',
    'stripe_secret_key',
    'stripe_signing_secret',
  ]) {
    const c = { ...config, [key]: '' };
    assert.deepEqual(studioPaymentProviders(c), ['paypal']);
    assert.equal(selectStudioPaymentProvider(c, 'stripe'), null);
  }
  for (const key of [
    'paypal_enabled',
    'paypal_client_id',
    'paypal_client_secret',
    'paypal_webhook_id',
  ]) {
    const c = { ...config, [key]: '' };
    assert.deepEqual(studioPaymentProviders(c), ['stripe']);
    assert.equal(selectStudioPaymentProvider(c, 'paypal'), null);
  }
  assert.deepEqual(
    studioPaymentProviders({
      stripe_enabled: 'true',
      stripe_api_key: 'test',
      stripe_webhook_secret: 'test',
    }),
    ['stripe']
  );
  assert.equal(studioPaymentProvider({}), null);
});
test('redirect must match selected provider and a trusted HTTPS host', () => {
  assert.equal(
    studioCheckoutUrl('https://checkout.stripe.com/c/pay/test', 'stripe'),
    'https://checkout.stripe.com/c/pay/test'
  );
  for (const host of ['www.paypal.com', 'www.sandbox.paypal.com'])
    assert.ok(
      studioCheckoutUrl(`https://${host}/checkoutnow?token=test`, 'paypal')
    );
  for (const url of [
    'https://www.paypal.com/',
    'https://checkout.stripe.com.evil.test/',
    'http://checkout.stripe.com/',
    'https://user@checkout.stripe.com/',
    'https://checkout.stripe.com:444/',
    'javascript:alert(1)',
  ])
    assert.throws(() => studioCheckoutUrl(url, 'stripe'));
  assert.throws(() =>
    studioCheckoutUrl('https://checkout.stripe.com/', 'paypal')
  );
});
