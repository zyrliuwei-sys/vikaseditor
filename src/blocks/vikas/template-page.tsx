import { useState } from 'react';
import type { VikasTemplate } from '@/types/vikas';
import { ArrowLeft, ArrowUpRight, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Link } from '@/core/i18n/navigation';
import {
  templateExamples,
  templatePath,
  type TemplatePage,
} from '@/config/template-pages';
import { m } from '@/paraglide/messages.js';
import { getTemplateCopy } from '@/blocks/vikas/template-content';

import '@/styles/vikas-template.css';

export function VikasTemplatePage({
  page,
  template,
  copy,
  prompt,
  related,
}: {
  page: TemplatePage;
  template: VikasTemplate;
  copy: ReturnType<typeof getTemplateCopy>;
  prompt: string;
  related: VikasTemplate[];
}) {
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const copied = copiedPrompt === prompt;
  const images = templateExamples(page);
  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(prompt);
      toast.success(m['vikas.gallery.copied']());
    } catch {
      toast.error(m['vikas.gallery.copy_failed']());
    }
  }

  return (
    <article className="vikas-template-page">
      <Link href="/#templates" className="vikas-template-back">
        <ArrowLeft size={16} /> {m['vikas.template_page.back']()}
      </Link>
      <div className="vikas-template-intro">
        <header>
          <p className="vikas-eyebrow">{m['vikas.template_page.eyebrow']()}</p>
          <h1>{template.title}</h1>
          <p className="vikas-template-effect">{copy.effect}</p>
          <Link
            href={`/create?mode=${template.mediaType}&template=${encodeURIComponent(template.id)}`}
            className="vikas-button"
          >
            {m['vikas.template_page.use']()} <ArrowUpRight size={17} />
          </Link>
          <p className="vikas-template-help">
            {m['vikas.template_page.use_note']()}
          </p>
          <p className="vikas-template-availability">
            {m['vikas.template_page.availability']()}
          </p>
        </header>
        <figure>
          <img
            src={images[0]}
            alt={copy.captions[0]}
            width={512}
            height={512}
            fetchPriority="high"
          />
          <figcaption>{copy.captions[0]}</figcaption>
        </figure>
      </div>

      <div className="vikas-template-reading">
        <section id="prompt" aria-labelledby="template-prompt-title">
          <div className="vikas-template-section-heading">
            <h2 id="template-prompt-title">
              {m['vikas.template_page.prompt_title']()}
            </h2>
            <button
              type="button"
              className="vikas-button-secondary"
              onClick={copyPrompt}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span aria-live="polite">
                {copied
                  ? m['vikas.gallery.copied']()
                  : m['vikas.gallery.copy']()}
              </span>
            </button>
          </div>
          <blockquote className="vikas-template-prompt" lang="en">
            {prompt}
          </blockquote>
          <p className="vikas-template-help">
            {m['vikas.template_page.prompt_note']()}
          </p>
        </section>
        <section aria-labelledby="template-occasions-title">
          <h2 id="template-occasions-title">
            {m['vikas.template_page.occasions_title']()}
          </h2>
          <ul className="vikas-template-occasions">
            {copy.occasions.map((occasion) => (
              <li key={occasion}>{occasion}</li>
            ))}
          </ul>
        </section>
      </div>

      <section
        className="vikas-template-examples"
        aria-labelledby="template-examples-title"
      >
        <h2 id="template-examples-title">
          {m['vikas.template_page.examples_title']()}
        </h2>
        <p className="vikas-template-help">
          {m['vikas.template_page.examples_note']()}
        </p>
        {template.mediaType === 'video' && (
          <p className="vikas-template-help">
            {m['vikas.template_page.video_note']()}
          </p>
        )}
        <div className="vikas-template-example-grid">
          {images.slice(1).map((src, index) => (
            <figure key={src}>
              <img
                src={src}
                alt={copy.captions[index + 1]}
                width={1024}
                height={1024}
                loading="lazy"
                decoding="async"
              />
              <figcaption>{copy.captions[index + 1]}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section
        className="vikas-template-related"
        aria-labelledby="template-related-title"
      >
        <h2 id="template-related-title">
          {m['vikas.template_page.related_title']()}
        </h2>
        <nav aria-label={m['vikas.template_page.all_templates']()}>
          {related.map((item) => (
            <Link href={templatePath(item.id)} key={item.id}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          ))}
        </nav>
      </section>
    </article>
  );
}
