"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface CategoryWithCount {
  _id?: string;
  id: string;
  category: string;
  count?: number;
}

interface SidebarItemsProps {
  categories: CategoryWithCount[];
  totalCount?: number;
}

const SidebarItems: React.FC<SidebarItemsProps> = ({ categories, totalCount }) => {
  const pathName = usePathname();
  const router = useRouter();
  const toSlug = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9_-]/g, "");

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedCategory = event.target.value;
    if (selectedCategory === "/shop") {
      router.push("/shop");
    } else {
      router.push(selectedCategory);
    }
  };

  const isAllActive = pathName === "/shop";

  return (
    <div className="space-y-3">
      <div className="lg:hidden">
        <select
          onChange={handleSelectChange}
          className="w-full rounded-md border border-border bg-card p-2.5 text-sm font-medium text-foreground"
          value={pathName?.startsWith("/shop/") ? pathName : "/shop"}
        >
          <option value="/shop">All ({totalCount ?? 0})</option>
          {categories?.map((category) => (
            <option
              key={category._id || category.id}
              value={`/shop/${encodeURIComponent(toSlug(category.category))}`}
            >
              {category.category.charAt(0).toUpperCase() + category.category.slice(1)} ({category.count ?? 0})
            </option>
          ))}
        </select>
      </div>

      <nav className="shop-category-list hidden lg:flex" aria-label="Shop categories">
        <Link href="/shop" className="block">
          <span
            className={cn(
              "shop-category-item",
              isAllActive && "shop-category-item-active"
            )}
          >
            <span>All</span>
            <span className="shop-category-count">({totalCount ?? 0})</span>
            {isAllActive && <ChevronRight className="h-4 w-4 shrink-0 opacity-90" aria-hidden />}
          </span>
        </Link>
        {categories?.map((category) => {
          const href = `/shop/${encodeURIComponent(toSlug(category.category))}`;
          const active = pathName === href;
          const label =
            category.category.charAt(0).toUpperCase() + category.category.slice(1);

          return (
            <Link key={category._id || category.id} href={href} className="block">
              <span
                className={cn(
                  "shop-category-item",
                  active && "shop-category-item-active"
                )}
              >
                <span className="truncate">{label}</span>
                <span className="shop-category-count shrink-0">({category.count ?? 0})</span>
                {active && (
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                )}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default SidebarItems;
