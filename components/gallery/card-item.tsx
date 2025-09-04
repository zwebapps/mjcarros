"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import Image from "next/image";

interface CardItemProps {
  data: any;
  onRemove: () => void;
}

const CardItem: React.FC<CardItemProps> = ({ data, onRemove }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleRemove = async () => {
    try {
      setIsLoading(true);
      onRemove();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-lg p-3 space-y-4">
      <div className="aspect-square rounded-lg bg-gray-100 relative overflow-hidden">
        <Image
          fill
          src={data.url}
          alt=""
          className="object-cover"
        />
      </div>
      <div className="flex items-center gap-x-2">
        <Button
          disabled={isLoading}
          type="button"
          size="sm"
          variant="outline"
          onClick={handleRemove}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CardItem;
