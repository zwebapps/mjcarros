import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Featured | MJ Carros",
  description: "Featured vehicles and special offers",
};

const FeaturedPage = () => {
  return (
    <div className="flex items-center justify-center min-h-full gap-x-1 font-bold text-lg">
      <p>Featured |</p>
      <p>This page is under construction.</p>
    </div>
  );
};

export default FeaturedPage;
