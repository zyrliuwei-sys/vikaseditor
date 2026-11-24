import { useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { GenerationCapabilities } from '@/types/vikas';
import { ArrowRight, Film, Image as ImageIcon } from 'lucide-react';

import { useSession } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
import type { PricingProduct } from '@/config/pricing';
import { apiGet, apiPost } from '@/lib/api-client';
import {
  studioCheckoutUrl,
  type StudioPaymentPlans,
  type StudioPaymentProvider,
} from '@/lib/studio-payment';
import { track } from '@/lib/track';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { VikasArtwork } from '@/components/vikas/artwork';
import { VikasPaymentDialog } from '@/components/vikas/payment-dialog';
import { VikasPricingCards } from '@/components/vikas/pricing-cards';

export function VikasCredits() {
  const [billing, setBilling] = useState<'one-time' | 'subscription'>(
    'one-time'
  );
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PricingProduct | null>(null);
  const checkoutLock = useRef(false);
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
      const result = await apiPost<{
        checkout_url: string;
        payment_provider: string;
      }>('/api/payment/checkout', {
        product_id: productId,
        payment_provider: provider,
        locale: getLocale(),
        redirect: '/create?payment=success',
      });
      if (result.payment_provider !== provider)
        throw new Error('Payment method changed');
      return studioCheckoutUrl(result.checkout_url, provider);
    },
    onSuccess: (url) => window.location.assign(url),
    onError: () => {
      checkoutLock.current = false;
      void plans.refetch();
    },
  });
  function buy(id: string) {
    if (!session?.user) {
      router.push('/sign-in?callbackUrl=%2Fpricing');
      return;
    }
    const plan = plans.data?.products.find((p) => p.productId === id);
    if (!plan || checkoutLock.current) return;
    checkout.reset();
    track('plan_selected', { product: id, interval: billing });
    setSelectedPlan(plan);
  }
  function chooseProvider(provider: StudioPaymentProvider) {
    if (!selectedPlan || checkoutLock.current) return;
    checkoutLock.current = true;
    checkout.mutate({ productId: selectedPlan.productId, provider });
  }
  function formatPrice(plan: PricingProduct) {
    return new Intl.NumberFormat(getLocale(), {
      style: 'currency',
      currency: plan.currency,
      maximumFractionDigits: 0,
    }).format(plan.priceInCents / 100);
  }
  const config = useQuery({
    queryKey: ['vikas-generation-config'],
    queryFn: () => apiGet<GenerationCapabilities>('/api/generations/config'),
    staleTime: 60_000,
    retry: 1,
  });
  const formats = [
    {
      title: m['vikas.credits.image'](),
      description: m['vikas.credits.image_detail'](),
      cost: config.data?.imageCredits,
      icon: ImageIcon,
      artwork: 1,
    },
    {
      title: m['vikas.credits.video'](),
      description: m['vikas.credits.video_detail'](),
      cost: config.data?.videoCredits,
      icon: Film,
      artwork: 2,
    },
  ];
  return (
    <div className="vikas-credits-page">
      <div className="vikas-credits-heading">
        <p className="vikas-eyebrow">{m['vikas.footer.credits']()}</p>
        <h1>{m['vikas.credits.title']()}</h1>
        <p>{m['vikas.credits.description']()}</p>
      </div>
      <div className="vikas-pricing-trial">
        <span>{m['vikas.pricing.free']()}</span>
        <Link href="/create/image">
          {m['vikas.pricing.try_free']()} <ArrowRight size={15} />
        </Link>
      </div>
      <div
        className="vikas-billing-tabs"
        role="group"
        aria-label={m['vikas.pricing.billing_label']()}
      >
        <button
          type="button"
          aria-pressed={billing === 'one-time'}
          onClick={() => setBilling('one-time')}
        >
          {m['vikas.pricing.once']()}
        </button>
        <button
          type="button"
          aria-pressed={billing === 'subscription'}
          onClick={() => setBilling('subscription')}
        >
          {m['vikas.pricing.monthly']()}
        </button>
      </div>
      <p className="vikas-pricing-rate">{m['vikas.pricing.rate']()}</p>
      {plans.isPending && <p role="status">{m['vikas.pricing.loading']()}</p>}
      {plans.isError && (
        <p role="alert" className="vikas-credit-status">
          {m['vikas.pricing.load_error']()}{' '}
          <button onClick={() => void plans.refetch()}>
            {m['vikas.studio.retry']()}
          </button>
        </p>
      )}
      {plans.data && (
        <VikasPricingCards
          busyId={checkout.isPending ? checkout.variables.productId : undefined}
          disabled={sessionPending || !plans.data.providers.length}
          onChoose={buy}
          cards={plans.data.products
            .filter((p) => p.type === billing)
            .map((p, index) => ({
              id: p.productId,
              name: [
                m['vikas.pricing.starter'](),
                m['vikas.pricing.creator'](),
                m['vikas.pricing.studio'](),
              ][index],
              price: formatPrice(p),
              period:
                billing === 'subscription'
                  ? m['vikas.pricing.per_month']()
                  : m['vikas.pricing.one_payment'](),
              credits: m['vikas.pricing.credit_amount']({
                count: p.credits.toLocaleString(getLocale()),
              }),
              badge: index === 1 ? m['vikas.pricing.popular']() : undefined,
              button: !plans.data.providers.length
                ? m['vikas.pricing.unavailable_button']()
                : !session?.user
                  ? m['vikas.pricing.sign_in']()
                  : billing === 'subscription'
                    ? m['vikas.pricing.subscribe']()
                    : m['vikas.pricing.buy'](),
              details: [
                m['vikas.pricing.equivalent']({
                  images: Math.floor(
                    p.credits / (config.data?.imageCredits || 51)
                  ),
                  videos: Math.floor(
                    p.credits / (config.data?.videoCredits || 796)
                  ),
                }),
                m['vikas.pricing.all_models'](),
                billing === 'subscription'
                  ? m['vikas.pricing.month_expiry']()
                  : m['vikas.pricing.no_expiry'](),
                billing === 'subscription'
                  ? m['vikas.pricing.cancel']()
                  : m['vikas.pricing.no_renewal'](),
              ],
            }))}
        />
      )}
      {plans.data && !plans.data.providers.length && (
        <p className="vikas-credit-status" role="status">
          {m['vikas.pricing.unavailable']()}
        </p>
      )}
      <VikasPaymentDialog
        open={Boolean(selectedPlan)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPlan(null);
            checkout.reset();
          }
        }}
        title={m['common.pricing.choose_payment']()}
        description={m['vikas.pricing.choose_provider_hint']()}
        planName={selectedPlan?.productName ?? ''}
        price={
          selectedPlan
            ? `${formatPrice(selectedPlan)} ${selectedPlan.type === 'subscription' ? m['vikas.pricing.per_month']() : m['vikas.pricing.one_payment']()}`
            : ''
        }
        credits={m['vikas.pricing.credit_amount']({
          count: (selectedPlan?.credits ?? 0).toLocaleString(getLocale()),
        })}
        terms={
          selectedPlan?.type === 'subscription'
            ? m['vikas.pricing.month_terms']()
            : m['vikas.pricing.once_terms']()
        }
        options={(plans.data?.providers ?? []).map((id) => ({
          id,
          label: id === 'stripe' ? m['vikas.pricing.stripe']() : 'PayPal',
          description:
            id === 'stripe'
              ? m['vikas.pricing.stripe_hint']()
              : m['vikas.pricing.paypal_hint'](),
        }))}
        pendingProvider={
          checkout.isPending || checkout.isSuccess
            ? checkout.variables?.provider
            : undefined
        }
        error={
          checkout.isError ? m['vikas.pricing.checkout_error']() : undefined
        }
        onSelect={chooseProvider}
      />
      <p className="vikas-pricing-terms">
        {billing === 'subscription'
          ? m['vikas.pricing.month_terms']()
          : m['vikas.pricing.once_terms']()}
      </p>
      <div className="vikas-credits-grid">
        {formats.map((format) => (
          <article className="vikas-credit-card" key={format.title}>
            <div className="vikas-credit-detail">
              <format.icon size={24} />
              <h2>{format.title}</h2>
              <p className="vikas-credit-number">
                <strong>{format.cost ?? '…'}</strong>
                {m['vikas.credits.unit']()}
              </p>
              <small>{m['vikas.credits.label']()}</small>
              <p>{format.description}</p>
            </div>
            <div className="vikas-credit-art">
              <VikasArtwork index={format.artwork} alt="" />
            </div>
          </article>
        ))}
      </div>
      <div className="vikas-credit-explainer">
        <h2>{m['vikas.credits.note_title']()}</h2>
        <p>{m['vikas.credits.note']()}</p>
      </div>
      {config.isError && (
        <p className="vikas-credit-status" role="status">
          {m['vikas.studio.config_error']()}{' '}
          <button onClick={() => void config.refetch()}>
            {m['vikas.studio.retry']()}
          </button>
        </p>
      )}
      {config.data && !config.data.configured && (
        <p className="vikas-credit-status">
          {m['vikas.studio.configuration_hint']()}
        </p>
      )}
      <div className="vikas-credit-links">
        <Link href="/create" className="vikas-button">
          {m['vikas.nav.start']()}
          <ArrowRight size={16} />
        </Link>
        <Link href="/settings/credits" className="vikas-button-secondary">
          {m['vikas.credits.balance']()}
        </Link>
      </div>
    </div>
  );
}
