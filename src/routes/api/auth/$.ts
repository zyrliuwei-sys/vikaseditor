import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { getAllConfigs } from '@/modules/config/service';
import { isEmailSendingConfigured } from '@/lib/email-config';

// better-auth catch-all — the handler takes a standard Request and
// returns a standard Response, so it mounts directly.
async function handle(request: Request) {
  const configs = await getAllConfigs();
  if (
    request.method === 'POST' &&
    /\/(?:request-password-reset|send-verification-email)$/.test(
      new URL(request.url).pathname
    ) &&
    !isEmailSendingConfigured(configs)
  ) {
    return Response.json(
      {
        code: 'EMAIL_UNAVAILABLE',
        message: 'Email delivery is currently unavailable.',
      },
      { status: 503 }
    );
  }
  const auth = getAuth(configs);
  return auth.handler(request);
}

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
});
