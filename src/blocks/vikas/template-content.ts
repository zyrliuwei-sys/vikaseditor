import { TEMPLATE_ENGLISH_SEO } from '@/config/template-seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';

import { TEMPLATE_EDITORIAL } from './template-editorial.en';

export function getTemplateCopy(id: string, locale = getLocale()) {
  const copy = {
    'golden-hour': {
      effect: m['vikas.template.golden-hour.effect']({}, { locale }),
      description: m['vikas.template.golden-hour.meta_description'](
        {},
        { locale }
      ),
      occasions: [
        m['vikas.template.golden-hour.occasion1']({}, { locale }),
        m['vikas.template.golden-hour.occasion2']({}, { locale }),
        m['vikas.template.golden-hour.occasion3']({}, { locale }),
      ],
      captions: [
        m['vikas.template.golden-hour.example1']({}, { locale }),
        m['vikas.template.golden-hour.example2']({}, { locale }),
        m['vikas.template.golden-hour.example3']({}, { locale }),
      ],
    },
    'emerald-saree': {
      effect: m['vikas.template.emerald-saree.effect']({}, { locale }),
      description: m['vikas.template.emerald-saree.meta_description'](
        {},
        { locale }
      ),
      occasions: [
        m['vikas.template.emerald-saree.occasion1']({}, { locale }),
        m['vikas.template.emerald-saree.occasion2']({}, { locale }),
        m['vikas.template.emerald-saree.occasion3']({}, { locale }),
      ],
      captions: [
        m['vikas.template.emerald-saree.example1']({}, { locale }),
        m['vikas.template.emerald-saree.example2']({}, { locale }),
        m['vikas.template.emerald-saree.example3']({}, { locale }),
      ],
    },
    'midnight-city': {
      effect: m['vikas.template.midnight-city.effect']({}, { locale }),
      description: m['vikas.template.midnight-city.meta_description'](
        {},
        { locale }
      ),
      occasions: [
        m['vikas.template.midnight-city.occasion1']({}, { locale }),
        m['vikas.template.midnight-city.occasion2']({}, { locale }),
        m['vikas.template.midnight-city.occasion3']({}, { locale }),
      ],
      captions: [
        m['vikas.template.midnight-city.example1']({}, { locale }),
        m['vikas.template.midnight-city.example2']({}, { locale }),
        m['vikas.template.midnight-city.example3']({}, { locale }),
      ],
    },
    'diwali-glow': {
      effect: m['vikas.template.diwali-glow.effect']({}, { locale }),
      description: m['vikas.template.diwali-glow.meta_description'](
        {},
        { locale }
      ),
      occasions: [
        m['vikas.template.diwali-glow.occasion1']({}, { locale }),
        m['vikas.template.diwali-glow.occasion2']({}, { locale }),
        m['vikas.template.diwali-glow.occasion3']({}, { locale }),
      ],
      captions: [
        m['vikas.template.diwali-glow.example1']({}, { locale }),
        m['vikas.template.diwali-glow.example2']({}, { locale }),
        m['vikas.template.diwali-glow.example3']({}, { locale }),
      ],
    },
    'sunset-together': {
      effect: m['vikas.template.sunset-together.effect']({}, { locale }),
      description: m['vikas.template.sunset-together.meta_description'](
        {},
        { locale }
      ),
      occasions: [
        m['vikas.template.sunset-together.occasion1']({}, { locale }),
        m['vikas.template.sunset-together.occasion2']({}, { locale }),
        m['vikas.template.sunset-together.occasion3']({}, { locale }),
      ],
      captions: [
        m['vikas.template.sunset-together.example1']({}, { locale }),
        m['vikas.template.sunset-together.example2']({}, { locale }),
        m['vikas.template.sunset-together.example3']({}, { locale }),
      ],
    },
    'pink-editorial': {
      effect: m['vikas.template.pink-editorial.effect']({}, { locale }),
      description: m['vikas.template.pink-editorial.meta_description'](
        {},
        { locale }
      ),
      occasions: [
        m['vikas.template.pink-editorial.occasion1']({}, { locale }),
        m['vikas.template.pink-editorial.occasion2']({}, { locale }),
        m['vikas.template.pink-editorial.occasion3']({}, { locale }),
      ],
      captions: [
        m['vikas.template.pink-editorial.example1']({}, { locale }),
        m['vikas.template.pink-editorial.example2']({}, { locale }),
        m['vikas.template.pink-editorial.example3']({}, { locale }),
      ],
    },
    'cinematic-push': {
      effect: m['vikas.template.cinematic-push.effect']({}, { locale }),
      description: m['vikas.template.cinematic-push.meta_description'](
        {},
        { locale }
      ),
      occasions: [
        m['vikas.template.cinematic-push.occasion1']({}, { locale }),
        m['vikas.template.cinematic-push.occasion2']({}, { locale }),
        m['vikas.template.cinematic-push.occasion3']({}, { locale }),
      ],
      captions: [
        m['vikas.template.cinematic-push.example1']({}, { locale }),
        m['vikas.template.cinematic-push.example2']({}, { locale }),
        m['vikas.template.cinematic-push.example3']({}, { locale }),
      ],
    },
    'night-drive': {
      effect: m['vikas.template.night-drive.effect']({}, { locale }),
      description: m['vikas.template.night-drive.meta_description'](
        {},
        { locale }
      ),
      occasions: [
        m['vikas.template.night-drive.occasion1']({}, { locale }),
        m['vikas.template.night-drive.occasion2']({}, { locale }),
        m['vikas.template.night-drive.occasion3']({}, { locale }),
      ],
      captions: [
        m['vikas.template.night-drive.example1']({}, { locale }),
        m['vikas.template.night-drive.example2']({}, { locale }),
        m['vikas.template.night-drive.example3']({}, { locale }),
      ],
    },
    'living-memory': {
      effect: m['vikas.template.living-memory.effect']({}, { locale }),
      description: m['vikas.template.living-memory.meta_description'](
        {},
        { locale }
      ),
      occasions: [
        m['vikas.template.living-memory.occasion1']({}, { locale }),
        m['vikas.template.living-memory.occasion2']({}, { locale }),
        m['vikas.template.living-memory.occasion3']({}, { locale }),
      ],
      captions: [
        m['vikas.template.living-memory.example1']({}, { locale }),
        m['vikas.template.living-memory.example2']({}, { locale }),
        m['vikas.template.living-memory.example3']({}, { locale }),
      ],
    },
  };
  return {
    ...copy[id as keyof typeof copy],
    editorial:
      locale === 'en'
        ? TEMPLATE_EDITORIAL[id as keyof typeof TEMPLATE_EDITORIAL]
        : undefined,
    seo:
      locale === 'en'
        ? TEMPLATE_ENGLISH_SEO[id as keyof typeof TEMPLATE_ENGLISH_SEO]
        : undefined,
  };
}
