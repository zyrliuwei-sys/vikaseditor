import type { TemplatePage } from './template-pages';

export const EDITING_BY_VIKAS_NOTE =
  'This is our independent take on the festive AI photo look trending as "editing by vikas". Not affiliated with that creator or any of his channels.';

/** English-only editorial names and metadata. Studio IDs and URLs stay fixed. */
export const TEMPLATE_ENGLISH_SEO: Record<
  TemplatePage['id'],
  { title: string; name: string; anchor: string }
> = {
  'golden-hour': {
    title: 'Golden Hour Hero Prompt – Editing by Vikas Style | Vikas Editor AI',
    name: 'Golden Hour Hero',
    anchor: 'Golden hour portrait prompt',
  },
  'emerald-saree': {
    title: 'Emerald Saree Prompt – Editing by Vikas Style | Vikas Editor AI',
    name: 'Emerald Saree',
    anchor: 'Emerald saree AI edit',
  },
  'midnight-city': {
    title: 'Midnight City Prompt – Editing by Vikas Style | Vikas Editor AI',
    name: 'Midnight City',
    anchor: 'Midnight city neon portrait prompt',
  },
  'diwali-glow': {
    title: 'Diwali Glow Prompt & Diwali Video Idea – Editing by Vikas Style',
    name: 'Diwali Glow',
    anchor: 'Diwali photo editing prompt',
  },
  'sunset-together': {
    title: 'Sunset Together Prompt – Editing by Vikas Style | Vikas Editor AI',
    name: 'Sunset Together',
    anchor: 'Sunset couple portrait prompt',
  },
  'pink-editorial': {
    title: 'Pink Editorial (Spotlight) Prompt – Editing by Vikas Style',
    name: 'Pink Editorial (Spotlight)',
    anchor: 'Pink Editorial (Spotlight) fashion prompt',
  },
  'cinematic-push': {
    title: 'Cinematic Push Video Prompt – Editing by Vikas Style',
    name: 'Cinematic Push',
    anchor: 'Cinematic push photo to video prompt',
  },
  'night-drive': {
    title: 'Night Drive Prompt – Editing by Vikas Style | Vikas Editor AI',
    name: 'Night Drive',
    anchor: 'Night drive video prompt',
  },
  'living-memory': {
    title: 'Living Memory Photo Prompt – Editing by Vikas Style',
    name: 'Living Memory',
    anchor: 'Living memory photo animation prompt',
  },
};
