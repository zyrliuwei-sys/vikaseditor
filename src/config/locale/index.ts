// Locale display names for the language switcher UI.
// Locales themselves are defined in project.inlang/settings.json and
// exposed at runtime via @/paraglide/runtime.js (locales, baseLocale).
export const localeNames: Record<string, string> = {
  en: 'English',
  zh: '中文',
};

// Keep translated URLs available while English is the only promoted language.
export const showLocaleSwitcher = false;
