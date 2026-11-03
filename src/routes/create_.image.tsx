import { createFileRoute } from '@tanstack/react-router';

import { vikasPageHead } from '@/lib/vikas-seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { VikasCreateEntry } from '@/blocks/vikas/create-entry';

export const Route = createFileRoute('/create_/image')({
  loader: () => ({ locale: getLocale() }),
  head: ({ loaderData }) => {
    const locale = loaderData?.locale ?? 'en';
    return vikasPageHead(
      '/create/image',
      m['vikas.create.image_meta_title']({}, { locale }),
      m['vikas.create.image_meta_description']({}, { locale }),
      locale
    );
  },
  component: () => <VikasCreateEntry mode="image" />,
});
