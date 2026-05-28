import Image from "next/image";
import Link from "next/link";
import React from "react";

const Logo = () => {
  return (
    <Link href="/">
      <div className="hover:opacity-75 transition flex items-center">
        <Image
          src="/logo.png"
          alt="Logo"
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
