import { envConfigs } from '@/config';
import { getLocale, locales, localizeUrl } from '@/paraglide/runtime.js';

/** Shared public-page metadata; queries represent UI state, not separate pages. */
export function vikasPageHead(
  path: string,
  title: string,
  description: string,
  locale: ReturnType<typeof getLocale>
) {
  const urlFor = (language: typeof locale) =>
    localizeUrl(new URL(path, envConfigs.app_url), { locale: language }).href;
  const image = new URL('/imgs/vikas/social-card.jpg', envConfigs.app_url).href;
  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: urlFor(locale) },
      { property: 'og:site_name', content: envConfigs.app_name },
      { property: 'og:image', content: image },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: envConfigs.app_name },
      { property: 'og:locale', content: locale === 'zh' ? 'zh_CN' : 'en_US' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ],
    links: [
      { rel: 'canonical', href: urlFor(locale) },
      ...locales.map((language) => ({
        rel: 'alternate',
        hrefLang: language,
        href: urlFor(language),
      })),
      { rel: 'alternate', hrefLang: 'x-default', href: urlFor('en') },
    ],
  };
}

/** Escape HTML delimiters even when a JSON-LD field comes from a database. */
export function jsonLd(data: Record<string, unknown>) {
  return {
    type: 'application/ld+json',
    children: JSON.stringify(data).replace(/</g, '\\u003c'),
  };
}

export const PRIVATE_ROBOTS = { name: 'robots', content: 'noindex, nofollow' };
