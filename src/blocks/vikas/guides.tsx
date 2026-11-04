import { ArrowUpRight } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import {
  GUIDE_COVERS,
  GUIDE_SLUGS,
  guidePath,
  type GuideSlug,
} from '@/config/guides';
import { m } from '@/paraglide/messages.js';

export function getGuideLabels() {
  return {
    'vikas-editor': {
      title: m['vikas.guides.editor_title'](),
      description: m['vikas.guides.editor_description'](),
      category: m['vikas.guides.editor_category'](),
    },
    'vikas-editor-logo': {
      title: m['vikas.guides.logo_title'](),
      description: m['vikas.guides.logo_description'](),
      category: m['vikas.guides.logo_category'](),
    },
    vikasheditor: {
      title: m['vikas.guides.find_title'](),
      description: m['vikas.guides.find_description'](),
      category: m['vikas.guides.find_category'](),
    },
    'vikas-editor-prompt': {
      title: m['vikas.guides.prompt_title'](),
      description: m['vikas.guides.prompt_description'](),
      category: m['vikas.guides.prompt_category'](),
    },
  };
}

export function VikasGuides({ exclude }: { exclude?: GuideSlug }) {
  const labels = getGuideLabels();
  return (
    <section
      id={exclude ? 'related-guides' : 'guides'}
      className={`vikas-section vikas-guides${exclude ? 'vikas-guides-related' : ''}`}
      aria-labelledby={exclude ? 'related-guides-title' : 'guides-title'}
    >
      <div className="vikas-section-heading">
        <div>
          <p className="vikas-eyebrow">{m['vikas.guides.eyebrow']()}</p>
          <h2 id={exclude ? 'related-guides-title' : 'guides-title'}>
            {exclude ? m['vikas.guides.related']() : m['vikas.guides.title']()}
          </h2>
        </div>
        <p className="guide-index-description">
          {m['vikas.guides.description']()}
        </p>
      </div>
      <div className="guide-card-grid">
        {GUIDE_SLUGS.filter((slug) => slug !== exclude).map((slug) => (
          <Link key={slug} href={guidePath(slug)} className="guide-card">
            <div className="guide-card-image">
              <img
                src={GUIDE_COVERS[slug]}
                alt=""
                width={720}
                height={480}
                loading="lazy"
                decoding="async"
              />
              <span>0{GUIDE_SLUGS.indexOf(slug) + 1}</span>
            </div>
            <div className="guide-card-copy">
              <p className="vikas-eyebrow">{labels[slug].category}</p>
              <h3>{labels[slug].title}</h3>
              <p>{labels[slug].description}</p>
              <span className="guide-read">
                {m['vikas.guides.read']()} <ArrowUpRight size={16} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
