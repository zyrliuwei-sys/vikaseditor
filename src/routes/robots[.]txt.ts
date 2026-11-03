import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { baseLocale, locales } from '@/paraglide/runtime.js';

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () => {
        const body = [
          'User-Agent: *',
          'Allow: /',
          ...locales.flatMap((locale) => {
            const prefix = locale === baseLocale ? '' : `/${locale}`;
            return [
              '/admin',
              '/settings',
              '/api/',
              '/sign-in',
              '/sign-up',
              '/forgot-password',
              '/reset-password',
              '/verify-email',
              '/auth-callback',
              '/redeem-invite',
            ].map((path) => `Disallow: ${prefix}${path}`);
          }),
          '',
          `Sitemap: ${new URL('/sitemap.xml', envConfigs.app_url).href}`,
          '',
        ].join('\n');
        return new Response(body, {
          headers: { 'Content-Type': 'text/plain' },
        });
      },
    },
  },
});
