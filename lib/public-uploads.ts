import fs from 'fs/promises';
import path from 'path';

/** Root for user-uploaded files served as static assets: `/uploads/...` */
export function getUploadsRoot(): string {
  return path.join(process.cwd(), 'public', 'uploads');
}

/** Safe filename for disk storage (keeps extension, collapses dashes). */
export function safeUploadFileName(originalName: string): string {
  const base = path.basename(originalName || 'image');
  const ext = path.extname(base);
  const stem = path.basename(base, ext);
  const safeStem = stem
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  const safeExt = ext.replace(/[^A-Za-z0-9.]/g, '').toLowerCase() || '.jpg';
  return `${safeStem || 'image'}${safeExt.startsWith('.') ? safeExt : `.${safeExt}`}`;
}

/** e.g. `product/1730000000-tesla-2.jpg` */
export function buildUploadRelativePath(folder: string, originalName: string): string {
  const safeFolder = folder.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
  const normalized = safeFolder === 'products' ? 'product' : safeFolder;
  const allowed = normalized === 'category' ? 'category' : 'product';
  return `${allowed}/${Date.now()}-${safeUploadFileName(originalName)}`;
}

export async function ensureUploadsSubdir(...segments: string[]): Promise<string> {
  const dir = path.join(getUploadsRoot(), ...segments);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Resolve a safe absolute path under uploads for reading (blocks path traversal).
 */
export function resolveUploadFilePath(pathSegments: string[]): string | null {
  if (!pathSegments.length) return null;
  if (pathSegments.some((s) => !s || s === '.' || s === '..' || s.includes('\0'))) {
    return null;
  }

  const root = path.resolve(getUploadsRoot());
  const filePath = path.resolve(root, ...pathSegments);
  if (!filePath.startsWith(root + path.sep) && filePath !== root) {
    return null;
  }
  return filePath;
}

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

export function getUploadMimeType(filePath: string): string {
  return MIME_BY_EXT[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

/**
 * Write a file under `public/uploads/` and return the URL path (always starts with `/uploads/`).
 * @param relativePath path under uploads, e.g. `product/123-photo.jpg`
 */
export async function writeBufferToPublicUploads(
  relativePath: string,
  data: Buffer
): Promise<string> {
  const safe = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const fullPath = path.join(getUploadsRoot(), safe);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, data);
  return `/uploads/${safe}`;
}
