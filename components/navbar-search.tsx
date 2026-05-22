"use client";
import { SearchIcon } from "lucide-react";
import { Input } from "./ui/input";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

function shopHrefWithQuery(searchQueryString: string): string {
  return searchQueryString ? `/shop?${searchQueryString}` : "/shop";
}

function currentShopHref(
  pathname: string | null,
  searchParams: ReturnType<typeof useSearchParams>
): string | null {
  if (pathname !== "/shop") return null;
  const qs = searchParams?.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

const NavbarSearch = ({
  className,
  onDarkNav = false,
}: {
  className?: string;
  /** Light input styling when rendered inside the navy top bar (Showroom) */
  onDarkNav?: boolean;
}) => {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchChange();
    }
  };

  useEffect(() => {
    if (pathname !== "/shop") setSearch("");
  }, [pathname]);

  useEffect(() => {
    if (searchStr) setSearch(searchStr);
  }, [searchStr]);

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
    <div
      className={cn(
        "relative w-full min-w-0 max-w-full sm:max-w-sm lg:min-w-[16rem] lg:max-w-md xl:max-w-lg",
        className
      )}
    >
      <Input
        className={cn(
          "h-10 w-full rounded-lg pr-10 text-sm",
          onDarkNav
            ? "border-white/20 bg-white/10 text-white placeholder:text-white/50"
            : "border-input bg-background text-foreground placeholder:text-muted-foreground"
        )}
        placeholder="Search vehicles…"
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        value={search}
        aria-label="Search vehicles"
      />
      <button
        type="button"
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1",
          onDarkNav
            ? "text-white/70 hover:text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={handleSearchChange}
        aria-label="Search"
      >
        <SearchIcon className="h-4 w-4 shrink-0" />
      </button>
    </div>
  );
};

export default NavbarSearch;
