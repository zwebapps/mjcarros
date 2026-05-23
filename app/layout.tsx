import type { Metadata } from "next";
import { Anton, Oswald, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "font-awesome/css/font-awesome.min.css";
import { siteConfig } from "@/config/site";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import { ToastProvider } from "@/providers/toast-provider";
import { LocaleProvider } from "@/components/locale-provider";

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
if(t==='clean'||t==='charcoal'){document.documentElement.setAttribute('data-theme',t);}
else{document.documentElement.setAttribute('data-theme','charcoal');}}catch(e){
document.documentElement.setAttribute('data-theme','charcoal');}})();
`;

const localeInitScript = `
(function(){try{var l=localStorage.getItem('mjcarros-locale');
if(l!=='en'&&l!=='pt'){l='pt';localStorage.setItem('mjcarros-locale','pt');}
document.documentElement.lang=l==='en'?'en':'pt-PT';}catch(e){
document.documentElement.lang='pt-PT';}})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactQueryProvider>
      <html lang="pt-PT" suppressHydrationWarning data-theme="charcoal">
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
          <script dangerouslySetInnerHTML={{ __html: localeInitScript }} />
        </head>
        <body
          className={`${plusJakarta.variable} ${anton.variable} ${oswald.variable} ${plusJakarta.className} font-sans`}
          suppressHydrationWarning
        >
          <LocaleProvider>
            <ToastProvider />
            {children}
          </LocaleProvider>
        </body>
      </html>
    </ReactQueryProvider>
  );
}
