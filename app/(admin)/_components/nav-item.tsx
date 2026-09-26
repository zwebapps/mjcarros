"use client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  Tag,
  FileText,
  Settings,
  Image,
  Users,
  Globe,
  Building2,
  Wallet,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const routes: Array<{ label: string; href: string; icon: React.ReactNode }> = [
  {
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    href: `/admin`,
  },
  {
    label: "Orders",
    icon: <FileText className="h-4 w-4" />,
    href: `/admin/orders`,
  },
  {
    label: "Import pipeline",
    icon: <Globe className="h-4 w-4" />,
    href: `/admin/imports`,
  },
  {
    label: "Dealers",
    icon: <Building2 className="h-4 w-4" />,
    href: `/admin/dealers`,
  },
  {
    label: "Payments",
    icon: <Wallet className="h-4 w-4" />,
    href: `/admin/payments`,
  },
  {
    label: "Products",
    icon: <Package className="h-4 w-4" />,
    href: `/admin/products`,
  },
  {
    label: "Billboards",
    icon: <Image className="h-4 w-4" />,
    href: `/admin/billboards`,
  },
  {
    label: "Categories",
    icon: <Tag className="h-4 w-4" />,
    href: `/admin/categories`,
  },
  // Sizes removed for cars
  {
    label: "Manage Users",
    icon: <Users className="h-4 w-4" />,
    href: `/admin/users`,
  },
  {
    label: "Settings",
    icon: <Settings className="h-4 w-4" />,
    href: `/admin/settings`,
  },
];

const NavItem = ({ collapsed }: { collapsed: boolean }) => {
  const router = useRouter();
  const pathname = usePathname();

  const onClickHandler = (href: string) => {
    router.push(href);
  };

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/admin" && pathname?.startsWith(`${href}/`)) ||
    pathname?.startsWith(`${href}/new`);

  return (
    <div className="flex flex-col flex-start gap-1.5">
      {routes.map((route) => (
        <Button
          onClick={() => onClickHandler(route.href)}
          key={route.href}
          size="sm"
          variant="ghost"
          title={collapsed ? route.label : undefined}
          className={[
            "w-full justify-start font-normal text-slate-200 hover:text-white",
            "hover:bg-white/8",
            "transition-colors",
            collapsed ? "px-0 justify-center" : "",
            isActive(route.href)
              ? "bg-indigo-500/15 text-indigo-100 border border-indigo-400/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] flux-glow"
              : "border border-transparent",
          ].join(" ")}
        >
          <span className={collapsed ? "" : "mr-2"}>{route.icon}</span>
          {collapsed ? <span className="sr-only">{route.label}</span> : route.label}
        </Button>
      ))}
    </div>
  );
};

export default NavItem;
