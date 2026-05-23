import { Navbar } from "@/components/navbar";
import Footer from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <div className="flex h-full min-h-full w-full flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default layout;
