/** Public editorial URLs. IDs stay unchanged for existing studio selections. */
export const TEMPLATE_PAGES = [
  {
    id: 'golden-hour',
    slug: 'golden-hour-hero',
    artwork: 0,
    imageFamily: 'golden-hour',
  },
  {
    id: 'emerald-saree',
    slug: 'emerald-saree',
    artwork: 1,
    imageFamily: 'emerald-saree',
  },
  {
    id: 'midnight-city',
    slug: 'midnight-city',
    artwork: 2,
    imageFamily: 'midnight-city',
  },
  {
    id: 'diwali-glow',
    slug: 'diwali-glow',
    artwork: 3,
    imageFamily: 'diwali-glow',
  },
  {
    id: 'sunset-together',
    slug: 'sunset-together',
    artwork: 4,
    imageFamily: 'sunset-together',
  },
  {
    id: 'pink-editorial',
    slug: 'pink-editorial',
    artwork: 5,
    imageFamily: 'pink-editorial',
  },
  {
    id: 'cinematic-push',
    slug: 'cinematic-push',
    artwork: 0,
    imageFamily: 'golden-hour',
  },
  {
    id: 'night-drive',
    slug: 'night-drive',
    artwork: 2,
    imageFamily: 'midnight-city',
  },
  {
    id: 'living-memory',
    slug: 'living-memory',
    artwork: 4,
    imageFamily: 'sunset-together',
  },
] as const;

export type TemplatePage = (typeof TEMPLATE_PAGES)[number];

export function templatePath(id: string): string {
  const page = TEMPLATE_PAGES.find((item) => item.id === id);
  if (!page) throw new Error(`Unknown template: ${id}`);
  return `/template/${page.slug}`;
}

export function templateExamples(page: TemplatePage): string[] {
  return [
    `/imgs/vikas/portrait-${page.artwork}.webp`,
    `/imgs/vikas/templates/${page.imageFamily}-2.webp`,
    `/imgs/vikas/templates/${page.imageFamily}-3.webp`,
  ];
}
