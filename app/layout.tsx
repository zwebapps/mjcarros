import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import "font-awesome/css/font-awesome.min.css";
import { siteConfig } from "@/config/site";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import { ToastProvider } from "@/providers/toast-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-heading", display: "swap" });

export const metadata: Metadata = {
  title: siteConfig.name,

  description: siteConfig.description,
  icons: [
    {
      url: "/logo.png",
      href: "/logo.png",
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactQueryProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} ${montserrat.variable} ${inter.className}`} suppressHydrationWarning>
          <ToastProvider />
          {children}
        </body>
      </html>
    </ReactQueryProvider>
  );
}
