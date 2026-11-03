import { useLocation } from '@tanstack/react-router';

import { useSession } from '@/core/auth/client';
import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import { VikasNavigation } from '@/components/vikas/navigation';

import '@/styles/vikas.css';

export function Header() {
  const { data: session } = useSession();
  const location = useLocation();
  const activeHref =
    location.pathname === '/create'
      ? `/create?mode=${location.search.mode === 'video' ? 'video' : 'image'}`
      : location.pathname;
  return (
    <VikasNavigation
      brand={envConfigs.app_name}
      logo={envConfigs.app_logo}
      user={session?.user}
      activeHref={activeHref}
      links={[
        { href: '/#templates', label: m['vikas.nav.templates']() },
        { href: '/create?mode=image', label: m['vikas.nav.image']() },
        { href: '/create?mode=video', label: m['vikas.nav.video']() },
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
      }}
    />
  );
}
