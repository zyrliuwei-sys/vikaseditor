import type { PricingProduct } from '@/config/pricing';

import { apiPost } from './api-client';

export type StudioPaymentProvider = 'stripe' | 'paypal';

export interface StudioPaymentPlans {
  products: PricingProduct[];
  providers: StudioPaymentProvider[];
  /** Default provider, retained for clients loaded before the selector shipped. */
  provider: StudioPaymentProvider | null;
  videoOffer?: PricingProduct | null;
}

export async function startStudioCheckout(
  productId: string,
  provider: StudioPaymentProvider,
  locale: string,
  redirect: string,
  cancelRedirect?: string
) {
  const result = await apiPost<{
    checkout_url: string;
    payment_provider: string;
  }>('/api/payment/checkout', {
    product_id: productId,
    payment_provider: provider,
    locale,
    redirect,
    cancel_redirect: cancelRedirect,
  });
  if (result.payment_provider !== provider)
    throw new Error('Payment method changed');
  return studioCheckoutUrl(result.checkout_url, provider);
}

export function formatStudioPrice(plan: PricingProduct, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: plan.currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: plan.priceInCents % 100 === 0 ? 0 : 2,
  }).format(plan.priceInCents / 100);
}

/** Only redirect to the selected provider's hosted checkout, never a supplied lookalike. */
export function studioCheckoutUrl(
  value: string,
  provider: StudioPaymentProvider
) {
  const url = new URL(value);
  const hosts =
    provider === 'stripe'
      ? ['checkout.stripe.com']
      : ['www.paypal.com', 'www.sandbox.paypal.com'];
  if (
    url.protocol !== 'https:' ||
    !hosts.includes(url.hostname) ||
    url.username ||
    url.password ||
    url.port
  ) {
    throw new Error('Invalid checkout destination');
  }
  return url.href;
}
