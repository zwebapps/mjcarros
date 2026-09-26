import Image from "next/image";
import Link from "next/link";
import React from "react";
import logoPng from "@/public/logo.png";

type LogoSize = "header" | "compact";

/** Rendered heights; width follows the logo's own 1504×1204 proportions (the shield must not be squashed). */
const SIZE_CLASSES: Record<LogoSize, string> = {
  header: "h-11 sm:h-14",
  compact: "h-8",
};

const Logo = ({ size = "header" }: { size?: LogoSize }) => {
  return (
    <Link
      href="/"
      className="flex items-center rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Image
        src={logoPng}
        alt="MJ Carros"
        sizes="(min-width: 640px) 70px, 55px"
        className={`${SIZE_CLASSES[size]} w-auto`}
        priority
      />
    </Link>
  );
};

export default Logo;
