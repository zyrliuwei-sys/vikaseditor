import type { PricingProduct } from '@/config/pricing';

export type StudioPaymentProvider = 'stripe' | 'paypal';

export interface StudioPaymentPlans {
  products: PricingProduct[];
  providers: StudioPaymentProvider[];
  /** Default provider, retained for clients loaded before the selector shipped. */
  provider: StudioPaymentProvider | null;
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
