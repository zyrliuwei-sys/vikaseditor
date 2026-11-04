import { useLocation } from '@tanstack/react-router';

import { useSession } from '@/core/auth/client';
import { usePathname } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import { VikasNavigation } from '@/components/vikas/navigation';

import '@/styles/vikas.css';
import '@/styles/vikas-guides.css';

export function Header() {
  const { data: session } = useSession();
  const location = useLocation();
  const pathname = usePathname();
  const activeHref =
    pathname === '/create'
      ? `/create/${location.search.mode === 'video' ? 'video' : 'image'}`
      : pathname;
  return (
    <VikasNavigation
      brand={envConfigs.app_name}
      logo={envConfigs.app_logo}
      user={session?.user}
      activeHref={activeHref}
      links={[
        { href: '/#templates', label: m['vikas.nav.templates']() },
        { href: '/create/image', label: m['vikas.nav.image']() },
        { href: '/create/video', label: m['vikas.nav.video']() },
        { href: '/pricing', label: m['vikas.footer.credits']() },
      ]}
      copy={{
        signIn: m['vikas.nav.signin'](),
        start: m['vikas.nav.start'](),
        openMenu: m['vikas.nav.menu'](),
        closeMenu: m['vikas.nav.close'](),
        skip: m['vikas.nav.skip'](),
        lightTheme: m['vikas.nav.light_theme'](),
        darkTheme: m['vikas.nav.dark_theme'](),
        language: m['common.language.switch'](),
      }}
    />
  );
}
