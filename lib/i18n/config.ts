export const LOCALES = ["pt", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pt";
export const LOCALE_STORAGE_KEY = "mjcarros-locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "pt" || value === "en";
}

export function resolveLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function localeToIntl(locale: Locale): string {
  return locale === "pt" ? "pt-PT" : "en-GB";
}
