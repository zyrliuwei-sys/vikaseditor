import { createFileRoute, notFound } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import {
  TEMPLATE_PAGES,
  templateExamples,
  templatePath,
} from '@/config/template-pages';
import { jsonLd, vikasPageHead } from '@/lib/vikas-seo';
import { m } from '@/paraglide/messages.js';
import { getLocale, localizeUrl } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { getTemplateCopy } from '@/blocks/vikas/template-content';
import { VikasTemplatePage } from '@/blocks/vikas/template-page';
import { getVikasTemplates } from '@/blocks/vikas/templates';

export const Route = createFileRoute('/template/$slug')({
  loader: ({ params }) => {
    const page = TEMPLATE_PAGES.find((item) => item.slug === params.slug);
    if (!page) throw notFound();
    const locale = getLocale();
    const templates = getVikasTemplates(locale);
    const template = templates.find((item) => item.id === page.id)!;
    return {
      locale,
      page,
      template,
      copy: getTemplateCopy(page.id, locale),
      // Keep the original prompt intact in both languages.
      prompt: getVikasTemplates('en').find((item) => item.id === page.id)!
        .prompt,
      related: templates.filter((item) => item.id !== page.id),
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return { meta: [{ name: 'robots', content: 'noindex, follow' }] };
    const { locale, page, template, copy } = loaderData;
    const path = templatePath(page.id);
    const head = vikasPageHead(
      path,
      m['vikas.template_page.meta_title'](
        { title: template.title },
        { locale }
      ),
      copy.description,
      locale
    );
    const image = new URL(templateExamples(page)[0], envConfigs.app_url).href;
    return {
      ...head,
      meta: head.meta.map((meta) => {
        if (meta.property === 'og:image' || meta.name === 'twitter:image')
          return { ...meta, content: image };
        if (
          meta.property === 'og:image:width' ||
          meta.property === 'og:image:height'
        )
          return { ...meta, content: '512' };
        if (meta.property === 'og:image:alt')
          return { ...meta, content: copy.captions[0] };
        return meta;
      }),
      scripts: [
        jsonLd({
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: template.title,
          description: copy.description,
          inLanguage: locale,
          url: localizeUrl(new URL(path, envConfigs.app_url), { locale }).href,
          image: templateExamples(page).map(
            (src) => new URL(src, envConfigs.app_url).href
          ),
          publisher: { '@type': 'Organization', name: envConfigs.app_name },
        }),
      ],
    };
  },
  component: TemplatePage,
});

function TemplatePage() {
  const data = Route.useLoaderData();
  return (
    <div className="vikas-site">
      <Header />
      <main id="main-content">
        <VikasTemplatePage {...data} />
      </main>
      <Footer />
    </div>
  );
}
