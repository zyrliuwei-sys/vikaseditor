import { formatStudioPrice } from '@/lib/studio-payment';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import type { useStudioCheckout } from '@/hooks/use-studio-checkout';
import { VikasPaymentDialog } from '@/components/vikas/payment-dialog';

export function StudioPaymentDialog({
  payment,
}: {
  payment: ReturnType<typeof useStudioCheckout>;
}) {
  const plan = payment.selectedPlan;
  const video = plan?.kind === 'video_pass';
  const monthly = plan?.type === 'subscription';
  return (
    <VikasPaymentDialog
      open={Boolean(plan)}
      onOpenChange={(open) => {
        if (!open) payment.close();
      }}
      title={m['common.pricing.choose_payment']()}
      description={m['vikas.pricing.choose_provider_hint']()}
      planName={
        video ? m['vikas.pricing.single_video']() : (plan?.productName ?? '')
      }
      price={
        plan
          ? `${formatStudioPrice(plan, getLocale())} ${monthly ? m['vikas.pricing.per_month']() : m['vikas.pricing.one_payment']()}`
          : ''
      }
      credits={
        video
          ? m['vikas.pricing.single_video_allowance']()
          : m['vikas.pricing.credit_amount']({
              count: (plan?.credits ?? 0).toLocaleString(getLocale()),
            })
      }
      terms={
        video
          ? m['vikas.pricing.single_video_terms']()
          : monthly
            ? m['vikas.pricing.month_terms']()
            : m['vikas.pricing.once_terms']()
      }
      options={(payment.plans.data?.providers ?? []).map((id) => ({
        id,
        label: id === 'stripe' ? m['vikas.pricing.stripe']() : 'PayPal',
        description:
          id === 'stripe'
            ? m['vikas.pricing.stripe_hint']()
            : m['vikas.pricing.paypal_hint'](),
      }))}
      pendingProvider={payment.pendingProvider}
      error={
        payment.checkoutError ? m['vikas.pricing.checkout_error']() : undefined
      }
      onSelect={payment.chooseProvider}
    />
  );
}
