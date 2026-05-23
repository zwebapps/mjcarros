import en from "./messages/en.json";
import pt from "./messages/pt.json";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  type Locale,
  resolveLocale,
} from "./config";

export * from "./config";

const messages: Record<Locale, typeof pt> = { pt, en };

export function getMessages(locale: Locale) {
  return messages[locale];
}

export function t(locale: Locale, key: string): string {
  const parts = key.split(".");
  let cur: unknown = messages[locale];
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return key;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : key;
}

export function readStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    return resolveLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function storeLocale(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale === "pt" ? "pt-PT" : "en";
  } catch {
    /* ignore */
  }
}

export type LocalizableProduct = {
  title: string;
  description: string;
  titlePt?: string | null;
  descriptionPt?: string | null;
};

/** Portuguese UI uses PT fields when set; otherwise falls back to English content from admin. */
export function localizeProduct<T extends LocalizableProduct>(
  product: T,
  locale: Locale
): T {
  if (locale === "en") return product;
  return {
    ...product,
    title: product.titlePt?.trim() || product.title,
    description: product.descriptionPt?.trim() || product.description,
  };
}
