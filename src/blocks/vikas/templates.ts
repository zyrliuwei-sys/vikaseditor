import type { VikasTemplate } from '@/types/vikas';

import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';

export function getVikasTemplates(locale = getLocale()): VikasTemplate[] {
  return [
    {
      id: 'golden-hour',
      title: m['vikas.template.golden-hour.title']({}, { locale }),
      description: m['vikas.template.golden-hour.description']({}, { locale }),
      prompt: m['vikas.template.golden-hour.prompt']({}, { locale }),
      category: 'cinematic',
      mediaType: 'image',
      artwork: 0,
    },
    {
      id: 'emerald-saree',
      title: m['vikas.template.emerald-saree.title']({}, { locale }),
      description: m['vikas.template.emerald-saree.description'](
        {},
        { locale }
      ),
      prompt: m['vikas.template.emerald-saree.prompt']({}, { locale }),
      category: 'fashion',
      mediaType: 'image',
      artwork: 1,
    },
    {
      id: 'midnight-city',
      title: m['vikas.template.midnight-city.title']({}, { locale }),
      description: m['vikas.template.midnight-city.description'](
        {},
        { locale }
      ),
      prompt: m['vikas.template.midnight-city.prompt']({}, { locale }),
      category: 'cinematic',
      mediaType: 'image',
      artwork: 2,
    },
    {
      id: 'diwali-glow',
      title: m['vikas.template.diwali-glow.title']({}, { locale }),
      description: m['vikas.template.diwali-glow.description']({}, { locale }),
      prompt: m['vikas.template.diwali-glow.prompt']({}, { locale }),
      category: 'festival',
      mediaType: 'image',
      artwork: 3,
    },
    {
      id: 'sunset-together',
      title: m['vikas.template.sunset-together.title']({}, { locale }),
      description: m['vikas.template.sunset-together.description'](
        {},
        { locale }
      ),
      prompt: m['vikas.template.sunset-together.prompt']({}, { locale }),
      category: 'couple',
      mediaType: 'image',
      artwork: 4,
    },
    {
      id: 'pink-editorial',
      title: m['vikas.template.pink-editorial.title']({}, { locale }),
      description: m['vikas.template.pink-editorial.description'](
        {},
        { locale }
      ),
      prompt: m['vikas.template.pink-editorial.prompt']({}, { locale }),
      category: 'fashion',
      mediaType: 'image',
      artwork: 5,
    },
    {
      id: 'cinematic-push',
      title: m['vikas.template.cinematic-push.title']({}, { locale }),
      description: m['vikas.template.cinematic-push.description'](
        {},
        { locale }
      ),
      prompt: m['vikas.template.cinematic-push.prompt']({}, { locale }),
      category: 'video',
      mediaType: 'video',
      artwork: 0,
    },
    {
      id: 'night-drive',
      title: m['vikas.template.night-drive.title']({}, { locale }),
      description: m['vikas.template.night-drive.description']({}, { locale }),
      prompt: m['vikas.template.night-drive.prompt']({}, { locale }),
      category: 'video',
      mediaType: 'video',
      artwork: 2,
    },
    {
      id: 'living-memory',
      title: m['vikas.template.living-memory.title']({}, { locale }),
      description: m['vikas.template.living-memory.description'](
        {},
        { locale }
      ),
      prompt: m['vikas.template.living-memory.prompt']({}, { locale }),
      category: 'video',
      mediaType: 'video',
      artwork: 4,
    },
  ];
}
