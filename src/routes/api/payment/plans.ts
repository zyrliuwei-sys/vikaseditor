import { createFileRoute } from '@tanstack/react-router';
import {
  studioPaymentProvider,
  studioPaymentProviders,
  studioProducts,
  studioVideoOffer,
} from '@/server/payment/storefront';

import { getAllConfigs } from '@/modules/config/service';
import { respData, respErr } from '@/lib/resp';

export const Route = createFileRoute('/api/payment/plans')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const configs = await getAllConfigs();
          return respData(
            {
              products: studioProducts(),
              videoOffer: studioVideoOffer(),
              providers: studioPaymentProviders(configs),
              provider: studioPaymentProvider(configs),
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
