/**
 * Authoritative pricing catalog.
 *
 * The checkout API uses this as the SOURCE OF TRUTH for price/credits/duration.
 * Any price, credits, or plan info sent by the client is IGNORED — only the
 * product_id is honored, and everything else is looked up here.
 *
 * To change pricing, edit this file and redeploy. Admin UI cannot alter prices.
 */

import { PaymentInterval, PaymentType } from '@/core/payment/types';

export type PricingPlanInfo = {
  name: string;
  interval: PaymentInterval;
  intervalCount: number;
};

export type PricingProduct = {
  productId: string;
  productName: string;
  planName: string;
  description: string;
  type: PaymentType;
  priceInCents: number;
  currency: string;
  /**
   * Price in fen for CNY-only providers (Alipay, WeChat Pay) when `currency`
   * isn't CNY. Without it those providers refuse the product — the amount is
   * never reused across currencies.
   */
  cnyPriceInCents?: number;
  credits: number;
  creditsValidDays?: number;
  plan?: PricingPlanInfo;
  /**
   * 'guest_post': a guest post package. Sold only through
   * /api/guest-posts/$id/checkout (tied to an approved submission); the
   * generic checkout refuses it.
   */
  kind?: 'guest_post';
  /** Guest post packages: most external links the article may contain. */
  maxLinks?: number;
};

/** Vikas v1: 100 credits = USD 1. No bonus credits that dilute the 8× rate. */
export const pricingCatalog: Record<string, PricingProduct> = {
  vikas_starter_once: {
    productId: 'vikas_starter_once',
    productName: 'Vikas Starter',
    planName: 'Starter',
    description: 'Vikas Starter — 900 credits',
    type: PaymentType.ONE_TIME,
    priceInCents: 900,
    currency: 'usd',
    credits: 900,
    creditsValidDays: 0,
  },
  vikas_creator_once: {
    productId: 'vikas_creator_once',
    productName: 'Vikas Creator',
    planName: 'Creator',
    description: 'Vikas Creator — 2,900 credits',
    type: PaymentType.ONE_TIME,
    priceInCents: 2900,
    currency: 'usd',
    credits: 2900,
    creditsValidDays: 0,
  },
  vikas_studio_once: {
    productId: 'vikas_studio_once',
    productName: 'Vikas Studio',
    planName: 'Studio',
    description: 'Vikas Studio — 7,900 credits',
    type: PaymentType.ONE_TIME,
    priceInCents: 7900,
    currency: 'usd',
    credits: 7900,
    creditsValidDays: 0,
  },
  vikas_starter_monthly: {
    productId: 'vikas_starter_monthly',
    productName: 'Vikas Starter',
    planName: 'Starter',
    description: 'Vikas Starter — 1,900 credits/month',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 1900,
    currency: 'usd',
    credits: 1900,
    creditsValidDays: 31,
    plan: {
      name: 'Starter',
      interval: PaymentInterval.MONTH,
      intervalCount: 1,
    },
  },
  vikas_creator_monthly: {
    productId: 'vikas_creator_monthly',
    productName: 'Vikas Creator',
    planName: 'Creator',
    description: 'Vikas Creator — 4,900 credits/month',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 4900,
    currency: 'usd',
    credits: 4900,
    creditsValidDays: 31,
    plan: {
      name: 'Creator',
      interval: PaymentInterval.MONTH,
      intervalCount: 1,
    },
  },
  vikas_studio_monthly: {
    productId: 'vikas_studio_monthly',
    productName: 'Vikas Studio',
    planName: 'Studio',
    description: 'Vikas Studio — 9,900 credits/month',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 9900,
    currency: 'usd',
    credits: 9900,
    creditsValidDays: 31,
    plan: { name: 'Studio', interval: PaymentInterval.MONTH, intervalCount: 1 },
  },
  // Guest posts (see src/modules/guest-posts). Published permanently, every
  // external link rendered rel="sponsored nofollow".
  guest_post_standard: {
    productId: 'guest_post_standard',
    productName: 'Guest Post',
    planName: 'Standard',
    description: 'Guest post (1 link)',
    type: PaymentType.ONE_TIME,
    priceInCents: 9900,
    currency: 'usd',
    cnyPriceInCents: 69900,
    credits: 0,
    kind: 'guest_post',
    maxLinks: 1,
  },
  guest_post_premium: {
    productId: 'guest_post_premium',
    productName: 'Guest Post',
    planName: 'Premium',
    description: 'Guest post (3 links)',
    type: PaymentType.ONE_TIME,
    priceInCents: 19900,
    currency: 'usd',
    cnyPriceInCents: 139900,
    credits: 0,
    kind: 'guest_post',
    maxLinks: 3,
  },
};

export function getPricingProduct(productId: string): PricingProduct | null {
  if (!productId) return null;
  return Object.hasOwn(pricingCatalog, productId)
    ? pricingCatalog[productId]
    : null;
}

export function listPricingProducts(): PricingProduct[] {
  return Object.values(pricingCatalog);
}

export function listGuestPostPackages(): PricingProduct[] {
  return listPricingProducts().filter((p) => p.kind === 'guest_post');
}
