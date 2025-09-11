import { Button } from "@/components/ui/button";
import React from "react";
import { Plus } from "lucide-react";
import Link from "next/link";

type Props = {
  title: string;
  description: string;
  count?: number;
  url?: string;
};

const TitleHeader = ({ title, description, count, url }: Props) => {
  return (
    <div className="flex border-b flex-col mb-4 pb-2 ">
      <div className="flex justify-between items-center">
        <h1 className="font-bold text-2xl text-black">
          {title} {count !== undefined ? `(${count})` : ""}
        </h1>
        {url && (
          <Link href={url}>
            <Button size="sm" className="bg-black text-white hover:bg-black/90">
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </Link>
        )}
      </div>
      <p className="text-gray-700 text-sm">{description}</p>
    </div>
  );
};

export default TitleHeader;
