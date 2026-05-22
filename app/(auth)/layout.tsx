import { ThemeProvider } from "@/components/theme-provider";

const layout = ({ children }: { children: React.ReactNode }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};

export default layout;
