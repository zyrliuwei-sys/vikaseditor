import { useState } from 'react';
import type { TemplateCategory, VikasTemplate } from '@/types/vikas';
import { ArrowDown, Search, SlidersHorizontal } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { templatePath } from '@/config/template-pages';
import { m } from '@/paraglide/messages.js';
import { VikasTemplateCard } from '@/components/vikas/template-card';

export function VikasGallery({ templates }: { templates: VikasTemplate[] }) {
  const [category, setCategory] = useState<TemplateCategory>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(false);
  const categories: { id: TemplateCategory; label: string }[] = [
    { id: 'all', label: m['vikas.gallery.all']() },
    { id: 'cinematic', label: m['vikas.gallery.cinematic']() },
    { id: 'fashion', label: m['vikas.gallery.fashion']() },
    { id: 'festival', label: m['vikas.gallery.festival']() },
    { id: 'couple', label: m['vikas.gallery.couple']() },
    { id: 'video', label: m['vikas.gallery.video']() },
  ];
  const filtered = templates.filter(
    (t) =>
      (category === 'all' || t.category === category) &&
      `${t.title} ${t.description}`
        .toLowerCase()
        .includes(search.toLowerCase().trim())
  );
  const visible = expanded ? filtered : filtered.slice(0, 6);
  return (
    <section
      id="templates"
      className="vikas-section vikas-gallery"
      aria-labelledby="gallery-title"
    >
      <div className="vikas-section-heading">
        <div>
          <p className="vikas-eyebrow">{m['vikas.gallery.eyebrow']()}</p>
          <h2 id="gallery-title">{m['vikas.gallery.title']()}</h2>
          <p>{m['vikas.gallery.description']()}</p>
        </div>
      </div>
      <div className="vikas-gallery-tools">
        <div
          className="vikas-filter-list"
          aria-label={m['vikas.nav.templates']()}
        >
          {categories.map((c) => (
            <button
              key={c.id}
              aria-pressed={c.id === category}
              onClick={() => {
                setCategory(c.id);
                setExpanded(false);
              }}
              className={c.id === category ? 'active' : ''}
            >
              {c.label}
            </button>
          ))}
        </div>
        <label className="vikas-search">
          <Search size={16} />
          <input
            aria-label={m['vikas.gallery.search']()}
            placeholder={m['vikas.gallery.search']()}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setExpanded(false);
            }}
          />
        </label>
      </div>
      <p className="vikas-gallery-summary" role="status">
        {m['vikas.gallery.showing']({
          count: visible.length,
          total: filtered.length,
        })}
        <span>{m['vikas.gallery.examples_note']()}</span>
      </p>
      <div className="vikas-template-grid" id="vikas-template-results">
        {visible.map((template) => (
          <VikasTemplateCard
            key={template.id}
            template={template}
            useLabel={m['vikas.template_page.view']()}
            detailLabel={m['vikas.gallery.details']()}
            typeLabel={
              template.mediaType === 'video'
                ? m['vikas.gallery.motion']()
                : m['vikas.gallery.photo']()
            }
            href={templatePath(template.id)}
            detailHref={`${templatePath(template.id)}#prompt`}
          />
        ))}
      </div>
      {filtered.length > 6 && (
        <div className="vikas-gallery-more">
          <button
            className="vikas-button-secondary"
            aria-expanded={expanded}
            aria-controls="vikas-template-results"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded
              ? m['vikas.gallery.show_fewer']()
              : m['vikas.gallery.show_all']({ count: filtered.length })}
            <ArrowDown
              size={16}
              className={expanded ? 'rotate-180' : undefined}
            />
          </button>
        </div>
      )}
      {visible.length === 0 && (
        <div className="vikas-empty">
          <SlidersHorizontal size={25} />
          <p>{m['vikas.gallery.none']()}</p>
          <button
            className="vikas-button-secondary"
            onClick={() => {
              setCategory('all');
              setSearch('');
              setExpanded(false);
            }}
          >
            {m['vikas.gallery.clear']()}
          </button>
        </div>
      )}
      <nav
        className="vikas-template-index"
        aria-label={m['vikas.template_page.all_templates']()}
      >
        {templates.map((template) => (
          <Link key={template.id} href={templatePath(template.id)}>
            {template.title}
          </Link>
        ))}
      </nav>
    </section>
  );
}
