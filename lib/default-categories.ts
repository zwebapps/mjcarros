import defaultCategoriesJson from "@/data/default-categories.json";

export type DefaultCategorySeed = { name: string; description: string };

export const DEFAULT_CATEGORY_SEED: DefaultCategorySeed[] = defaultCategoriesJson;

/** Display order for the shop sidebar: seeded categories first, then admin-added (sorted A–Z). */
export const DEFAULT_CATEGORY_ORDER: string[] = DEFAULT_CATEGORY_SEED.map((c) => c.name);

/** Sort category rows: default list order first, then any other categories alphabetically. */
export function sortCategoriesForDisplay<T extends { category: string }>(items: T[]): T[] {
  const defaultSet = new Set(DEFAULT_CATEGORY_ORDER);
  const first: T[] = [];
  for (const name of DEFAULT_CATEGORY_ORDER) {
    const row = items.find((i) => i.category === name);
    if (row) first.push(row);
  }
  const rest = items
    .filter((i) => !defaultSet.has(i.category))
    .sort((a, b) => a.category.localeCompare(b.category));
  return [...first, ...rest];
}
