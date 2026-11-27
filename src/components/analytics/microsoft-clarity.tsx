import { useLayoutEffect, useRef } from 'react';
import { useRouter } from '@tanstack/react-router';

import {
  isClarityPage,
  loadClarityTag,
  setClarityConsent,
  withdrawClarityConsent,
} from '@/lib/clarity';
import type { CookieConsent } from '@/lib/cookie-consent';
import { safeEmbedSetting } from '@/lib/embed-ids';
import { deLocalizeHref } from '@/paraglide/runtime.js';

export function MicrosoftClarity({
  projectId,
  pathname,
  consent,
}: {
  projectId: string;
  pathname: string;
  consent: CookieConsent;
}) {
  const router = useRouter();
  const tag = useRef<HTMLScriptElement | null>(null);
  const running = useRef(false);

  useLayoutEffect(() => {
    function stop() {
      if (!running.current) return;
      window.clarity?.('stop');
      running.current = false;
    }
    // Stop before a private route can replace the public page's DOM.
    const unsubscribe = router.subscribe(
      'onBeforeNavigate',
      ({ toLocation }) => {
        if (!isClarityPage(deLocalizeHref(toLocation.pathname))) stop();
      }
    );
    return () => {
      unsubscribe();
      stop();
    };
  }, [router]);

  useLayoutEffect(() => {
    const id = safeEmbedSetting('clarity_project_id', projectId);
    if (
      tag.current &&
      (consent === 'rejected' || tag.current.dataset.projectId !== id)
    ) {
      tag.current.remove();
      tag.current = null;
      running.current = false;
      withdrawClarityConsent();
      return;
    }

    const allowed =
      id &&
      consent === 'accepted' &&
      isClarityPage(pathname) &&
      navigator.doNotTrack !== '1' &&
      !(navigator as Navigator & { globalPrivacyControl?: boolean })
        .globalPrivacyControl;

    if (!allowed) {
      if (running.current) window.clarity?.('stop');
      running.current = false;
      return;
    }
    if (running.current) return;

    running.current = true;
    if (tag.current) {
      window.clarity?.('start');
      setClarityConsent('granted');
      return;
    }
    const script = loadClarityTag(id);
    script.dataset.projectId = id;
    tag.current = script;
    script.addEventListener(
      'error',
      () => {
        script.remove();
        tag.current = null;
        running.current = false;
      },
      { once: true }
    );
  }, [consent, pathname, projectId]);

  return null;
}
