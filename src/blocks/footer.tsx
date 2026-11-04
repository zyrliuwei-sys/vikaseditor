import { getRouteApi } from '@tanstack/react-router';

import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { openCookieSettings } from '@/lib/cookie-consent';
import { m } from '@/paraglide/messages.js';
import { FooterBadgeList } from '@/components/footer-badge-list';

const rootRoute = getRouteApi('__root__');
export function Footer() {
  const consentEnabled = !!rootRoute.useLoaderData()?.cookieConsentEnabled;
  const groups = [
    {
      title: m['vikas.footer.create'](),
      links: [
        { href: '/create/image', label: m['vikas.nav.image']() },
        { href: '/create/video', label: m['vikas.nav.video']() },
        { href: '/settings', label: m['landing.footer.settings']() },
      ],
    },
    {
      title: m['vikas.footer.explore'](),
      links: [
        { href: '/#templates', label: m['vikas.nav.templates']() },
        { href: '/#how-it-works', label: m['vikas.nav.how']() },
        { href: '/#guides', label: m['vikas.guides.eyebrow']() },
        { href: '/pricing', label: m['vikas.footer.credits']() },
      ],
    },
    {
      title: m['vikas.footer.legal'](),
      cookieSettings: true,
      links: [
        { href: '/privacy-policy', label: m['landing.footer.privacy']() },
        { href: '/terms-of-service', label: m['landing.footer.terms']() },
        {
          href: 'mailto:support@vikas-editor.net',
          label: m['landing.footer.support'](),
        },
      ],
    },
  ];
  return (
    <footer className="vikas-footer">
      <div className="vikas-footer-main">
        <div className="vikas-footer-brand">
          <Link href="/" className="vikas-brand">
            <img src={envConfigs.app_logo} alt="" width="32" height="32" />
            <span>{envConfigs.app_name}</span>
          </Link>
          <p>{m['vikas.footer.tagline']()}</p>
          <small>{m['vikas.footer.independent']()}</small>
        </div>
        {groups.map((group) => (
          <div className="vikas-footer-column" key={group.title}>
            <h3>{group.title}</h3>
            {group.links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
            {group.cookieSettings && consentEnabled && (
              <button
                type="button"
                className="text-muted-foreground hover:text-primary inline-flex min-h-10 items-center text-left"
                onClick={openCookieSettings}
              >
                {m['landing.footer.cookie_settings']()}
              </button>
            )}
          </div>
        ))}
      </div>
      <FooterBadgeList className="mt-7" />
    </footer>
  );
}
