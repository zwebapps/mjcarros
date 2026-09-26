"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "../_components/Navbar";
import Sidebar from "../_components/Sidebar";
import type React from "react";

import { isAdminRole } from "@/lib/roles";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check for user in localStorage
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');
    const storedCollapsed = localStorage.getItem("adminSidebarCollapsed");

    if (!userData || !token) {
      router.push('/sign-in');
      return;
    }

    try {
      const userObj = JSON.parse(userData);
      if (!isAdminRole(userObj.role)) {
        router.push('/');
        return;
      }
      setUser(userObj);
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      router.push('/sign-in');
      return;
    }

    setSidebarCollapsed(storedCollapsed === "1");
    setIsLoading(false);
  }, [router]);

  const setCollapsed = (next: boolean) => {
    setSidebarCollapsed(next);
    localStorage.setItem("adminSidebarCollapsed", next ? "1" : "0");
  };

  if (isLoading) {
    return (
      <div className="admin-theme h-full bg-background text-foreground">
        <div className="flex h-full">
          <div
            className={[
              "hidden md:flex md:flex-col md:fixed md:inset-y-0 z-[80] bg-slate-950",
              sidebarCollapsed ? "md:w-20" : "md:w-72",
            ].join(" ")}
          >
            <div className="animate-pulse bg-white/5 h-full w-full"></div>
          </div>
          <div className={sidebarCollapsed ? "md:pl-20" : "md:pl-72"}>
            <div className="animate-pulse bg-card/60 h-16 w-full border-b border-border/70"></div>
            <div className="animate-pulse bg-background h-full w-full p-8">
              <div className="animate-pulse bg-card h-8 w-32 rounded mb-4"></div>
              <div className="animate-pulse bg-card h-4 w-64 rounded mb-2"></div>
              <div className="animate-pulse bg-card h-4 w-48 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="admin-theme min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen flux-dot-grid">
        <div
          className={[
            "hidden md:flex md:flex-col md:fixed md:inset-y-0 z-[80]",
            sidebarCollapsed ? "md:w-20" : "md:w-72",
          ].join(" ")}
        >
          <Sidebar collapsed={sidebarCollapsed} />
        </div>
        <div className={[sidebarCollapsed ? "md:pl-20" : "md:pl-72", "flex-1 w-full min-w-0"].join(" ")}>
          <Navbar
            sidebarCollapsed={sidebarCollapsed}
            onSidebarToggle={() => setCollapsed(!sidebarCollapsed)}
          />
          <main className="px-4 py-6 md:px-8 md:py-8 w-full">
            <div className="mx-auto w-full max-w-[1400px] animate-in fade-in-50 duration-300">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
