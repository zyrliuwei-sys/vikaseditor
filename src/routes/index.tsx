import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { jsonLd, vikasPageHead } from '@/lib/vikas-seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { getVikasFaq } from '@/blocks/vikas/faq-content';
import { VikasHome } from '@/blocks/vikas/home';

function HomePage() {
  return (
    <div className="vikas-site">
      <Header />
      <main id="main-content">
        <VikasHome />
      </main>
      <Footer />
    </div>
  );
}
export const Route = createFileRoute('/')({
  loader: () => ({ locale: getLocale() }),
  head: ({ loaderData }) => {
    const locale = loaderData?.locale ?? 'en';
    const head = vikasPageHead(
      '/',
      m['common.metadata.title']({}, { locale }),
      m['common.metadata.description']({}, { locale }),
      locale
    );
    return {
      ...head,
      links: [
        ...head.links,
        {
          rel: 'preload',
          as: 'image',
          href: '/imgs/vikas/portrait-1.webp',
          fetchPriority: 'high',
        },
      ],
      scripts: [
        ...(locale === 'en'
          ? [
              jsonLd({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: getVikasFaq(locale).map(({ q, a, guide }) => ({
                  '@type': 'Question',
                  name: q,
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: guide ? `${a} Read our ${guide.label} guide.` : a,
                  },
                })),
              }),
            ]
          : []),
        jsonLd({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: envConfigs.app_name,
          url: envConfigs.app_url,
          inLanguage: locale,
          publisher: {
            '@type': 'Organization',
            name: envConfigs.app_name,
            url: envConfigs.app_url,
          },
        }),
      ],
    };
  },
  component: HomePage,
});
