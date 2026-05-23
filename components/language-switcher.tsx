"use client";

import { cn } from "@/lib/utils";
import { type Locale } from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";

const options: { value: Locale; label: string }[] = [
  { value: "pt", label: "PT" },
  { value: "en", label: "EN" },
];

type LanguageSwitcherProps = {
  className?: string;
  compact?: boolean;
};

export function LanguageSwitcher({
  className,
  compact = true,
}: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="group"
      aria-label={t("lang.label")}
    >
      {!compact && (
        <span className="mr-1 text-xs font-medium text-nav-foreground/70">
          {t("lang.label")}
        </span>
      )}
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setLocale(opt.value)}
          className={cn(
            "min-w-[2.25rem] rounded-md px-2 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors",
            locale === opt.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-nav-foreground/80 hover:bg-primary/15 hover:text-primary"
          )}
          aria-pressed={locale === opt.value}
          title={opt.value === "pt" ? t("lang.pt") : t("lang.en")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
