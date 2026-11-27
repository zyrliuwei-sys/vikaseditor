import { trackClarityEvent } from './clarity';

type MarketingProperty = string | number | boolean;

type Plausible = (
  event: string,
  options?: { props?: Record<string, MarketingProperty> }
) => void;

declare global {
  interface Window {
    plausible?: Plausible;
  }
}

/** Anonymous funnel events; analytics must never block the product flow. */
export function trackMarketingEvent(
  event: string,
  props?: Record<string, MarketingProperty>
) {
  if (typeof window === 'undefined') return;
  try {
    window.plausible?.(event, props ? { props } : undefined);
  } catch {
    // Analytics must never break creation or navigation.
  }
  try {
    trackClarityEvent(event);
  } catch {
    // The replay script is optional too.
  }
}
