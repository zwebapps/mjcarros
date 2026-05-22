import SortItems from "../shop/_components/sort-items";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col py-5 sm:px-6 lg:px-10">
      <div className="flex-1 p-4">
        <SortItems />
        {children}
      </div>
    </div>
  );
};

export default Layout;
