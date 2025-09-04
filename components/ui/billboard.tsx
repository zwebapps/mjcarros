"use client";

import { useEffect, useState } from "react";

const Billboard = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=400&fit=crop",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 rounded-xl overflow-hidden">
      <div className="rounded-xl relative aspect-[2.4/1] overflow-hidden bg-cover bg-center">
        <div
          className="h-full w-full transition-all duration-1000 ease-in-out"
          style={{
            backgroundImage: `url(${images[currentImageIndex]})`,
          }}
        />
        <div className="h-full w-full bg-black/30 transition-all duration-1000 ease-in-out" />
        <div className="absolute top-[50%] left-[50%] text-center text-white translate-x-[-50%] translate-y-[-50%]">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold">
            MJ CARROS
          </h1>
          <p className="text-sm sm:text-lg lg:text-xl mt-2">
            Premium Automotive Excellence
          </p>
        </div>
      </div>
    </div>
  );
};

export default Billboard;
