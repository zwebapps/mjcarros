"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { ChangeEvent } from "react";

interface Category {
  id: string;
  category: string;
}

interface SidebarItemsProps {
  categories: Category[];
}

const SidebarItems: React.FC<SidebarItemsProps> = ({ categories }) => {
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
          <option value="/shop">All</option>
          {categories?.map((category) => (
            <option key={category.id} value={`/shop/${category.category}`}>
              {category.category.charAt(0).toUpperCase() + category.category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop links */}
      <div className="hidden lg:block space-y-2">
        <Link href="/shop">
          <p
            className={`text-sm font-medium hover:text-blue-600 transition-colors ${
              pathName === "/shop" ? "text-blue-600" : "text-gray-600"
            }`}
          >
            All
          </p>
        </Link>
        {categories?.map((category) => (
          <Link key={category.id} href={`/shop/${category.category}`}>
            <p
              className={`text-sm font-medium hover:text-blue-600 transition-colors ${
                pathName === `/shop/${category.category}`
                  ? "text-blue-600"
                  : "text-gray-600"
              }`}
            >
              {category.category.charAt(0).toUpperCase() + category.category.slice(1)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SidebarItems;
