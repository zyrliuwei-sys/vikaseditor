import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import { VikasCreate } from '@/blocks/vikas/create';

import '@/styles/vikas.css';

export const Route = createFileRoute('/settings/studio')({
  head: () => ({
    meta: [{ title: `${m['vikas.nav.studio']()} | ${envConfigs.app_name}` }],
  }),
  component: VikasCreate,
});
