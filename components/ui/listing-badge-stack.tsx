import { cn } from "@/lib/utils";

type ListingBadgeStackProps = {
  category?: string;
  featured?: boolean;
  sold?: boolean;
  className?: string;
};

/** Category + Featured pills stacked vertically, top-right on listing images */
export function ListingBadgeStack({
  category,
  featured,
  sold,
  className,
}: ListingBadgeStackProps) {
  const label = category?.trim();
  const showCategory = !!label;
  const showFeatured = !!featured && !sold;

  if (!showCategory && !showFeatured) return null;

  return (
    <div
      className={cn(
        "absolute right-2 top-2 z-[11] flex flex-col items-end gap-1.5",
        className
      )}
    >
      {showCategory && (
        <span className="listing-badge listing-badge-category">
          {formatCategoryLabel(label)}
        </span>
      )}
      {showFeatured && (
        <span className="listing-badge listing-badge-featured">Featured</span>
      )}
    </div>
  );
}

function formatCategoryLabel(category: string): string {
  const c = category.trim();
  if (!c) return c;
  return c.charAt(0).toUpperCase() + c.slice(1);
}
