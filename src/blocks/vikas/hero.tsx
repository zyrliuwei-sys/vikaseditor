import type { VikasTemplate } from '@/types/vikas';
import { ArrowRight, ArrowUpRight, ImagePlus } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { m } from '@/paraglide/messages.js';
import { VikasArtwork } from '@/components/vikas/artwork';

export function VikasHero({
  templates,
  onTemplate,
}: {
  templates: VikasTemplate[];
  onTemplate: (template: VikasTemplate) => void;
}) {
  return (
    <section className="vikas-hero" aria-labelledby="vikas-hero-title">
      <div className="vikas-hero-layout">
        <div className="vikas-hero-content">
          <p className="vikas-eyebrow">{m['vikas.hero.eyebrow']()}</p>
          <h1 id="vikas-hero-title">
            {m['vikas.hero.title1']()} <span>{m['vikas.hero.title2']()}</span>
          </h1>
          <p className="vikas-hero-description">
            {m['vikas.hero.description']()}
          </p>
          <div className="vikas-hero-actions">
            <Link
              href="/create/image#studio"
              className="vikas-button"
              onClick={() => {
                trackMarketingEvent('hero_free_image_clicked', {
                  mode: 'image',
                });
              }}
            >
              <ImagePlus size={18} />
              {m['vikas.hero.upload']()}
            </Link>
            <a href="#templates" className="vikas-hero-explore">
              {m['vikas.nav.templates']()}
              <ArrowRight size={17} />
            </a>
          </div>
          <p className="vikas-hero-free-note">{m['vikas.hero.free_note']()}</p>
        </div>
        <div className="vikas-hero-art">
          <div className="vikas-art-label">
            <span>{m['vikas.hero.collection']()}</span>
            <span>{m['vikas.gallery.example']()}</span>
          </div>
          <div className="vikas-contact-sheet">
            <button
              className="vikas-portrait-main"
              onClick={() => onTemplate(templates[1])}
              aria-label={`${templates[1].title}: ${m['vikas.gallery.use']()}`}
            >
              <VikasArtwork
                priority
                index={1}
                alt={m['vikas.hero.featured_alt']()}
              />
              <span className="vikas-portrait-caption">
                {m['vikas.hero.featured']()}
                <ArrowUpRight size={22} />
              </span>
            </button>
            <div className="vikas-portrait-aside">
              {[templates[0], templates[5]].map((template) => (
                <button
                  key={template.id}
                  onClick={() => onTemplate(template)}
                  aria-label={`${template.title}: ${m['vikas.gallery.use']()}`}
                >
                  <VikasArtwork
                    index={template.artwork}
                    alt={template.description}
                  />
                  <span>
                    {template.title}
                    <ArrowUpRight size={13} />
                  </span>
                </button>
              ))}
            </div>
          </div>
          <p className="vikas-filmstrip-caption">
            {m['vikas.hero.examples']()}
          </p>
        </div>
      </div>
    </section>
  );
}
