import NextImage from "next/image";
import { Tab } from "@headlessui/react";

import { cn } from "@/lib/utils";
import { resolvePublicImageSrc } from "@/lib/resolve-image-src";

interface GalleryTabProps {
  image: string;
}

const GalleryTab: React.FC<GalleryTabProps> = ({ image }) => {
  const normalizeUrl = (src: string): string => {
    if (!src) return "/placeholder-image.svg";
    if (/^https?:\/\//.test(src)) return src;
    return resolvePublicImageSrc(src);
  };

  const onError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget as HTMLImageElement;
    img.src = "/placeholder-image.svg";
  };
  return (
    <Tab className="relative flex aspect-square cursor-pointer items-center justify-center rounded-md bg-white">
      {({ selected }) => (
        <div>
          <span className="absolute h-full w-full aspect-square inset-0 overflow-hidden rounded-md">
            <NextImage
              fill
              src={normalizeUrl(image)}
              alt="Product thumbnail"
              className="object-cover object-center"
              unoptimized
              sizes="any"
              onError={onError}
            />
          </span>
          <span
            className={cn(
              "absolute inset-0 rounded-md ring-2 ring-offset-2",
              selected ? "ring-black" : "ring-transparent"
            )}
          />
        </div>
      )}
    </Tab>
  );
};

export default GalleryTab;
