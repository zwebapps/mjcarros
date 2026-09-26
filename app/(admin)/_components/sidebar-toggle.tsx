"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

type SidebarToggleProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function SidebarToggle({ collapsed, onToggle }: SidebarToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
        "text-muted-foreground transition hover:bg-muted/50 hover:text-foreground",
        "focus:outline-none focus-visible:ring-0",
      ].join(" ")}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {collapsed ? (
        <PanelLeftOpen className="h-4 w-4" />
      ) : (
        <PanelLeftClose className="h-4 w-4" />
      )}
    </button>
  );
}
