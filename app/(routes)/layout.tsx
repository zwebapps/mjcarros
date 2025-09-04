import { Navbar } from "@/components/navbar";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div className="min-h-full h-full w-full">
        <Navbar />
        {children}
      </div>
    </>
  );
};

export default layout;
