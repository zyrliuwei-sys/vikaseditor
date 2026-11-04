import { createFileRoute } from '@tanstack/react-router';

import * as en from '@/content/pages/guide-vikas-editor-prompt.en.mdx';
import * as zh from '@/content/pages/guide-vikas-editor-prompt.zh.mdx';

import { staticPageRouteOptions } from '../-static-page';

export const Route = createFileRoute('/(pages)/guides/vikas-editor-prompt')(
  staticPageRouteOptions('guides/vikas-editor-prompt', { en, zh })
);
