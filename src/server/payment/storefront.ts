import { listPricingProducts } from '@/config/pricing';

/** Vikas uses PayPal for both one-time orders and monthly subscriptions. */
export function studioPaymentProvider(config: Record<string, string>) {
  return config.paypal_enabled === 'true' &&
    config.paypal_client_id &&
    config.paypal_client_secret &&
    config.paypal_webhook_id
    ? 'paypal'
    : null;
}

export function studioProducts() {
  return listPricingProducts().filter((p) => p.productId.startsWith('vikas_'));
}
