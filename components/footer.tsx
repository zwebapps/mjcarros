"use client";

import Logo from "./Logo";
import Link from "next/link";
import { useLocale } from "@/components/locale-provider";

const Footer = () => {
  const { t } = useLocale();

  return (
    <footer className="mt-auto border-t border-border bg-brand text-brand-foreground">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-6 px-4 py-10 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <Logo />
        <nav className="flex flex-wrap justify-center gap-6 text-sm text-brand-foreground/80">
          <Link href="/shop" className="transition-colors hover:text-primary">
            {t("nav.shop")}
          </Link>
          <Link href="/featured" className="transition-colors hover:text-primary">
            {t("nav.featured")}
          </Link>
          <Link href="/contact" className="transition-colors hover:text-primary">
            {t("nav.contact")}
          </Link>
          <Link href="/sign-in" className="transition-colors hover:text-primary">
            {t("nav.signIn")}
          </Link>
        </nav>
        <p className="text-center text-sm text-brand-foreground/70">
          © {new Date().getFullYear()}{" "}
          <a
            className="font-medium text-white transition-colors hover:text-primary"
            target="_blank"
            rel="noopener noreferrer"
            href="https://mjcarros.pt"
          >
            MJ Carros
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
