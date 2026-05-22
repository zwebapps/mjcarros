import SidebarProducts from "./_components/sidebar-products";
import ShopToolbar from "./_components/shop-toolbar";

// Layout must be dynamic too: if only `page.tsx` sets force-dynamic, Next can still
// statically prerender this layout at build time (empty Mongo → empty categories).
// Direct visits to `/shop` then show no categories; client nav to `/shop/[cat]` can look fine.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="page-canvas min-h-full w-full">
      <div className="shop-layout">
        <SidebarProducts />
        <div className="shop-main">
          <ShopToolbar />
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
