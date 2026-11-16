import { useEffect } from 'react';
import type { MediaMode } from '@/types/vikas';

import { Link } from '@/core/i18n/navigation';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { VikasStudio } from '@/blocks/vikas/studio';
import { getVikasTemplates } from '@/blocks/vikas/templates';

export function VikasCreate({
  mode = 'image',
  entry,
  templateId,
  onModeChange,
}: {
  mode?: MediaMode;
  entry?: MediaMode;
  templateId?: string;
  onModeChange?: (mode: MediaMode) => void;
}) {
  useEffect(() => {
    trackMarketingEvent('studio_viewed', { mode });
  }, [mode]);

  const templates = getVikasTemplates();
  const template =
    templates.find(
      (item) => item.id === templateId && item.mediaType === mode
    ) ?? templates.find((item) => item.mediaType === mode)!;
  return (
    <div className="vikas-create-page">
      <div className="vikas-create-heading">
        <div>
          <p className="vikas-eyebrow">{m['vikas.nav.studio']()}</p>
          <h1>
            {getLocale() === 'en' && entry
              ? entry === 'image'
                ? 'AI Photo Editor'
                : 'Photo to Video AI'
              : m['vikas.create.title']()}
          </h1>
          <p>{m['vikas.create.description']()}</p>
          <p className="vikas-create-free-note">
            {m['vikas.create.free_note']()}
          </p>
          {!entry && getLocale() === 'en' && (
            <p className="vikas-create-links">
              Choose the <Link href="/create/image">AI photo editor</Link> or
              explore <Link href="/create/video">photo to video AI</Link>.
            </p>
          )}
        </div>
        <div className="vikas-create-mark">
          <img src="/logo.svg" alt="" width="64" height="64" />
          <span>{m['vikas.create.note']()}</span>
        </div>
      </div>
      <VikasStudio
        onModeChange={onModeChange}
        templates={templates}
        selection={{
          mode,
          templateId: template.id,
          revision: templates.findIndex((item) => item.id === template.id),
        }}
      />
    </div>
  );
}
