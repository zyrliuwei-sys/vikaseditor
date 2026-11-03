import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { TEMPLATE_PAGES } from '@/config/template-pages';
import { baseLocale, locales, localizeUrl } from '@/paraglide/runtime.js';

const STATIC_PATHS = [
  '',
  '/pricing',
  '/create',
  '/create/image',
  '/create/video',
  '/privacy-policy',
  '/terms-of-service',
];

type Entry = {
  path: string;
  lastModified?: string;
  changeFrequency: string;
  priority: number;
  languages?: readonly (typeof locales)[number][];
};

function urlFor(path: string, locale: string): string {
  return localizeUrl(new URL(path || '/', envConfigs.app_url), {
    locale: locale as (typeof locales)[number],
  }).href;
}

function xmlEscape(value: string): string {
  return value.replace(
    /[<>&"']/g,
    (char) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;',
      })[char]!
  );
}

function entryXml(e: Entry): string {
  const languages = e.languages ?? locales;
  const alternates = [
    ...languages,
    ...(languages.includes(baseLocale) ? ['x-default'] : []),
  ]
    .map(
      (loc) =>
        `    <xhtml:link rel="alternate" hreflang="${loc}" href="${xmlEscape(urlFor(e.path, loc === 'x-default' ? baseLocale : loc))}"/>`
    )
    .join('\n');
  return languages
    .map((locale) =>
      [
        '  <url>',
        `    <loc>${xmlEscape(urlFor(e.path, locale))}</loc>`,
        alternates,
        e.lastModified
          ? `    <lastmod>${xmlEscape(e.lastModified)}</lastmod>`
          : null,
        `    <changefreq>${e.changeFrequency}</changefreq>`,
        `    <priority>${e.priority}</priority>`,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n')
    )
    .join('\n');
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const entries: Entry[] = STATIC_PATHS.map((path) => ({
          path,
          changeFrequency: 'weekly',
          priority: path === '' ? 1 : 0.8,
        }));

        for (const page of TEMPLATE_PAGES) {
          entries.push({
            path: `/template/${page.slug}`,
            changeFrequency: 'monthly',
            priority: 0.8,
          });
        }

        // Match the blog's published-only DB + registered MDX sources.
        // An empty locale stays out until its first article is published.
        const { publishedBlogEntries } = await import('@/server/blog-sitemap');
        entries.push(...(await publishedBlogEntries()));

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
          ...entries.map(entryXml),
          '</urlset>',
          '',
        ].join('\n');

        return new Response(xml, {
          headers: { 'Content-Type': 'application/xml' },
        });
      },
    },
  },
});
