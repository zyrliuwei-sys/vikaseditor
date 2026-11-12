import { createFileRoute } from '@tanstack/react-router';

import * as en from '@/content/pages/guide-editing-by-vikas-templates.en.mdx';

import { staticPageRouteOptions } from '../-static-page';

export const Route = createFileRoute(
  '/(pages)/guides/editing-by-vikas-templates'
)(
  staticPageRouteOptions(
    'guides/editing-by-vikas-templates',
    { en },
    { onlyLocales: ['en'] }
  )
);
