import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { useAppearance } from '@/hooks/use-appearance';
import { Button } from '@/components/ui/button';

const subscribe = () => () => {};

export function ThemeToggle({
  lightLabel = 'Switch to light mode',
  darkLabel = 'Switch to dark mode',
}: {
  lightLabel?: string;
  darkLabel?: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  // Keep the first client render identical to SSR, even with a saved dark theme.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
  const label = mounted && resolvedTheme === 'dark' ? lightLabel : darkLabel;
  // The admin fixed light/dark for everyone.
  const { colorModeForced } = useAppearance();
  if (colorModeForced) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-11"
      aria-label={label}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
      <span className="sr-only">{label}</span>
    </Button>
  );
}
