import type { ComponentType } from 'react';
import { notFound, useLoaderData } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { type GuideSlug } from '@/config/guides';
import { jsonLd, vikasPageHead } from '@/lib/vikas-seo';
import { m } from '@/paraglide/messages.js';
import { baseLocale, getLocale } from '@/paraglide/runtime.js';
import {
  VikasGuideArticle,
  type GuideMeta,
} from '@/blocks/vikas/guide-article';

type PageMeta = {
  title: string;
  description: string;
  updated_at: string;
  kind?: 'guide';
};

type PageModule = {
  default: ComponentType;
  meta: PageMeta;
};

// Eagerly bundle the static content pages (small legal/info MDX files).
// Keys are absolute from the project root.
const pages = import.meta.glob<PageModule>(
  ['/src/content/pages/*.mdx', '!/src/content/pages/guide-*.mdx'],
  {
    eager: true,
  }
);

function loadPage(slug: string, locale: string): PageModule | null {
  return (
    pages[`/src/content/pages/${slug}.${locale}.mdx`] ??
    pages[`/src/content/pages/${slug}.${baseLocale}.mdx`] ??
    null
  );
}

type LoaderData = {
  meta: PageMeta;
  slug: string;
  locale: ReturnType<typeof getLocale>;
};

// Shared route options for static MDX pages. Each page gets its own
// explicit route file (e.g. privacy-policy.tsx) so static segments
// always outrank dynamic ones — add a new page by creating the MDX
// content plus a thin route file using this factory.
export function staticPageRouteOptions(
  slug: string,
  translations?: Record<string, PageModule>
) {
  return {
    loader: (): LoaderData => {
      const locale = getLocale();
      const page =
        translations?.[locale] ??
        translations?.[baseLocale] ??
        loadPage(slug, locale);
      if (!page) throw notFound();
      return { meta: page.meta, slug, locale };
    },
    head: ({ loaderData }: { loaderData?: LoaderData }) => {
      if (!loaderData) return {};
      const { meta, locale } = loaderData;
      const head = vikasPageHead(
        `/${slug}`,
        meta.kind === 'guide' || meta.title.includes(envConfigs.app_name)
          ? meta.title
          : `${meta.title} | ${envConfigs.app_name}`,
        meta.description,
        locale
      );
      if (meta.kind !== 'guide') return head;
      const guide = meta as GuideMeta;
      const url = head.links.find((link) => link.rel === 'canonical')!.href;
      const image = new URL(
        guide.image.endsWith('.svg')
          ? '/imgs/vikas/social-card.jpg'
          : guide.image,
        envConfigs.app_url
      ).href;
      return {
        ...head,
        meta: head.meta
          .map((tag) =>
            tag.property === 'og:type'
              ? { ...tag, content: 'article' }
              : tag.property === 'og:image' || tag.name === 'twitter:image'
                ? { ...tag, content: image }
                : tag
          )
          .filter(
            (tag) =>
              !['og:image:width', 'og:image:height'].includes(
                tag.property || ''
              )
          ),
        scripts: [
          jsonLd({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: meta.title,
            description: meta.description,
            image: [image],
            datePublished: meta.updated_at,
            dateModified: meta.updated_at,
            inLanguage: locale,
            mainEntityOfPage: url,
            author: {
              '@type': 'Organization',
              name: envConfigs.app_name,
              url: envConfigs.app_url,
            },
            publisher: {
              '@type': 'Organization',
              name: envConfigs.app_name,
              url: envConfigs.app_url,
            },
          }),
          jsonLd({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: envConfigs.app_name,
                item: new URL(locale === 'zh' ? '/zh' : '/', envConfigs.app_url)
                  .href,
              },
              { '@type': 'ListItem', position: 2, name: meta.title, item: url },
            ],
          }),
        ],
      };
    },
    component: () => <StaticPage translations={translations} />,
  };
}

function StaticPage({
  translations,
}: {
  translations?: Record<string, PageModule>;
}) {
  const { meta, slug, locale } = useLoaderData({
    strict: false,
  }) as LoaderData;

  const page =
    translations?.[locale] ??
    translations?.[baseLocale] ??
    loadPage(slug, locale)!;
  const Content = page.default;
  if (meta.kind === 'guide')
    return (
      <VikasGuideArticle
        meta={meta as GuideMeta}
        slug={slug.split('/').at(-1) as GuideSlug}
        Content={Content}
      />
    );

  return (
    <article className="vikas-legal">
      <header className="border-border mb-6 border-b pb-5">
        <h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
          {meta.title}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">{meta.description}</p>
        <p className="text-muted-foreground mt-2 text-xs">
          {m['common.pages.last_updated']()}: {meta.updated_at}
        </p>
      </header>
      <div className="text-foreground/90 text-[15px] leading-7">
        <Content />
      </div>
    </article>
  );
}
