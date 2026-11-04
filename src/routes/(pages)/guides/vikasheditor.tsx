import { createFileRoute } from '@tanstack/react-router';

import * as en from '@/content/pages/guide-vikasheditor.en.mdx';
import * as zh from '@/content/pages/guide-vikasheditor.zh.mdx';

import { staticPageRouteOptions } from '../-static-page';

export const Route = createFileRoute('/(pages)/guides/vikasheditor')(
  staticPageRouteOptions('guides/vikasheditor', { en, zh })
);
