"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    image:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&h=1080&fit=crop&q=80",
    eyebrow: "MJ Carros · Premium Automotive",
    title: "Discover your next vehicle",
    description:
      "Browse verified listings with transparent pricing, rich specifications, and trusted sellers.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1920&h=1080&fit=crop&q=80",
    eyebrow: "Curated inventory",
    title: "Performance & luxury",
    description:
      "From everyday drivers to exceptional machines — find the right car for your lifestyle.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1920&h=1080&fit=crop&q=80",
    eyebrow: "Simple & secure",
    title: "Search compare drive",
    description:
      "Filter by category, track your orders, and complete your purchase with confidence.",
  },
] as const;

const INTERVAL_MS = 7000;

/** Split headline into two lines — second line gets orange accent */
function splitHeroTitle(title: string): { lead: string; accent: string } {
  const words = title.trim().split(/\s+/);
  if (words.length <= 1) {
    return { lead: title, accent: "" };
  }
  const splitAt = Math.max(1, Math.ceil(words.length / 2));
  return {
    lead: words.slice(0, splitAt).join(" "),
    accent: words.slice(splitAt).join(" "),
  };
}

export function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const go = useCallback((index: number) => {
    setActive((index + SLIDES.length) % SLIDES.length);
  }, []);

  const next = useCallback(() => go(active + 1), [active, go]);
  const prev = useCallback(() => go(active - 1), [active, go]);

  useEffect(() => {
    if (isPaused) return;
    const id = window.setInterval(next, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [isPaused, next]);

  const slide = SLIDES[active];
  const { lead, accent } = splitHeroTitle(slide.title);

  return (
    <section
      className="relative min-h-[min(92vh,900px)] w-full overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Featured highlights"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {SLIDES.map((s, i) => (
        <div
          key={s.image}
          aria-hidden={i !== active}
          className={cn(
            "absolute inset-0 transition-opacity duration-[1200ms] ease-in-out",
            i === active ? "opacity-100 z-0" : "opacity-0 z-0"
          )}
        >
          <div
            className={cn(
              "absolute inset-0 bg-cover bg-center transition-transform duration-[8000ms] ease-out",
              i === active ? "scale-105" : "scale-100"
            )}
            style={{ backgroundImage: `url('${s.image}')` }}
          />
        </div>
      ))}

      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-brand/90 via-brand/55 to-brand/15" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/75 via-brand/20 to-black/30" />

      <div className="relative z-10 mx-auto flex min-h-[min(92vh,900px)] max-w-7xl flex-col justify-center px-4 py-24 sm:px-6 lg:px-8">
        <div key={active} className="max-w-4xl">
          <p className="hero-eyebrow mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-primary sm:text-base">
            {slide.eyebrow}
          </p>

          <h1 className="hero-headline" aria-live="polite">
            <span className="block">{lead}</span>
            {accent ? (
              <span className="hero-headline-accent block">{accent}</span>
            ) : null}
          </h1>

          <p className="hero-description mt-6 max-w-xl text-base font-medium leading-relaxed text-white/90 sm:text-lg md:text-xl">
            {slide.description}
          </p>

          <div className="hero-actions mt-10 flex flex-wrap gap-3 sm:gap-4">
            <Link href="/shop">
              <Button size="lg" className="min-w-[10rem] text-base shadow-lg">
                Browse inventory
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button
                size="lg"
                variant="outline"
                className="min-w-[10rem] border-2 border-white/90 bg-white/10 text-base text-white backdrop-blur-sm hover:border-white hover:bg-white hover:text-brand"
              >
                Create account
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between gap-4 sm:mt-16">
          <div className="flex items-center gap-2" role="tablist" aria-label="Slide selection">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => go(i)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === active
                    ? "w-8 bg-primary"
                    : "w-2 bg-white/40 hover:bg-white/70"
                )}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={prev}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
