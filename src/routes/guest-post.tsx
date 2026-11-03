import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { vikasPageHead } from '@/lib/vikas-seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { GuestPostLanding } from '@/blocks/guest-post';
import { Header } from '@/blocks/header';

export const Route = createFileRoute('/guest-post')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['guest_posts.landing.title']({}, { locale }),
      description: m['guest_posts.landing.description']({}, { locale }),
    };
  },
  head: ({ loaderData }) => {
    const locale = loaderData?.locale ?? 'en';
    const head = vikasPageHead(
      '/guest-post',
      `${loaderData?.title ?? m['guest_posts.landing.title']({}, { locale })} | ${envConfigs.app_name}`,
      loaderData?.description ??
        m['guest_posts.landing.description']({}, { locale }),
      locale
    );
    return {
      ...head,
      meta: [...head.meta, { name: 'robots', content: 'noindex, follow' }],
    };
  },
  component: GuestPostPage,
});

function GuestPostPage() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        <GuestPostLanding />
      </main>
      <Footer />
    </div>
  );
}
