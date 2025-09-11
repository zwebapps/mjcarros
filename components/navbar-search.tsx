"use client";
import { SearchIcon } from "lucide-react";
import { Input } from "./ui/input";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const NavbarSearch = () => {
  const [search, setSearch] = useState<string>("");

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchStr = searchParams.get("q");

  const handleSearchChange = async () => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    const value = search.trim();
    if (value.length >= 3) {
      current.set("q", value);
    } else {
      current.delete("q");
    }

    const searchq = current.toString();
    const query = searchq ? `?${searchq}` : "";

    await router.replace(`/shop${query}`);
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
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      if (value.length >= 3) {
        current.set("q", value);
      } else {
        current.delete("q");
      }
      const searchq = current.toString();
      const query = searchq ? `?${searchq}` : "";
      router.replace(`/shop${query}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, pathname, searchParams, router]);

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
