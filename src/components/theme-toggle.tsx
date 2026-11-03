import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { useAppearance } from '@/hooks/use-appearance';
import { Button } from '@/components/ui/button';

export function ThemeToggle({
  lightLabel = 'Switch to light mode',
  darkLabel = 'Switch to dark mode',
}: {
  lightLabel?: string;
  darkLabel?: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  // The admin fixed light/dark for everyone.
  const { colorModeForced } = useAppearance();
  if (colorModeForced) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-11"
      aria-label={resolvedTheme === 'dark' ? lightLabel : darkLabel}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
      <span className="sr-only">
        {resolvedTheme === 'dark' ? lightLabel : darkLabel}
      </span>
    </Button>
  );
}
