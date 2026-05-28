"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { isDealerRole } from "@/lib/roles";
import { useNotifications } from "@/hooks/use-notifications";

export default function DealerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const { data: notifications } = useNotifications(ready);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("authToken");
    if (!userData || !token) {
      router.push("/sign-in");
      return;
    }
    try {
      const user = JSON.parse(userData);
      if (!isDealerRole(user.role)) {
        router.push("/");
        return;
      }
      setReady(true);
    } catch {
      router.push("/sign-in");
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        Loading dealer portal…
      </div>
    );
  }

  const nav = [
    { href: "/dealer", label: "Dashboard" },
    { href: "/dealer/imports", label: "My import leads" },
    { href: "/dealer/products", label: "My vehicles" },
  ];

  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="font-semibold text-lg">MJ Carros — Dealer</div>
        <nav className="flex gap-4 text-sm">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                pathname === item.href ? "text-sky-300" : "text-white/80 hover:text-white"
              }
            >
              {item.label}
            </Link>
          ))}
          {unread > 0 && (
            <span className="bg-red-500 text-xs px-2 py-0.5 rounded-full">{unread}</span>
          )}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </div>
  );
}
