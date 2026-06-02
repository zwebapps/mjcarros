"use client";

import * as React from "react";

type SafeImgProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "onError" | "src"
> & {
  src: string;
  fallbackSrc?: string;
};

export function SafeImg({ src, fallbackSrc = "/placeholder-image.svg", ...props }: SafeImgProps) {
  return (
    <img
      {...props}
      src={src}
      onError={(e) => {
        const img = e.currentTarget;
        if (img.src.endsWith(fallbackSrc)) return;
        img.src = fallbackSrc;
      }}
    />
  );
}

