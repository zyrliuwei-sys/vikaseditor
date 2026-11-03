import type { MediaMode, VikasTemplate } from '@/types/vikas';
import { ArrowRight, ArrowUpRight, ImagePlus } from 'lucide-react';

import { m } from '@/paraglide/messages.js';
import { VikasArtwork } from '@/components/vikas/artwork';

export function VikasHero({
  templates,
  onCreate,
  onTemplate,
}: {
  templates: VikasTemplate[];
  onCreate: (mode: MediaMode, prompt?: string, upload?: boolean) => void;
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
            <button
              className="vikas-button"
              onClick={() => onCreate('image', undefined, true)}
            >
              <ImagePlus size={18} />
              {m['vikas.hero.upload']()}
            </button>
            <a href="#templates" className="vikas-hero-explore">
              {m['vikas.nav.templates']()}
              <ArrowRight size={17} />
            </a>
          </div>
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
