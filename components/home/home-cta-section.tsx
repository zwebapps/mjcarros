"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";

export function HomeCtaSection() {
  const { t } = useLocale();

  return (
    <section className="gradient-brand py-16 text-white">
      <div className="mx-auto max-w-[1400px] px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {t("home.ctaTitle")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
          {t("home.ctaBody")}
        </p>
        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          <Link href="/shop" className="w-full sm:w-auto sm:min-w-[14rem]">
            <Button size="lg" className="h-12 w-full text-base">
              {t("home.viewStock")}
            </Button>
          </Link>
          <Link href="/sign-up" className="w-full sm:w-auto sm:min-w-[14rem]">
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-full border-white/85 bg-transparent text-base text-white hover:bg-white hover:text-brand"
            >
              {t("home.createAccount")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
