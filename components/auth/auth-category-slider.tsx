"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DEFAULT_CATEGORY_SEED } from "@/lib/default-categories";
import { cn } from "@/lib/utils";

const CATEGORY_IMAGES: Record<string, string> = {
  Luxury:
    "https://images.unsplash.com/photo-1563720223185-11003d516935?w=1200&h=1400&fit=crop&q=80",
  Sports:
    "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&h=1400&fit=crop&q=80",
  SUV:
    "https://images.unsplash.com/photo-1519641471654-76ce0107da85?w=1200&h=1400&fit=crop&q=80",
  Electric:
    "https://images.unsplash.com/photo-1593941707874-ef652b8a88e6?w=1200&h=1400&fit=crop&q=80",
  Sedan:
    "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&h=1400&fit=crop&q=80",
};

const SLIDES = DEFAULT_CATEGORY_SEED.map((cat) => ({
  name: cat.name,
  description: cat.description,
  image: CATEGORY_IMAGES[cat.name] ?? CATEGORY_IMAGES.Luxury,
}));

const INTERVAL_MS = 5500;

function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

export function AuthCategorySlider() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((index: number) => {
    setActive((index + SLIDES.length) % SLIDES.length);
  }, []);

  const next = useCallback(() => go(active + 1), [active, go]);
  const prev = useCallback(() => go(active - 1), [active, go]);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(next, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused, next]);

  const slide = SLIDES[active];

  return (
    <div
      className="relative hidden min-h-[calc(100vh-4rem)] overflow-hidden lg:block"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Browse by category"
    >
      {SLIDES.map((s, i) => (
        <div
          key={s.name}
          aria-hidden={i !== active}
          className={cn(
            "absolute inset-0 bg-cover bg-center transition-opacity duration-[1000ms] ease-in-out",
            i === active ? "opacity-100" : "opacity-0"
          )}
          style={{ backgroundImage: `url('${s.image}')` }}
        />
      ))}

      <div className="pointer-events-none absolute inset-0 gradient-brand" />
      <div className="pointer-events-none absolute inset-0 bg-black/40" />

      <div className="relative z-10 flex h-full min-h-[calc(100vh-4rem)] flex-col p-10">
        <div className="flex flex-1 flex-col justify-center">
          <div
            key={active}
            className="auth-category-slide-in max-w-md"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              Browse by category
            </p>
            <Link
              href={`/shop/${encodeURIComponent(toSlug(slide.name))}`}
              className="group mt-3 block"
            >
              <h2 className="font-hero text-5xl font-normal uppercase leading-none tracking-wide text-white transition-colors group-hover:text-primary xl:text-6xl">
                {slide.name}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/85 sm:text-lg">
                {slide.description}
              </p>
              <span className="mt-5 inline-flex items-center text-sm font-semibold text-primary transition-colors group-hover:text-white">
                View {slide.name} inventory →
              </span>
            </Link>
          </div>

          <div className="mt-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2" role="tablist">
              {SLIDES.map((s, i) => (
                <button
                  key={s.name}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={`${s.name} category`}
                  onClick={() => go(i)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    i === active
                      ? "w-7 bg-primary"
                      : "w-2 bg-white/40 hover:bg-white/70"
                  )}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={prev}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                aria-label="Previous category"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={next}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                aria-label="Next category"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-auto shrink-0 border-t border-white/15 pt-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            MJ Carros
          </p>
          <h1 className="mt-2 max-w-md text-2xl font-bold leading-tight text-white">
            Premium vehicles. Trusted marketplace.
          </h1>
          <p className="mt-3 max-w-sm text-sm text-white/80">
            Browse inventory, track orders, and manage your account in one place.
          </p>
        </div>
      </div>
    </div>
  );
}
