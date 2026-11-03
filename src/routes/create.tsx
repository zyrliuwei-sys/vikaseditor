import { createFileRoute } from '@tanstack/react-router';

import { vikasPageHead } from '@/lib/vikas-seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { VikasCreate } from '@/blocks/vikas/create';

export const Route = createFileRoute('/create')({
  validateSearch: (search: Record<string, unknown>) => ({
    ...(search.mode === 'video' || search.mode === 'image'
      ? { mode: search.mode }
      : {}),
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
  const navigate = Route.useNavigate();
  return (
    <div className="vikas-site">
      <Header />
      <main id="main-content">
        <VikasCreate
          mode={mode === 'video' ? 'video' : 'image'}
          onModeChange={(nextMode) => {
            void navigate({
              to: nextMode === 'video' ? '/create/video' : '/create/image',
              search: {},
              replace: true,
              resetScroll: false,
            });
          }}
        />
      </main>
      <Footer />
    </div>
  );
}
