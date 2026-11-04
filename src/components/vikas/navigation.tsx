import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { showLocaleSwitcher } from '@/config/locale';
import { LocaleSelector } from '@/components/locale-selector';
import { SiteUserMenu } from '@/components/site-user-menu';
import { ThemeToggle } from '@/components/theme-toggle';

interface NavigationProps {
  brand: string;
  logo: string;
  activeHref?: string;
  links: { href: string; label: string }[];
  copy: {
    signIn: string;
    start: string;
    openMenu: string;
    closeMenu: string;
    skip: string;
    lightTheme: string;
    darkTheme: string;
    language: string;
  };
  user?: { name: string; email: string; image?: string | null };
}

export function VikasNavigation({
  brand,
  logo,
  links,
  copy,
  user,
  activeHref,
}: NavigationProps) {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setOpen(false);
      menuButton.current?.focus();
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);
  return (
    <>
      <a href="#main-content" className="vikas-skip">
        {copy.skip}
      </a>
      <header className="vikas-nav">
        <div className="vikas-nav-inner">
          <Link href="/" className="vikas-brand" aria-label={brand}>
            <img src={logo} alt="" width="33" height="33" />
            <span>{brand}</span>
          </Link>
          <nav className="vikas-desktop-links" aria-label={brand}>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={link.href === activeHref ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="vikas-nav-actions">
            <div className="vikas-theme-toggle">
              <ThemeToggle
                lightLabel={copy.lightTheme}
                darkLabel={copy.darkTheme}
              />
            </div>
            {showLocaleSwitcher && (
              <div className="vikas-language">
                <LocaleSelector label={copy.language} />
              </div>
            )}
            {user ? (
              <SiteUserMenu
                name={user.name}
                email={user.email}
                image={user.image}
              />
            ) : (
              <Link className="vikas-login" href="/sign-in">
                {copy.signIn}
              </Link>
            )}
            <Link href="/create" className="vikas-button vikas-button-small">
              {copy.start}
              <ArrowRight size={15} />
            </Link>
            <button
              ref={menuButton}
              className="vikas-menu-button"
              aria-label={open ? copy.closeMenu : copy.openMenu}
              aria-expanded={open}
              aria-controls="vikas-mobile-nav"
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {open && (
          <nav id="vikas-mobile-nav" className="vikas-mobile-links">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={link.href === activeHref ? 'page' : undefined}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="vikas-mobile-bottom">
              <LocaleSelector variant="pill" label={copy.language} />
              <ThemeToggle
                lightLabel={copy.lightTheme}
                darkLabel={copy.darkTheme}
              />
              {!user && <Link href="/sign-in">{copy.signIn}</Link>}
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
