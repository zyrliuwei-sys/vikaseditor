import { createFileRoute } from '@tanstack/react-router';

import * as en from '@/content/pages/guide-vikas-editor.en.mdx';
import * as zh from '@/content/pages/guide-vikas-editor.zh.mdx';

import { staticPageRouteOptions } from '../-static-page';

export const Route = createFileRoute('/(pages)/guides/vikas-editor')(
  staticPageRouteOptions('guides/vikas-editor', { en, zh })
);
