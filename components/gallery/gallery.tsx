"use client";

import NextImage from "next/image";
import { Tab } from "@headlessui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

import GalleryTab from "./gallery-tab";
import { resolvePublicImageSrc } from "@/lib/resolve-image-src";

interface GalleryProps {
  images: string[];
  sold?: boolean;
  negotiable?: boolean;
}

const Gallery: React.FC<GalleryProps> = ({ images = [], sold = false, negotiable = false }) => {
  const normalizeUrl = (src: string): string => {
    if (!src) return "/placeholder-image.svg";
    if (/^https?:\/\//.test(src)) {
      if (src.includes("images.unsplash.com") && !src.includes("?")) {
        return `${src}?w=1200&h=900&fit=crop&auto=format`;
      }
      return src;
    }
    return resolvePublicImageSrc(src);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget as HTMLImageElement;
    img.src = "/placeholder-image.svg";
    img.classList.remove("opacity-0");
  };

  const cleaned = (images || []).filter((u): u is string => typeof u === "string" && u.trim().length > 0);
  const normalizedImages = (cleaned.length > 0 ? cleaned : ["/placeholder-image.svg"]).map(normalizeUrl);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const lightboxRef = useRef<HTMLDivElement | null>(null);

  const goPrev = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + normalizedImages.length) % normalizedImages.length);
  }, [normalizedImages.length]);

  const goNext = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % normalizedImages.length);
  }, [normalizedImages.length]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLightboxOpen, goPrev, goNext]);

  return (
    <Tab.Group as="div" className="flex flex-col-reverse" selectedIndex={selectedIndex} onChange={setSelectedIndex}>
      <div className="mx-auto mt-6 w-full max-w-2xl sm:block lg:max-w-2xl">
        <Tab.List className="grid grid-cols-4 gap-6">
          {normalizedImages.map((image, index) => (
            <GalleryTab image={image} key={index} />
          ))}
        </Tab.List>
      </div>
      <Tab.Panels className="aspect-video w-full">
        {normalizedImages.map((image, index) => (
          <Tab.Panel key={index}>
            <div className="aspect-video relative h-full w-full sm:rounded-lg overflow-hidden">
              <NextImage
                fill
                src={image}
                alt="Product Image"
                className="object-cover object-center opacity-0 duration-300 transition-opacity"
                unoptimized
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onLoad={(
                  event: React.SyntheticEvent<HTMLImageElement, Event>
                ) => event.currentTarget.classList.remove("opacity-0")}
                onError={handleError}
                onClick={() => setIsLightboxOpen(true)}
              />
              {sold && (
                <div className="absolute inset-0 bg-yellow-400/40 flex items-center justify-center pointer-events-none">
                  <span className="bg-yellow-400 text-black font-bold px-4 py-1 rounded shadow">SOLD</span>
                </div>
              )}
              {normalizedImages.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={goPrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={goNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              <button
                type="button"
                aria-label="Open fullscreen"
                onClick={() => setIsLightboxOpen(true)}
                className="absolute right-2 bottom-2 p-2 rounded bg-black/50 text-white hover:bg-black/70"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              {negotiable && (
                <div className="absolute top-3 left-3">
                  <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                    Negotiable
                  </span>
                </div>
              )}
            </div>
          </Tab.Panel>
        ))}
      </Tab.Panels>
      {isLightboxOpen && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative w-full h-full max-h-screen max-w-screen" onClick={(e) => e.stopPropagation()}>
            <NextImage
              fill
              src={normalizedImages[selectedIndex]}
              alt="Fullscreen product image"
              className="object-contain"
              unoptimized
              sizes="100vw"
              onError={handleError}
            />
            {sold && (
              <div className="absolute inset-0 bg-yellow-400/20 flex items-center justify-center pointer-events-none">
                <span className="bg-yellow-400 text-black font-bold px-4 py-1 rounded shadow">SOLD</span>
              </div>
            )}
            {normalizedImages.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={goPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={goNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            {negotiable && (
              <div className="absolute top-4 left-4">
                <span className="bg-emerald-200/30 backdrop-blur text-emerald-200 text-xs px-2 py-1 rounded-full font-medium border border-emerald-300/50">
                  Negotiable
                </span>
              </div>
            )}
            <button
              type="button"
              aria-label="Close fullscreen"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 p-2 rounded bg-white/10 text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </Tab.Group>
  );
};

export default Gallery;
