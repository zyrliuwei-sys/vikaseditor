import { useQuery } from '@tanstack/react-query';
import type { GenerationCapabilities } from '@/types/vikas';
import { ArrowRight, Film, Image as ImageIcon } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { apiGet } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';
import { VikasArtwork } from '@/components/vikas/artwork';

export function VikasCredits() {
  const config = useQuery({
    queryKey: ['vikas-generation-config'],
    queryFn: () => apiGet<GenerationCapabilities>('/api/generations/config'),
    staleTime: 60_000,
    retry: 1,
  });
  const formats = [
    {
      title: m['vikas.credits.image'](),
      description: m['vikas.credits.image_detail'](),
      cost: config.data?.imageCredits,
      icon: ImageIcon,
      artwork: 1,
    },
    {
      title: m['vikas.credits.video'](),
      description: m['vikas.credits.video_detail'](),
      cost: config.data?.videoCredits,
      icon: Film,
      artwork: 2,
    },
  ];
  return (
    <div className="vikas-credits-page">
      <div className="vikas-credits-heading">
        <p className="vikas-eyebrow">{m['vikas.footer.credits']()}</p>
        <h1>{m['vikas.credits.title']()}</h1>
        <p>{m['vikas.credits.description']()}</p>
      </div>
      <div className="vikas-credits-grid">
        {formats.map((format) => (
          <article className="vikas-credit-card" key={format.title}>
            <div className="vikas-credit-detail">
              <format.icon size={24} />
              <h2>{format.title}</h2>
              <p className="vikas-credit-number">
                <strong>{format.cost ?? '…'}</strong>
                {m['vikas.credits.unit']()}
              </p>
              <small>{m['vikas.credits.label']()}</small>
              <p>{format.description}</p>
            </div>
            <div className="vikas-credit-art">
              <VikasArtwork index={format.artwork} alt="" />
            </div>
          </article>
        ))}
      </div>
      <div className="vikas-credit-explainer">
        <h2>{m['vikas.credits.note_title']()}</h2>
        <p>{m['vikas.credits.note']()}</p>
      </div>
      {config.isError && (
        <p className="vikas-credit-status" role="status">
          {m['vikas.studio.config_error']()}{' '}
          <button onClick={() => void config.refetch()}>
            {m['vikas.studio.retry']()}
          </button>
        </p>
      )}
      {config.data && !config.data.configured && (
        <p className="vikas-credit-status">
          {m['vikas.studio.configuration_hint']()}
        </p>
      )}
      <div className="vikas-credit-links">
        <Link href="/create" className="vikas-button">
          {m['vikas.nav.start']()}
          <ArrowRight size={16} />
        </Link>
        <Link href="/settings/credits" className="vikas-button-secondary">
          {m['vikas.credits.balance']()}
        </Link>
      </div>
    </div>
  );
}
