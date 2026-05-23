export type GalleryUploadItem = {
  id: string;
  name: string;
  previewUrl: string;
  serverUrl?: string;
  status: "uploading" | "done" | "error";
  error?: string;
};

export async function uploadGalleryFile(
  file: File,
  token: string | null
): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", "product");

  const res = await fetch("/api/upload", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      typeof data?.error === "string"
        ? data.error
        : `Upload failed (${res.status})`;
    throw new Error(msg);
  }

  if (!data?.url || typeof data.url !== "string") {
    throw new Error("Upload succeeded but no image URL was returned");
  }

  return data.url;
}
