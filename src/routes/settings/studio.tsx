import { createFileRoute } from '@tanstack/react-router';

import { VikasCreate } from '@/blocks/vikas/create';

import '@/styles/vikas.css';

export const Route = createFileRoute('/settings/studio')({
  component: VikasCreate,
});
