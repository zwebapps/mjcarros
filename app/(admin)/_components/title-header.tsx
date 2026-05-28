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
    <div className="mb-6">
      <div className="flex flex-col gap-3 border-b border-slate-200/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {title}{" "}
            {count !== undefined ? (
              <span className="text-slate-400">({count})</span>
            ) : null}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        {url && (
          <Link href={url}>
            <Button
              size="sm"
              className="rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default TitleHeader;
