import type { MediaMode } from '@/types/vikas';

import { useRouter } from '@/core/i18n/navigation';
import { m } from '@/paraglide/messages.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { VikasCreate } from '@/blocks/vikas/create';

/** Fixed, crawlable entry URLs reuse the existing workspace unchanged. */
export function VikasCreateEntry({ mode }: { mode: MediaMode }) {
  const router = useRouter();
  return (
    <div className="vikas-site">
      <Header />
      <main id="main-content">
        <p className="vikas-entry-notice">
          {m['vikas.template_page.availability']()}
        </p>
        <VikasCreate
          mode={mode}
          onModeChange={(next) => router.replace(`/create/${next}`)}
        />
      </main>
      <Footer />
    </div>
  );
}
