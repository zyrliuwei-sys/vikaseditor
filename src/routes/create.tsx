import { createFileRoute } from '@tanstack/react-router';

import { vikasPageHead } from '@/lib/vikas-seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { VikasCreate } from '@/blocks/vikas/create';

export const Route = createFileRoute('/create')({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === 'video' ? ('video' as const) : ('image' as const),
  }),
  loader: () => ({ locale: getLocale() }),
  head: ({ loaderData }) => {
    const locale = loaderData?.locale ?? 'en';
    return vikasPageHead(
      '/create',
      m['vikas.create.meta_title']({}, { locale }),
      m['vikas.create.meta_description']({}, { locale }),
      locale
    );
  },
  component: CreatePage,
});
function CreatePage() {
  const { mode } = Route.useSearch();
  return (
    <div className="vikas-site">
      <Header />
      <main id="main-content">
        <VikasCreate mode={mode} />
      </main>
      <Footer />
    </div>
  );
}
