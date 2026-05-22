import type { Metadata } from "next";
import { Anton, Oswald, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "font-awesome/css/font-awesome.min.css";
import { siteConfig } from "@/config/site";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import { ToastProvider } from "@/providers/toast-provider";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

/** Impact-style condensed display for hero headlines */
const anton = Anton({
  subsets: ["latin"],
  variable: "--font-hero",
  weight: "400",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-hero-accent",
  display: "swap",
  weight: ["500", "600", "700"],
});

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

const themeInitScript = `
(function(){try{var t=localStorage.getItem('mjcarros-theme');
document.documentElement.setAttribute('data-theme',t==='charcoal'?'charcoal':'clean');}catch(e){
document.documentElement.setAttribute('data-theme','clean');}})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactQueryProvider>
      <html lang="en" suppressHydrationWarning data-theme="clean">
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        </head>
        <body
          className={`${plusJakarta.variable} ${anton.variable} ${oswald.variable} ${plusJakarta.className} font-sans`}
          suppressHydrationWarning
        >
          <ToastProvider />
          {children}
        </body>
      </html>
    </ReactQueryProvider>
  );
}
