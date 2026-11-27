import {
  getPricingProduct,
  listPricingProducts,
  SINGLE_VIDEO_PRODUCT_ID,
} from '@/config/pricing';
import type { StudioPaymentProvider } from '@/lib/studio-payment';

/** Advertise only enabled providers with credentials and payment notifications configured. */
export function studioPaymentProviders(
  config: Record<string, string>
): StudioPaymentProvider[] {
  const providers: StudioPaymentProvider[] = [];
  if (
    config.stripe_enabled === 'true' &&
    (config.stripe_secret_key?.trim() || config.stripe_api_key?.trim()) &&
    (config.stripe_signing_secret?.trim() ||
      config.stripe_webhook_secret?.trim())
  ) {
    providers.push('stripe');
  }
  if (
    config.paypal_enabled === 'true' &&
    config.paypal_client_id &&
    config.paypal_client_secret &&
    config.paypal_webhook_id
  ) {
    providers.push('paypal');
  }
  return providers;
}

export function studioPaymentProvider(
  config: Record<string, string>
): StudioPaymentProvider | null {
  const providers = studioPaymentProviders(config);
  return (
    providers.find((p) => p === config.default_payment_provider) ??
    providers[0] ??
    null
  );
}

/** Explicit choices must never silently become a different payment method. */
export function selectStudioPaymentProvider(
  config: Record<string, string>,
  requested: unknown
) {
  if (requested === undefined || requested === '')
    return studioPaymentProvider(config);
  const available = studioPaymentProviders(config);
  return available.find((p) => p === requested) ?? null;
}

export function studioProducts() {
  return listPricingProducts().filter(
    (p) => p.productId.startsWith('vikas_') && p.kind !== 'video_pass'
  );
}

export const studioVideoOffer = () =>
  getPricingProduct(SINGLE_VIDEO_PRODUCT_ID);
