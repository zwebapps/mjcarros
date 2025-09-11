"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { ChangeEvent } from "react";

interface CategoryWithCount {
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

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedCategory = event.target.value;
    if (selectedCategory === "/shop") {
      router.push("/shop");
    } else {
      router.push(selectedCategory);
    }
  };

  return (
    <div className="space-y-3">
      {/* Mobile selector */}
      <div className="lg:hidden">
        <select
          onChange={handleSelectChange}
          className="w-full p-2 border border-gray-300 rounded-md text-sm"
          value={pathName.startsWith("/shop/") ? pathName : "/shop"}
        >
          <option value="/shop">All ({totalCount ?? 0})</option>
          {categories?.map((category) => (
            <option key={category.id} value={`/shop/${category.category}`}>
              {category.category.charAt(0).toUpperCase() + category.category.slice(1)} ({category.count ?? 0})
            </option>
          ))}
        </select>
      </div>

      {/* Desktop links */}
      <div className="hidden lg:block space-y-2">
        <Link href="/shop">
          <p
            className={`text-sm font-medium transition-colors ${
              pathName === "/shop" ? "text-amber-600" : "text-gray-600 hover:text-amber-600"
            }`}
          >
            All <span className="text-amber-600">({totalCount ?? 0})</span>
          </p>
        </Link>
        {categories?.map((category) => (
          <Link key={category.id} href={`/shop/${category.category}`}>
            <p
              className={`text-sm font-medium transition-colors ${
                pathName === `/shop/${category.category}`
                  ? "text-amber-600"
                  : "text-gray-600 hover:text-amber-600"
              }`}
            >
              {category.category.charAt(0).toUpperCase() + category.category.slice(1)}
              {" "}
              <span className="text-amber-600">({category.count ?? 0})</span>
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SidebarItems;
