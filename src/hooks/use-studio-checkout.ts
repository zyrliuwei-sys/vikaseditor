import { useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import type { PricingProduct } from '@/config/pricing';
import { apiGet } from '@/lib/api-client';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import {
  startStudioCheckout,
  type StudioPaymentPlans,
  type StudioPaymentProvider,
} from '@/lib/studio-payment';
import { track } from '@/lib/track';
import { getLocale } from '@/paraglide/runtime.js';

export function useStudioCheckout({
  source,
  redirect,
  cancelRedirect,
  prepare,
}: {
  source: 'pricing' | 'studio';
  redirect: string;
  cancelRedirect?: string;
  prepare?: () => Promise<void>;
}) {
  const [selectedPlan, setSelectedPlan] = useState<PricingProduct | null>(null);
  const lock = useRef(false);
  const plans = useQuery({
    queryKey: ['vikas-payment-plans'],
    queryFn: () => apiGet<StudioPaymentPlans>('/api/payment/plans'),
    staleTime: 30_000,
    retry: 1,
  });
  const checkout = useMutation({
    mutationFn: async ({
      productId,
      provider,
    }: {
      productId: string;
      provider: StudioPaymentProvider;
    }) => {
      await prepare?.();
      return startStudioCheckout(
        productId,
        provider,
        getLocale(),
        redirect,
        cancelRedirect
      );
    },
    onSuccess: (url, { productId, provider }) => {
      trackMarketingEvent('checkout_started', {
        source,
        product: productId,
        provider,
      });
      window.location.assign(url);
    },
    onError: (_, { productId, provider }) => {
      lock.current = false;
      trackMarketingEvent('checkout_error', {
        source,
        product: productId,
        provider,
      });
      void plans.refetch();
    },
  });

  function choose(plan: PricingProduct) {
    if (lock.current || !plans.data?.providers.length) return;
    checkout.reset();
    track('plan_selected', {
      source,
      product: plan.productId,
      interval: plan.type,
    });
    setSelectedPlan(plan);
  }

  return {
    plans,
    selectedPlan,
    choose,
    chooseProvider(provider: StudioPaymentProvider) {
      if (!selectedPlan || lock.current) return;
      lock.current = true;
      checkout.mutate({ productId: selectedPlan.productId, provider });
    },
    close() {
      setSelectedPlan(null);
      checkout.reset();
    },
    pendingProvider:
      checkout.isPending || checkout.isSuccess
        ? checkout.variables?.provider
        : undefined,
    checkoutError: checkout.isError,
  };
}
