import Image from "next/image";
import Link from "next/link";
import React from "react";
import logoPng from "@/public/logo.png";

const Logo = () => {
  return (
    <Link href="/">
      <div className="hover:opacity-75 transition flex items-center">
        <Image
          src={logoPng}
          alt="MJ Carros"
          height={32}
          width={32}
          style={{
            width: "32px",
            height: "32px",
          }}
          priority
        />
      </div>
    </Link>
  );
};

export default Logo;
