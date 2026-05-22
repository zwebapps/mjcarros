"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  User,
  LogOut,
  LogIn,
  Menu,
} from "lucide-react";
import useCart from "@/hooks/use-cart";
import NavbarSearch from "./navbar-search";
import Logo from "./Logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/featured", label: "Featured" },
  { href: "/contact", label: "Contact" },
] as const;

function NavLink({
  href,
  label,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "nav-link",
        active
          ? "nav-link-active"
          : "text-nav-foreground/85 hover:bg-primary/15 hover:text-primary"
      )}
    >
      {label}
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const cart = useCart();

  const ordersHref = user ? "/orders" : "/orders/guest";
  const ordersLabel = user ? "Orders" : "Track orders";

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleSignOut = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    setUser(null);
    window.location.href = "/";
  };

  const isActive = (path: string) => pathname === path;

  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 border-b border-white/10 bg-nav text-nav-foreground backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
          <Logo />
          <div className="ml-auto h-9 w-28 animate-pulse rounded-lg bg-muted" />
        </div>
      </header>
    );
  }

  const authBlock = (
    <>
      {user ? (
        <>
          <span className="hidden max-w-[8rem] truncate text-sm text-nav-foreground/80 xl:inline">
            {user.name}
          </span>
          {user.role === "ADMIN" && (
            <Link href="/admin">
              <Button size="sm" variant="brand" className="shrink-0">
                Admin
              </Button>
            </Link>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="shrink-0 text-nav-foreground hover:bg-white/10 hover:text-primary"
            onClick={handleSignOut}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <>
          <Link href="/sign-in" className="shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="hidden text-nav-foreground hover:bg-white/10 hover:text-primary sm:inline-flex"
            >
              <LogIn className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden whitespace-nowrap md:inline">Sign in</span>
            </Button>
          </Link>
          <Link href="/sign-up" className="shrink-0">
            <Button size="sm" variant="default">
              <User className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden whitespace-nowrap md:inline">Sign up</span>
            </Button>
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-nav text-nav-foreground backdrop-blur-md supports-[backdrop-filter]:bg-nav/95">
      {/* Mobile-first: logo + actions */}
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:h-16 sm:gap-3 sm:px-6 lg:px-8">
        <div className="shrink-0">
          <Logo />
        </div>

        {/* Desktop: inline nav (single line, no wrap) */}
        <nav
          className="hidden min-w-0 flex-1 items-center gap-0.5 lg:flex lg:gap-1"
          aria-label="Main"
        >
          {navLinks.map(({ href, label }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              active={isActive(href)}
            />
          ))}
          <NavLink
            href={ordersHref}
            label={ordersLabel}
            active={isActive(ordersHref)}
          />
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden lg:block">
            <NavbarSearch onDarkNav />
          </div>

          <Link href="/cart" className="shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="px-2 text-nav-foreground hover:bg-white/10 hover:text-primary sm:px-3"
            >
              <ShoppingCart className="h-5 w-5 shrink-0" />
              <span className="ml-1 text-sm font-medium tabular-nums leading-none">
                {cart.items.length}
              </span>
            </Button>
          </Link>

          <div className="hidden items-center gap-1.5 sm:flex">{authBlock}</div>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 border-white/25 px-2.5 text-nav-foreground hover:bg-white/10 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-[min(100vw-2rem,20rem)] flex-col gap-0 p-0">
              <SheetHeader className="border-b border-border px-4 py-4 text-left">
                <SheetTitle className="text-base font-semibold">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
                <NavbarSearch />
                <nav className="flex flex-col gap-1" aria-label="Mobile">
                  {navLinks.map(({ href, label }) => (
                    <NavLink
                      key={href}
                      href={href}
                      label={label}
                      active={isActive(href)}
                      onNavigate={() => setMenuOpen(false)}
                    />
                  ))}
                  <NavLink
                    href={ordersHref}
                    label={ordersLabel}
                    active={isActive(ordersHref)}
                    onNavigate={() => setMenuOpen(false)}
                  />
                </nav>
                <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
                  {user ? (
                    <>
                      <p className="truncate text-sm text-muted-foreground">{user.name}</p>
                      {user.role === "ADMIN" && (
                        <Link href="/admin" onClick={() => setMenuOpen(false)}>
                          <Button className="w-full" size="sm" variant="brand">
                            Admin
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleSignOut}
                      >
                        Sign out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/sign-in" onClick={() => setMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full">
                          Sign in
                        </Button>
                      </Link>
                      <Link href="/sign-up" onClick={() => setMenuOpen(false)}>
                        <Button size="sm" className="w-full">
                          Sign up
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile / tablet search */}
      <div className="border-t border-white/10 px-4 py-2.5 lg:hidden">
        <NavbarSearch onDarkNav />
      </div>
    </header>
  );
}
