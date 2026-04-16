"use client";
import { SearchIcon } from "lucide-react";
import { Input } from "./ui/input";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function shopHrefWithQuery(searchQueryString: string): string {
  return searchQueryString ? `/shop?${searchQueryString}` : "/shop";
}

/** Avoid `router.replace` when the href is unchanged — a no-op replace still re-fetches RSC and can flash/remount the shop layout (sidebar). */
function currentShopHref(
  pathname: string | null,
  searchParams: ReturnType<typeof useSearchParams>
): string | null {
  if (pathname !== "/shop") return null;
  const qs = searchParams?.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

const NavbarSearch = () => {
  const [search, setSearch] = useState<string>("");

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchStr = searchParams?.get("q") || "";
  const searchParamsKey = useMemo(() => searchParams?.toString() ?? "", [searchParams]);

  const handleSearchChange = async () => {
    const current = new URLSearchParams(Array.from(searchParams?.entries() || []));

    const value = search.trim();
    if (value.length >= 3) {
      current.set("q", value);
    } else {
      current.delete("q");
    }

    const searchq = current.toString();
    const nextHref = shopHrefWithQuery(searchq);
    const cur = currentShopHref(pathname, searchParams);
    if (cur !== null && nextHref === cur) return;

    await router.replace(nextHref);
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      handleSearchChange();
    }
  };

  useEffect(() => {
    if (pathname !== "/shop") setSearch("");
  }, [pathname]);

  useEffect(() => {
    if (searchStr) setSearch(searchStr);
  }, [searchStr, setSearch]);

  // Debounce typing and only search when 3+ chars
  useEffect(() => {
    if (pathname !== "/shop") return;
    const timer = setTimeout(() => {
      const value = search.trim();
      const current = new URLSearchParams(Array.from(searchParams?.entries() || []));
      if (value.length >= 3) {
        current.set("q", value);
      } else {
        current.delete("q");
      }
      const searchq = current.toString();
      const nextHref = shopHrefWithQuery(searchq);
      const cur = currentShopHref(pathname, searchParams);
      if (cur !== null && nextHref === cur) return;

      router.replace(nextHref);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, pathname, searchParamsKey, router, searchParams]);

  return (
    <div className="flex mx-auto relative">
      <Input
        size={35}
        className="pr-12 outline-none rounded-xl bg-transparent text-black placeholder-black/60 border border-transparent focus:border-black focus-visible:ring-0 focus-visible:ring-offset-0"
        placeholder="Search for products (min 3 chars)..."
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        value={search}
      />
      <SearchIcon
        size={20}
        className="absolute right-0 mr-4 top-1/2 transform -translate-y-1/2"
        onClick={handleSearchChange}
      />
    </div>
  );
};

export default NavbarSearch;
