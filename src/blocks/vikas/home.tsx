import { useState } from 'react';
import type { MediaMode, StudioSelection, VikasTemplate } from '@/types/vikas';

import {
  VikasIntroduction,
  VikasPromptGuide,
  VikasStyleGuide,
} from '@/blocks/vikas/editorial';
import { VikasGallery } from '@/blocks/vikas/gallery';
import { VikasHero } from '@/blocks/vikas/hero';
import {
  VikasFAQ,
  VikasHowItWorks,
  VikasVideoStory,
} from '@/blocks/vikas/story';
import { VikasStudio } from '@/blocks/vikas/studio';
import { getVikasTemplates } from '@/blocks/vikas/templates';

export function VikasHome() {
  const templates = getVikasTemplates();
  const [selection, setSelection] = useState<StudioSelection>({
    mode: 'image',
    templateId: templates[0].id,
    revision: 0,
  });
  function revealStudio() {
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
  function create(mode: MediaMode, prompt?: string, upload?: boolean) {
    setSelection((s) => ({
      mode,
      prompt,
      templateId: upload
        ? templates.find((template) => template.mediaType === mode)?.id
        : undefined,
      revision: s.revision + 1,
    }));
    revealStudio();
    if (upload) {
      (
        document.getElementById('vikas-photo') as HTMLInputElement | null
      )?.click();
    }
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
      <VikasHero
        templates={templates}
        onCreate={create}
        onTemplate={selectTemplate}
      />
      <VikasGallery templates={templates} onTemplate={selectTemplate} />
      <VikasStudio templates={templates} selection={selection} />
      <VikasHowItWorks />
      <VikasVideoStory onCreate={() => selectTemplate(templates[7])} />
      <VikasIntroduction />
      <VikasStyleGuide />
      <VikasPromptGuide onUse={(prompt) => create('image', prompt)} />
      <VikasFAQ />
    </>
  );
}
