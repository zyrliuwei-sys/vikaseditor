import type { MediaMode } from '@/types/vikas';

import { m } from '@/paraglide/messages.js';
import { VikasStudio } from '@/blocks/vikas/studio';
import { getVikasTemplates } from '@/blocks/vikas/templates';

export function VikasCreate({ mode = 'image' }: { mode?: MediaMode }) {
  const templates = getVikasTemplates();
  return (
    <div className="vikas-create-page">
      <div className="vikas-create-heading">
        <div>
          <p className="vikas-eyebrow">{m['vikas.nav.studio']()}</p>
          <h1>{m['vikas.create.title']()}</h1>
          <p>{m['vikas.create.description']()}</p>
        </div>
        <div className="vikas-create-mark">
          <img src="/logo.svg" alt="" width="64" height="64" />
          <span>{m['vikas.create.note']()}</span>
        </div>
      </div>
      <VikasStudio
        templates={templates}
        selection={{
          mode,
          templateId: mode === 'video' ? 'cinematic-push' : 'golden-hour',
          revision: mode === 'video' ? 1 : 0,
        }}
      />
    </div>
  );
}
