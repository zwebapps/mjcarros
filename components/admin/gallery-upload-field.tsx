"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { resolvePublicImageSrc } from "@/lib/resolve-image-src";
import {
  uploadGalleryFile,
  type GalleryUploadItem,
} from "@/lib/admin-gallery-upload";
import toast from "react-hot-toast";

type GalleryUploadFieldProps = {
  items: GalleryUploadItem[];
  onChange: (items: GalleryUploadItem[]) => void;
  disabled?: boolean;
};

export function GalleryUploadField({
  items,
  onChange,
  disabled,
}: GalleryUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const doneUrls = items
    .filter((i) => i.status === "done" && i.serverUrl)
    .map((i) => i.serverUrl as string);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

    setIsUploading(true);
    const pending: GalleryUploadItem[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      status: "uploading" as const,
    }));

    let next = [...items, ...pending];
    onChange(next);

    for (let i = 0; i < pending.length; i++) {
      const item = pending[i];
      try {
        const url = await uploadGalleryFile(files[i], token);
        next = next.map((row) =>
          row.id === item.id
            ? { ...row, status: "done" as const, serverUrl: url }
            : row
        );
        onChange(next);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Upload failed";
        next = next.map((row) =>
          row.id === item.id
            ? { ...row, status: "error" as const, error: message }
            : row
        );
        onChange(next);
        toast.error(`${item.name}: ${message}`);
      }
    }

    const succeeded = next.filter((r) => r.status === "done").length;
    const failed = next.filter((r) => r.status === "error").length;
    if (succeeded > 0) {
      toast.success(
        `${succeeded} image${succeeded === 1 ? "" : "s"} uploaded to server`
      );
    }
    if (failed > 0 && succeeded === 0) {
      toast.error("Gallery upload failed — check you are signed in as admin");
    }

    setIsUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeItem = (id: string) => {
    const target = items.find((i) => i.id === id);
    if (target?.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(target.previewUrl);
    }
    onChange(items.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-2">
      <label htmlFor="gallery" className="text-sm font-medium">
        Add gallery images (uploads one by one)
      </label>
      <Input
        ref={inputRef}
        type="file"
        id="gallery"
        name="gallery"
        accept="image/*"
        multiple
        disabled={disabled || isUploading}
        onChange={handleFiles}
      />
      {isUploading && (
        <p className="text-sm text-muted-foreground">Uploading to server…</p>
      )}
      {doneUrls.length > 0 && (
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          {doneUrls.length} image{doneUrls.length === 1 ? "" : "s"} ready on
          server
        </p>
      )}
      {items.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-3">
          {items.map((item, idx) => {
            const src =
              item.status === "done" && item.serverUrl
                ? resolvePublicImageSrc(item.serverUrl)
                : item.previewUrl;

            return (
              <li
                key={item.id}
                className="relative w-[108px] shrink-0 rounded border border-border bg-muted/30 p-1"
              >
                <img
                  src={src}
                  alt={`Gallery ${idx + 1}`}
                  className="h-[100px] w-full rounded object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/placeholder-image.svg";
                  }}
                />
                <button
                  type="button"
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.name}`}
                >
                  ×
                </button>
                <p
                  className="mt-1 truncate text-[10px] text-muted-foreground"
                  title={item.name}
                >
                  {item.name}
                </p>
                <p
                  className={`text-[10px] font-semibold ${
                    item.status === "done"
                      ? "text-emerald-600"
                      : item.status === "error"
                        ? "text-destructive"
                        : "text-primary"
                  }`}
                >
                  {item.status === "uploading"
                    ? "Uploading…"
                    : item.status === "done"
                      ? "Uploaded"
                      : item.error || "Failed"}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function galleryItemsToUrls(items: GalleryUploadItem[]): string[] {
  return items
    .filter((i) => i.status === "done" && i.serverUrl)
    .map((i) => i.serverUrl as string);
}
