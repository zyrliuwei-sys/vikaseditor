import type { ComponentType } from 'react';
import { MDXProvider } from '@mdx-js/react';
import { ArrowUpRight } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import type { GuideSlug } from '@/config/guides';
import { m } from '@/paraglide/messages.js';
import { mdxComponents } from '@/components/mdx-components';
import { GuideDownload } from '@/components/vikas/guide-elements';

import { VikasGuides } from './guides';

export type GuideMeta = {
  title: string;
  heading?: string;
  downloads?: { href: string; filename: string; label: string }[];
  description: string;
  updated_at: string;
  kind: 'guide';
  category: string;
  minutes: number;
  image: string;
  image_alt: string;
  image_caption: string;
  toc: { id: string; label: string }[];
};

export function VikasGuideArticle({
  meta,
  slug,
  Content,
}: {
  meta: GuideMeta;
  slug: GuideSlug;
  Content: ComponentType;
}) {
  return (
    <>
      <article className="guide-article">
        <header className="guide-header">
          <div>
            <p className="vikas-eyebrow">{meta.category}</p>
            <h1>{meta.heading ?? meta.title}</h1>
            <p className="guide-deck">{meta.description}</p>
            <div className="guide-byline">
              <span>{m['vikas.guides.author']()}</span>
              <span>
                {m['common.pages.last_updated']()}:{' '}
                <time dateTime={meta.updated_at}>{meta.updated_at}</time>
              </span>
              <span>
                {m['vikas.guides.reading_time']({ minutes: meta.minutes })}
              </span>
            </div>
            {meta.downloads && (
              <div className="guide-downloads">
                {meta.downloads.map((download) => (
                  <GuideDownload key={download.href} {...download} />
                ))}
              </div>
            )}
            <Link href="/#templates" className="guide-start">
              {m['vikas.guides.explore']()} <ArrowUpRight size={17} />
            </Link>
          </div>
          <figure className="guide-cover">
            <img
              src={meta.image}
              alt={meta.image_alt}
              width={1024}
              height={1024}
              fetchPriority="high"
            />
            <figcaption>{meta.image_caption}</figcaption>
          </figure>
        </header>
        <div className="guide-reading-layout">
          <nav className="guide-toc" aria-label={m['vikas.guides.contents']()}>
            <p className="vikas-eyebrow">{m['vikas.guides.contents']()}</p>
            <ol>
              {meta.toc.map((item, i) => (
                <li key={item.id}>
                  <a href={`#${item.id}`}>
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="guide-body">
            <MDXProvider
              components={{
                ...mdxComponents,
                a: ({ href = '', ...props }) =>
                  href.startsWith('/') &&
                  !/\.(svg|png|webp|jpg)$/.test(href) ? (
                    <Link href={href} {...props} />
                  ) : (
                    <a href={href} {...props} />
                  ),
              }}
            >
              <Content />
            </MDXProvider>
            <aside className="guide-home-cta">
              <p className="vikas-eyebrow">{m['vikas.guides.next']()}</p>
              <h2>{m['vikas.guides.cta_title']()}</h2>
              <p>{m['vikas.guides.cta_body']()}</p>
              <Link href="/" className="vikas-button">
                {m['vikas.guides.home']()} <ArrowUpRight size={17} />
              </Link>
            </aside>
          </div>
        </div>
      </article>
      <VikasGuides exclude={slug} />
    </>
  );
}
