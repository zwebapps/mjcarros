"use client";

import NavItem from "./nav-item";
import Logo from "@/components/Logo";

export type SidebarProps = {
  collapsed: boolean;
};

export default function Sidebar({ collapsed }: SidebarProps) {
  return (
    <aside className="h-full w-full bg-slate-950 text-slate-100">
      <div
        className={[
          "flex h-16 items-center border-b border-white/10 flux-dot-grid",
          collapsed ? "justify-center px-3" : "gap-3 px-5",
        ].join(" ")}
      >
        <div className="shrink-0">
          <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-1 flux-glow">
            <Logo size="compact" />
          </div>
        </div>
        {!collapsed && (
          <div className="leading-tight min-w-0">
            <div className="text-sm font-semibold flux-gradient-text truncate">MJ Carros</div>
            <div className="text-xs text-slate-300 truncate">Admin Console</div>
          </div>
        )}
      </div>
      <div className="px-3 py-4">
        <NavItem collapsed={collapsed} />
      </div>
    </aside>
  );
}
