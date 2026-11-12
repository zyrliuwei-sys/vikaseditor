import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';

/** One source for the visible FAQ and its matching structured data. */
export function getVikasFaq(locale = getLocale()) {
  return [
    {
      q: m['vikas.faq.q1']({}, { locale }),
      a: m['vikas.faq.a1']({}, { locale }),
    },
    {
      q: m['vikas.faq.q2']({}, { locale }),
      a: m['vikas.faq.a2']({}, { locale }),
    },
    {
      q: m['vikas.faq.q3']({}, { locale }),
      a: m['vikas.faq.a3']({}, { locale }),
    },
    {
      q: m['vikas.faq.q4']({}, { locale }),
      a: m['vikas.faq.a4']({}, { locale }),
      guide:
        locale === 'en'
          ? {
              href: '/guides/editing-by-vikas-templates',
              label: 'editing by vikas templates',
            }
          : undefined,
    },
    {
      q: m['vikas.faq.q5']({}, { locale }),
      a: m['vikas.faq.a5']({}, { locale }),
    },
    {
      q: m['vikas.faq.q6']({}, { locale }),
      a: m['vikas.faq.a6']({}, { locale }),
    },
  ];
}
