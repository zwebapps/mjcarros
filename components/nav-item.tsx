"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface NavItemProps {
  href: string;
  label: string;
  isActive?: boolean;
}

export const NavItem = ({ href, label, isActive }: NavItemProps) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for user in localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Hide admin link for non-admin users
  if (href === '/admin' && (!user || user.role !== 'ADMIN')) {
    return null;
  }

  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium transition-colors hover:text-primary",
        isActive ? "text-black dark:text-white" : "text-muted-foreground"
      )}
    >
      {label}
    </Link>
  );
};
