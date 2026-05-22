export type SiteTheme = "clean" | "charcoal";

export const THEME_STORAGE_KEY = "mjcarros-theme";

export const THEMES: {
  id: SiteTheme;
  label: string;
  shortLabel: string;
  description: string;
  iconClass: string;
}[] = [
  {
    id: "clean",
    label: "Showroom",
    shortLabel: "Light",
    description: "Bright showroom theme",
    iconClass: "fa-sun-o",
  },
  {
    id: "charcoal",
    label: "Midnight",
    shortLabel: "Dark",
    description: "Dark midnight theme",
    iconClass: "fa-moon-o",
  },
];

export function getStoredTheme(): SiteTheme {
  if (typeof window === "undefined") return "clean";
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "clean" || v === "charcoal") return v;
  } catch {
    /* ignore */
  }
  return "clean";
}

export function applyTheme(theme: SiteTheme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}
