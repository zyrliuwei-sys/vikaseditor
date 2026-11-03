import type { VikasTemplate } from '@/types/vikas';

import { m } from '@/paraglide/messages.js';

export function getVikasTemplates(): VikasTemplate[] {
  return [
    {
      id: 'golden-hour',
      title: m['vikas.template.golden-hour.title'](),
      description: m['vikas.template.golden-hour.description'](),
      prompt: m['vikas.template.golden-hour.prompt'](),
      category: 'cinematic',
      mediaType: 'image',
      artwork: 0,
    },
    {
      id: 'emerald-saree',
      title: m['vikas.template.emerald-saree.title'](),
      description: m['vikas.template.emerald-saree.description'](),
      prompt: m['vikas.template.emerald-saree.prompt'](),
      category: 'fashion',
      mediaType: 'image',
      artwork: 1,
    },
    {
      id: 'midnight-city',
      title: m['vikas.template.midnight-city.title'](),
      description: m['vikas.template.midnight-city.description'](),
      prompt: m['vikas.template.midnight-city.prompt'](),
      category: 'cinematic',
      mediaType: 'image',
      artwork: 2,
    },
    {
      id: 'diwali-glow',
      title: m['vikas.template.diwali-glow.title'](),
      description: m['vikas.template.diwali-glow.description'](),
      prompt: m['vikas.template.diwali-glow.prompt'](),
      category: 'festival',
      mediaType: 'image',
      artwork: 3,
    },
    {
      id: 'sunset-together',
      title: m['vikas.template.sunset-together.title'](),
      description: m['vikas.template.sunset-together.description'](),
      prompt: m['vikas.template.sunset-together.prompt'](),
      category: 'couple',
      mediaType: 'image',
      artwork: 4,
    },
    {
      id: 'pink-editorial',
      title: m['vikas.template.pink-editorial.title'](),
      description: m['vikas.template.pink-editorial.description'](),
      prompt: m['vikas.template.pink-editorial.prompt'](),
      category: 'fashion',
      mediaType: 'image',
      artwork: 5,
    },
    {
      id: 'cinematic-push',
      title: m['vikas.template.cinematic-push.title'](),
      description: m['vikas.template.cinematic-push.description'](),
      prompt: m['vikas.template.cinematic-push.prompt'](),
      category: 'video',
      mediaType: 'video',
      artwork: 0,
    },
    {
      id: 'night-drive',
      title: m['vikas.template.night-drive.title'](),
      description: m['vikas.template.night-drive.description'](),
      prompt: m['vikas.template.night-drive.prompt'](),
      category: 'video',
      mediaType: 'video',
      artwork: 2,
    },
    {
      id: 'living-memory',
      title: m['vikas.template.living-memory.title'](),
      description: m['vikas.template.living-memory.description'](),
      prompt: m['vikas.template.living-memory.prompt'](),
      category: 'video',
      mediaType: 'video',
      artwork: 4,
    },
  ];
}
