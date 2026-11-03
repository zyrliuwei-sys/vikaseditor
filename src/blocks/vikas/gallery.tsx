import { useState } from 'react';
import type { TemplateCategory, VikasTemplate } from '@/types/vikas';
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Copy,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';

import { m } from '@/paraglide/messages.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { VikasArtwork } from '@/components/vikas/artwork';
import { VikasTemplateCard } from '@/components/vikas/template-card';

export function VikasGallery({
  templates,
  onTemplate,
}: {
  templates: VikasTemplate[];
  onTemplate: (template: VikasTemplate) => void;
}) {
  const [category, setCategory] = useState<TemplateCategory>('all');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<VikasTemplate | null>(null);
  const [copied, setCopied] = useState(false);
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
  async function copyPrompt() {
    if (!detail) return;
    try {
      await navigator.clipboard.writeText(detail.prompt);
      setCopied(true);
      toast.success(m['vikas.gallery.copied']());
    } catch {
      toast.error(m['vikas.gallery.copy_failed']());
    }
  }
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
            useLabel={m['vikas.gallery.use']()}
            detailLabel={m['vikas.gallery.details']()}
            typeLabel={
              template.mediaType === 'video'
                ? m['vikas.gallery.motion']()
                : m['vikas.gallery.photo']()
            }
            onUse={() => onTemplate(template)}
            onDetails={() => {
              setDetail(template);
              setCopied(false);
            }}
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
      <Dialog
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <DialogContent className="vikas-template-dialog">
          {detail && (
            <>
              <div className="vikas-dialog-art">
                <VikasArtwork index={detail.artwork} alt={detail.title} />
                <span>{m['vikas.gallery.example']()}</span>
              </div>
              <div className="vikas-dialog-copy">
                <DialogTitle className="text-2xl">{detail.title}</DialogTitle>
                <DialogDescription>{detail.description}</DialogDescription>
                <p className="vikas-dialog-label">
                  {m['vikas.gallery.prompt']()}
                </p>
                <p className="vikas-prompt-text">{detail.prompt}</p>
                <div className="vikas-dialog-actions">
                  <button
                    className="vikas-button-secondary"
                    onClick={copyPrompt}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}{' '}
                    {copied
                      ? m['vikas.gallery.copied']()
                      : m['vikas.gallery.copy']()}
                  </button>
                  <button
                    className="vikas-button"
                    onClick={() => {
                      onTemplate(detail);
                      setDetail(null);
                    }}
                  >
                    {m['vikas.gallery.use']()}
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
