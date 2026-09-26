"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUp, Clock, Mail, MapPin, Phone } from "lucide-react";

import logoPng from "@/public/logo.png";
import { useLocale } from "@/components/locale-provider";

/** Subset of the admin-editable contact page (`/api/contact/cms`) shown in the footer. */
type ContactInfo = {
  address1?: string;
  cityLine?: string;
  phone?: string;
  email?: string;
  hours?: string;
};

const COMPANY_NAME = "Majestic Journey Unipessoal LDA";
const COMPLAINTS_BOOK_URL = "https://www.livroreclamacoes.pt/Inicio/";

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-brand-foreground/60">
      {children}
    </h2>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="inline-block py-1 text-sm text-brand-foreground/85 transition-colors hover:text-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children}
      </Link>
    </li>
  );
}

const Footer = () => {
  const { t } = useLocale();
  const [contact, setContact] = useState<ContactInfo | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/contact/cms")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ContactInfo | null) => {
        if (active && data) setContact(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const phoneHref = contact?.phone ? `tel:${contact.phone.replace(/[^\d+]/g, "")}` : null;
  const hours = (contact?.hours || "")
    .split(";")
    .map((line) => line.trim())
    .filter(Boolean);
  const hasAddress = Boolean(contact?.address1 || contact?.cityLine);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-brand text-brand-foreground">
      <div className="mx-auto max-w-[1400px] px-4 pb-8 pt-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-4">
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Image src={logoPng} alt="" width={44} height={44} className="h-11 w-11" />
              <span className="text-xl font-bold tracking-tight text-white">MJ Carros</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-foreground/75">
              {t("footer.tagline")}
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-brand"
            >
              {t("footer.browseStock")}
            </Link>
          </div>

          {/* Explore */}
          <nav aria-labelledby="footer-explore" className="lg:col-span-2">
            <FooterHeading>
              <span id="footer-explore">{t("footer.explore")}</span>
            </FooterHeading>
            <ul className="space-y-1">
              <FooterLink href="/shop">{t("nav.shop")}</FooterLink>
              <FooterLink href="/featured">{t("nav.featured")}</FooterLink>
              <FooterLink href="/import">{t("footer.importGermany")}</FooterLink>
              <FooterLink href="/contact">{t("nav.contact")}</FooterLink>
            </ul>
          </nav>

          {/* Account */}
          <nav aria-labelledby="footer-account" className="lg:col-span-2">
            <FooterHeading>
              <span id="footer-account">{t("footer.account")}</span>
            </FooterHeading>
            <ul className="space-y-1">
              <FooterLink href="/sign-in">{t("nav.signIn")}</FooterLink>
              <FooterLink href="/sign-up">{t("nav.signUp")}</FooterLink>
              <FooterLink href="/orders/guest">{t("nav.trackOrders")}</FooterLink>
              <FooterLink href="/cart">{t("nav.cart")}</FooterLink>
            </ul>
          </nav>

          {/* Contact — from the admin-editable contact page; rows without data are omitted */}
          <div className="col-span-2 lg:col-span-4">
            <FooterHeading>{t("footer.visitUs")}</FooterHeading>
            <address className="space-y-3 text-sm not-italic text-brand-foreground/85">
              {hasAddress && (
                <p className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>
                    {contact?.address1}
                    {contact?.address1 && contact?.cityLine ? <br /> : null}
                    {contact?.cityLine}
                  </span>
                </p>
              )}
              {phoneHref && (
                <p className="flex gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <a href={phoneHref} className="transition-colors hover:text-primary">
                    {contact?.phone}
                  </a>
                </p>
              )}
              {contact?.email && (
                <p className="flex gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <a href={`mailto:${contact.email}`} className="break-all transition-colors hover:text-primary">
                    {contact.email}
                  </a>
                </p>
              )}
              {hours.length > 0 && (
                <div className="flex gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <ul>
                    {hours.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}
              {!contact && (
                <Link href="/contact" className="inline-block transition-colors hover:text-primary">
                  {t("nav.contact")} →
                </Link>
              )}
            </address>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-brand-foreground/65 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} MJ Carros · {COMPANY_NAME}. {t("footer.rights")}.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <a
              href={COMPLAINTS_BOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-primary"
            >
              {t("footer.complaintsBook")}
            </a>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center gap-1 transition-colors hover:text-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
              {t("footer.backToTop")}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
