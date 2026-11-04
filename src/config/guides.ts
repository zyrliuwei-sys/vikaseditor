/** Published editorial routes; shared by the homepage and sitemap. */
export const GUIDE_SLUGS = [
  'vikas-editor',
  'vikas-editor-logo',
  'vikasheditor',
  'vikas-editor-prompt',
] as const;
export type GuideSlug = (typeof GUIDE_SLUGS)[number];
export const GUIDE_DATE = '2026-11-05';
export const guidePath = (slug: GuideSlug) => `/guides/${slug}`;
export const GUIDE_COVERS: Record<GuideSlug, string> = {
  'vikas-editor': '/imgs/vikas/templates/golden-hour-2.webp',
  'vikas-editor-logo': '/imgs/guides/logo-sheet.svg',
  vikasheditor: '/imgs/guides/choose-workflow.svg',
  'vikas-editor-prompt': '/imgs/vikas/templates/midnight-city-2.webp',
};
