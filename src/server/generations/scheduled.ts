import { definePlugin } from 'nitro';

import { runWithDbScope } from '@/core/db/request-scope';

import { syncPendingGenerations } from './handlers';

export default definePlugin((nitro) => {
  nitro.hooks.hook('cloudflare:scheduled', ({ controller }) =>
    runWithDbScope(() =>
      syncPendingGenerations(new Date(controller.scheduledTime))
    )
  );
});
