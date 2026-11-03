import { createFileRoute } from '@tanstack/react-router';
import {
  studioPaymentProvider,
  studioProducts,
} from '@/server/payment/storefront';

import { getAllConfigs } from '@/modules/config/service';
import { respData, respErr } from '@/lib/resp';

export const Route = createFileRoute('/api/payment/plans')({
  server: {
    handlers: {
      GET: async () => {
        try {
          return respData(
            {
              products: studioProducts(),
              provider: studioPaymentProvider(await getAllConfigs()),
            },
            { headers: { 'cache-control': 'no-store' } }
          );
        } catch {
          return respErr('Plans are temporarily unavailable.', { status: 503 });
        }
      },
    },
  },
});
