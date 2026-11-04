import { createFileRoute } from '@tanstack/react-router';

import * as en from '@/content/pages/guide-vikas-editor-logo.en.mdx';
import * as zh from '@/content/pages/guide-vikas-editor-logo.zh.mdx';

import { staticPageRouteOptions } from '../-static-page';

export const Route = createFileRoute('/(pages)/guides/vikas-editor-logo')(
  staticPageRouteOptions('guides/vikas-editor-logo', { en, zh })
);
