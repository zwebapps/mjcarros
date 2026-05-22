"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { AuthCategorySlider } from "@/components/auth/auth-category-slider";

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-nav/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Back to site
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl lg:grid-cols-2">
        <AuthCategorySlider />

        <div className="flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                MJ Carros
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Premium vehicles. Trusted marketplace.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
              {subtitle && (
                <div className="mt-2 text-sm text-muted-foreground">{subtitle}</div>
              )}
              <div className="mt-6">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
