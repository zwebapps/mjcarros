"use client";

import { resolvePublicImageSrc } from "@/lib/resolve-image-src";

type LocalImagePreviewProps = {
  src: string;
  alt: string;
  onRemove?: () => void;
};

/** Admin thumbnails — use native img so blob: and /uploads/ URLs both work */
export function LocalImagePreview({ src, alt, onRemove }: LocalImagePreviewProps) {
  const resolved =
    /^(blob:|data:)/.test(src) ? src : resolvePublicImageSrc(src);

  return (
    <div className="relative h-[100px] w-[100px] shrink-0 overflow-hidden rounded-md border border-border bg-muted/40">
      <img
        src={resolved}
        alt={alt}
        className="h-full w-full object-cover"
        onError={(e) => {
          const img = e.currentTarget;
          if (img.dataset.fallback === "1") return;
          img.dataset.fallback = "1";
          img.src = "/placeholder-image.svg";
        }}
      />
      {onRemove && (
        <button
          type="button"
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold leading-none text-destructive-foreground shadow"
          onClick={onRemove}
          aria-label={`Remove ${alt}`}
        >
          ×
        </button>
      )}
    </div>
  );
}
