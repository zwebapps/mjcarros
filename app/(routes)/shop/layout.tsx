import SidebarProducts from "./_components/sidebar-products";
import SortItems from "./_components/sort-items";
import Footer from "@/components/footer";

// Layout must be dynamic too: if only `page.tsx` sets force-dynamic, Next can still
// statically prerender this layout at build time (empty Mongo → empty categories).
// Direct visits to `/shop` then show no categories; client nav to `/shop/[cat]` can look fine.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div className="min-h-full w-full py-5 sm:px-6 lg:px-12 flex max-sm:flex-col mx-auto max-w-none">
        <SidebarProducts />
        <div className="flex-1 p-4 ">
          <SortItems />
          {children}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Layout;
