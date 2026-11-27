import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { MediaMode, StudioSelection, VikasTemplate } from '@/types/vikas';

import { m } from '@/paraglide/messages.js';
import {
  VikasIntroduction,
  VikasPromptGuide,
  VikasStyleGuide,
} from '@/blocks/vikas/editorial';
import { VikasGallery } from '@/blocks/vikas/gallery';
import { VikasGuides } from '@/blocks/vikas/guides';
import { VikasHero } from '@/blocks/vikas/hero';
import {
  VikasFAQ,
  VikasHowItWorks,
  VikasVideoStory,
} from '@/blocks/vikas/story';
import { getVikasTemplates } from '@/blocks/vikas/templates';

const VikasStudio = lazy(() =>
  import('@/blocks/vikas/studio').then((m) => ({ default: m.VikasStudio }))
);

export function VikasHome() {
  const templates = getVikasTemplates();
  const [studioVisible, setStudioVisible] = useState(false);
  const studioRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (
      window.location.hash === '#studio' ||
      !('IntersectionObserver' in window)
    ) {
      setStudioVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setStudioVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px' }
    );
    if (studioRef.current) observer.observe(studioRef.current);
    return () => observer.disconnect();
  }, []);
  const [selection, setSelection] = useState<StudioSelection>({
    mode: 'image',
    templateId: templates[0].id,
    revision: 0,
  });
  function revealStudio() {
    setStudioVisible(true);
    requestAnimationFrame(() => {
      const studio = document.getElementById('studio');
      studio?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
        block: 'start',
      });
    });
  }
  function create(mode: MediaMode, prompt?: string) {
    setSelection((s) => ({
      mode,
      prompt,
      revision: s.revision + 1,
    }));
    revealStudio();
  }
  function selectTemplate(template: VikasTemplate) {
    setSelection((s) => ({
      mode: template.mediaType,
      templateId: template.id,
      prompt: template.prompt,
      revision: s.revision + 1,
    }));
    revealStudio();
  }
  return (
    <>
      <VikasHero templates={templates} onTemplate={selectTemplate} />
      <div ref={studioRef}>
        <Suspense fallback={<StudioPlaceholder />}>
          {studioVisible ? (
            <VikasStudio templates={templates} selection={selection} />
          ) : (
            <StudioPlaceholder onOpen={() => setStudioVisible(true)} />
          )}
        </Suspense>
      </div>
      <VikasGallery templates={templates} />
      <VikasHowItWorks />
      <VikasVideoStory onCreate={() => selectTemplate(templates[7])} />
      <VikasIntroduction />
      <VikasStyleGuide />
      <VikasPromptGuide onUse={(prompt) => create('image', prompt)} />
      <VikasGuides />
      <VikasFAQ />
    </>
  );
}

function StudioPlaceholder({ onOpen }: { onOpen?: () => void }) {
  return (
    <section id="studio" className="vikas-studio-placeholder">
      <h2>{m['vikas.studio.title']()}</h2>
      <p>{m['vikas.studio.subtitle']()}</p>
      {onOpen ? (
        <button type="button" className="vikas-button" onClick={onOpen}>
          {m['vikas.nav.start']()}
        </button>
      ) : (
        <p role="status">{m['common.loading']()}</p>
      )}
    </section>
  );
}
