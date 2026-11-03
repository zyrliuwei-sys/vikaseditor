import { createFileRoute } from '@tanstack/react-router';

import { vikasPageHead } from '@/lib/vikas-seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { VikasCredits } from '@/blocks/vikas/credits';

export const Route = createFileRoute('/pricing')({
  loader: () => ({ locale: getLocale() }),
  head: ({ loaderData }) => {
    const locale = loaderData?.locale ?? 'en';
    return vikasPageHead(
      '/pricing',
      m['vikas.credits.meta_title']({}, { locale }),
      m['vikas.credits.description']({}, { locale }),
      locale
    );
  },
  component: () => (
    <div className="vikas-site">
      <Header />
      <main id="main-content">
        <VikasCredits />
      </main>
      <Footer />
    </div>
  ),
});
