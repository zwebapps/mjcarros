"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";

const cache = new Map<string, string>();

function cacheKey(locale: Locale, text: string) {
  return `${locale}:${text.slice(0, 80)}:${text.length}`;
}

async function fetchTranslation(text: string, target: Locale): Promise<string> {
  const key = cacheKey(target, text);
  const hit = cache.get(key);
  if (hit) return hit;

  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, target }),
  });

  if (!res.ok) return text;

  const data = (await res.json()) as { translated?: string };
  const translated =
    typeof data.translated === "string" && data.translated.length > 0
      ? data.translated
      : text;

  cache.set(key, translated);
  return translated;
}

/** When locale is PT, translate English admin content on the client. EN returns source text. */
export function useTranslatedText(text: string, locale: Locale): string {
  const [result, setResult] = useState(text);

  useEffect(() => {
    if (!text?.trim() || locale === "en") {
      setResult(text);
      return;
    }

    let cancelled = false;
    setResult(text);

    void fetchTranslation(text, locale).then((translated) => {
      if (!cancelled) setResult(translated);
    });

    return () => {
      cancelled = true;
    };
  }, [text, locale]);

  return result;
}
