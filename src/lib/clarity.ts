import { readCookieConsent } from './cookie-consent';

const CONVERSION_EVENTS = new Set([
  'hero_free_image_clicked',
  'template_cta_clicked',
  'studio_viewed',
  'generation_started',
  'generation_succeeded',
  'animate_result_clicked',
  'paywall_viewed',
  'pricing_viewed',
  'purchase_cta_clicked',
  'checkout_started',
  'checkout_returned',
  'checkout_canceled',
]);

type ConsentStatus = 'granted' | 'denied';
type ClarityCall =
  | [command: 'start' | 'stop']
  | [command: 'event', name: string]
  | [
      command: 'consentv2',
      options: { analytics_Storage: ConsentStatus; ad_Storage: 'denied' },
    ];

type Clarity = {
  (...call: ClarityCall): void;
  q?: ClarityCall[];
  v?: string;
};

declare global {
  interface Window {
    clarity?: Clarity;
  }
}

export function isClarityPage(pathname: string): boolean {
  pathname = pathname.replace(/\/+$/, '') || '/';
  return (
    ['/', '/pricing', '/create', '/create/image', '/create/video'].includes(
      pathname
    ) || pathname.startsWith('/template/')
  );
}

export function setClarityConsent(status: ConsentStatus) {
  window.clarity?.('consentv2', {
    analytics_Storage: status,
    ad_Storage: 'denied',
  });
}

export function loadClarityTag(projectId: string) {
  const queue: Clarity = (...call) => (queue.q ??= []).push(call);
  window.clarity ??= queue;
  setClarityConsent('granted');

  const script = document.createElement('script');
  script.id = 'microsoft-clarity';
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${projectId}`;
  document.head.append(script);
  return script;
}

export function withdrawClarityConsent() {
  setClarityConsent('denied');
  window.clarity?.('stop');
  // A previously stopped instance cannot clear its cookies through ConsentV2.
  for (const name of ['_clck', '_clsk']) {
    document.cookie = `${name}=; Path=/; Max-Age=0`;
    document.cookie = `${name}=; Path=/; Max-Age=0; Domain=${location.hostname}`;
  }
  try {
    sessionStorage.removeItem('_cltk');
  } catch {
    // Storage can be blocked independently of cookies.
  }
  // Microsoft restarts the SDK in cookieless mode after a denial. A new
  // document with a rejected choice leaves the tag out entirely.
  window.location.reload();
}

export function trackClarityEvent(event: string) {
  if (
    typeof window !== 'undefined' &&
    window.clarity?.v &&
    CONVERSION_EVENTS.has(event) &&
    readCookieConsent() === 'accepted'
  ) {
    window.clarity('event', event);
  }
}
