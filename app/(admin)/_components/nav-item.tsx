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
  Maximize2 
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const routes = [
  {
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4 mr-2" />,
    href: `/admin`,
  },
  {
    label: "Orders",
    icon: <FileText className="h-4 w-4 mr-2" />,
    href: `/admin/orders`,
  },
  {
    label: "Products",
    icon: <Package className="h-4 w-4 mr-2" />,
    href: `/admin/products`,
  },
  {
    label: "Billboards",
    icon: <Image className="h-4 w-4 mr-2" />,
    href: `/admin/billboards`,
  },
  {
    label: "Categories",
    icon: <Tag className="h-4 w-4 mr-2" />,
    href: `/admin/categories`,
  },
  // Sizes removed for cars
  {
    label: "Manage Users",
    icon: <Users className="h-4 w-4 mr-2" />,
    href: `/admin/users`,
  },
  {
    label: "Settings",
    icon: <Settings className="h-4 w-4 mr-2" />,
    href: `/admin/settings`,
  },
];

const NavItem = () => {
  const router = useRouter();
  const pathname = usePathname();

  const onClickHandler = (href: string) => {
    router.push(href);
  };

  return (
    <div className="flex flex-col flex-start">
      {routes.map((route) => (
        <Button
          onClick={() => onClickHandler(route.href)}
          key={route.href}
          size="sm"
          variant="ghost"
          className={`w-full text-white font-normal justify-start ${
            (pathname === route.href ||
              pathname.startsWith(`${route.href}/new`)) &&
            "bg-slate-600 text-sky-300"
          }`}
        >
          {route.icon}
          {route.label}
        </Button>
      ))}
    </div>
  );
};

export default NavItem;
