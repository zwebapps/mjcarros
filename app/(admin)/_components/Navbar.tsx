"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, Search, Shield, User } from "lucide-react";
import Link from "next/link";
import { useNotifications } from "@/hooks/use-notifications";
import { SidebarToggle } from "./sidebar-toggle";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

type NavbarProps = {
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
};

export function Navbar({ sidebarCollapsed, onSidebarToggle }: NavbarProps) {
  const [user, setUser] = useState<User | null>(null);
  const { data: notifications } = useNotifications(true);
  const unread = notifications?.filter((n) => !n.read).length ?? 0;

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
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    setUser(null);
    // Redirect to home page
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 flux-frosted flux-shadow">
      <div className="mx-auto flex h-16 items-center gap-4 px-4 md:px-6">
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
          {onSidebarToggle != null && sidebarCollapsed != null && (
            <SidebarToggle collapsed={sidebarCollapsed} onToggle={onSidebarToggle} />
          )}
          <Shield className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">Admin</span>
        </div>

        <div className="flex-1">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="admin-input pl-9 pr-3 flux-glow"
              placeholder="Search orders, customers, vehicles…"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/payments"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-foreground/80 shadow-sm transition hover:bg-muted/40 flux-glow"
            aria-label="Payments and notifications"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                {Math.min(unread, 99)}
              </span>
            )}
          </Link>

          {user && (
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 shadow-sm flux-glow">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="leading-tight">
                <div className="text-sm font-medium text-foreground">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
            </div>
          )}

          <Button size="sm" variant="outline" onClick={handleSignOut} className="rounded-xl">
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
