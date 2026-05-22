"use client";

import { THEMES } from "@/lib/theme";
import { useSiteTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

type ThemeSwitcherProps = {
  className?: string;
  /** Fixed bottom-left corner (site-wide) */
  floating?: boolean;
};

export function ThemeSwitcher({ className, floating = false }: ThemeSwitcherProps) {
  const { theme, setTheme } = useSiteTheme();

  return (
    <div
      className={cn(
        "inline-flex shrink-0 gap-1 rounded-xl border border-border bg-card/95 p-1 shadow-lg backdrop-blur-md",
        floating && "fixed bottom-4 left-4 z-[60] sm:bottom-6 sm:left-6",
        className
      )}
      role="group"
      aria-label="Site theme"
    >
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTheme(t.id)}
          title={t.description}
          aria-label={t.label}
          aria-pressed={theme === t.id}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200",
            theme === t.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <i className={cn("fa text-lg leading-none", t.iconClass)} aria-hidden />
        </button>
      ))}
    </div>
  );
}
