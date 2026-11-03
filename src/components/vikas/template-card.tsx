import type { VikasTemplate } from '@/types/vikas';
import { ArrowUpRight, Copy, Film, Image as ImageIcon } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { VikasArtwork } from '@/components/vikas/artwork';

export function VikasTemplateCard({
  template,
  useLabel,
  detailLabel,
  typeLabel,
  href,
  detailHref,
}: {
  template: VikasTemplate;
  useLabel: string;
  detailLabel: string;
  typeLabel: string;
  href: string;
  detailHref: string;
}) {
  return (
    <article className="vikas-template-card">
      <Link
        className="vikas-template-image"
        href={href}
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
      </Link>
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
          <Link
            aria-label={`${detailLabel}: ${template.title}`}
            href={detailHref}
          >
            <Copy size={14} />
            <span>{detailLabel}</span>
          </Link>
        </div>
        <h3>
          <Link href={href}>{template.title}</Link>
        </h3>
        <p>{template.description}</p>
      </div>
    </article>
  );
}
