"use client";

import NextImage from "next/image";
import { Tab } from "@headlessui/react";

import GalleryTab from "./gallery-tab";

interface GalleryProps {
  images: string[];
  sold?: boolean;
}

const Gallery: React.FC<GalleryProps> = ({ images = [], sold = false }) => {
  const baseUrl = (process.env.NEXT_PUBLIC_S3_BASE_URL || "").replace(/\/$/, "");

  const normalizeUrl = (src: string): string => {
    if (!src) return "/logo.png";
    if (/^https?:\/\//.test(src)) {
      if (src.includes("images.unsplash.com") && !src.includes("?")) {
        return `${src}?w=1200&h=900&fit=crop&auto=format`;
      }
      return src;
    }
    if (src.startsWith("/uploads/")) return src;
    if (baseUrl) return `${baseUrl}/${src.replace(/^\/+/, "")}`;
    return `/${src.replace(/^\/+/, "")}`;
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget as HTMLImageElement;
    img.src = "/logo.png";
  };

  const normalizedImages = (images && images.length > 0 ? images : ["/logo.png"]).map(normalizeUrl);

  return (
    <Tab.Group as="div" className="flex flex-col-reverse">
      <div className="mx-auto mt-6 w-full max-w-2xl sm:block lg:max-w-2xl">
        <Tab.List className="grid grid-cols-4 gap-6">
          {normalizedImages.map((image, index) => (
            <GalleryTab image={image} key={index} />
          ))}
        </Tab.List>
      </div>
      <Tab.Panels className="aspect-square w-full">
        {normalizedImages.map((image, index) => (
          <Tab.Panel key={index}>
            <div className="aspect-square relative h-full w-full sm:rounded-lg overflow-hidden">
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
              />
              {sold && (
                <div className="absolute inset-0 bg-yellow-400/40 flex items-center justify-center pointer-events-none">
                  <span className="bg-yellow-400 text-black font-bold px-4 py-1 rounded shadow">SOLD</span>
                </div>
              )}
            </div>
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
};

export default Gallery;
