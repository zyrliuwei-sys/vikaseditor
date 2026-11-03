import type { VikasTemplate } from '@/types/vikas';
import { ArrowUpRight, Copy, Film, Image as ImageIcon } from 'lucide-react';

import { VikasArtwork } from '@/components/vikas/artwork';

export function VikasTemplateCard({
  template,
  useLabel,
  detailLabel,
  typeLabel,
  onUse,
  onDetails,
}: {
  template: VikasTemplate;
  useLabel: string;
  detailLabel: string;
  typeLabel: string;
  onUse: () => void;
  onDetails: () => void;
}) {
  return (
    <article className="vikas-template-card">
      <button
        className="vikas-template-image"
        onClick={onUse}
        aria-label={`${useLabel}: ${template.title}`}
      >
        <VikasArtwork
          index={template.artwork}
          alt={`${template.title}. ${template.description}`}
        />
        {template.mediaType === 'video' && (
          <span className="vikas-video-card-mark">
            <Film size={25} />
          </span>
        )}
        <span className="vikas-card-action">
          {useLabel}
          <ArrowUpRight size={17} />
        </span>
      </button>
      <div className="vikas-card-caption">
        <div className="vikas-card-meta">
          <span>
            {template.mediaType === 'video' ? (
              <Film size={13} />
            ) : (
              <ImageIcon size={13} />
            )}
            {typeLabel}
          </span>
          <button
            aria-label={`${detailLabel}: ${template.title}`}
            onClick={onDetails}
          >
            <Copy size={14} />
            <span>{detailLabel}</span>
          </button>
        </div>
        <h3>{template.title}</h3>
        <p>{template.description}</p>
      </div>
    </article>
  );
}
