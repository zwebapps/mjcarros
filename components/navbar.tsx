"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, LogOut, LogIn } from "lucide-react";
import useCart from "@/hooks/use-cart";
// import { NavbarActions } from "./navbar-actions";
import NavbarSearch from "./navbar-search";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const cart = useCart();

  useEffect(() => {
    // Check for user in localStorage on component mount
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      }
    }
    setIsLoading(false);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    setUser(null);
    // Optionally redirect to home page
    window.location.href = '/';
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  if (isLoading) {
    return (
      <div className="border-b bg-orange-500">
        <div className="flex h-16 items-center px-4">
          <div className="animate-pulse bg-orange-200 h-8 w-32 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b bg-orange-500">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4 lg:space-x-6">
          <Link
            href="/"
            className={`group text-sm font-medium transition-colors ${
              isActive("/") ? "text-black" : "text-black/80 hover:text-black"
            }`}
          >
            <span className="relative inline-block">
              Home
              <span className="absolute left-0 -bottom-0.5 h-[2px] w-0 bg-black transition-all duration-300 group-hover:w-full" />
            </span>
          </Link>
          <Link
            href="/shop"
            className={`group text-sm font-medium transition-colors ${
              isActive("/shop") ? "text-black" : "text-black/80 hover:text-black"
            }`}
          >
            <span className="relative inline-block">
              Shop
              <span className="absolute left-0 -bottom-0.5 h-[2px] w-0 bg-black transition-all duration-300 group-hover:w-full" />
            </span>
          </Link>
          <Link
            href="/featured"
            className={`group text-sm font-medium transition-colors ${
              isActive("/featured") ? "text-black" : "text-black/80 hover:text-black"
            }`}
          >
            <span className="relative inline-block">
              Featured
              <span className="absolute left-0 -bottom-0.5 h-[2px] w-0 bg-black transition-all duration-300 group-hover:w-full" />
            </span>
          </Link>
          <Link
            href="/contact"
            className={`group text-sm font-medium transition-colors ${
              isActive("/contact") ? "text-black" : "text-black/80 hover:text-black"
            }`}
          >
            <span className="relative inline-block">
              Contact
              <span className="absolute left-0 -bottom-0.5 h-[2px] w-0 bg-black transition-all duration-300 group-hover:w-full" />
            </span>
          </Link>
          <Link
            href={user ? "/orders" : "/orders/guest"}
            className={`group text-sm font-medium transition-colors ${
              isActive("/orders") ? "text-black" : "text-black/80 hover:text-black"
            }`}
          >
            <span className="relative inline-block">
              {user ? "Orders" : "Track Orders"}
              <span className="absolute left-0 -bottom-0.5 h-[2px] w-0 bg-black transition-all duration-300 group-hover:w-full" />
            </span>
          </Link>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <NavbarSearch />
          <Link href="/cart">
            <Button size="sm" variant="ghost" className="text-black hover:text-black/80">
              <ShoppingCart className="h-5 w-5" />
              <span className="ml-2 text-sm font-medium">
                {cart.items.length}
              </span>
            </Button>
          </Link>
          {user ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-black">
                Hello, {user.name}
              </span>
              {user.role === 'ADMIN' && (
                <Link href="/admin">
                  <Button
                    size="sm"
                    className="bg-black text-white hover:bg-white hover:text-black border border-black"
                  >
                    Admin
                  </Button>
                </Link>
              )}
              <Button size="sm" variant="ghost" className="text-black hover:text-black/80" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/sign-in">
                <Button size="sm" variant="ghost" className="text-black hover:text-black/80">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="bg-black text-white hover:bg-black/90">
                  <User className="h-4 w-4 mr-2" />
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
