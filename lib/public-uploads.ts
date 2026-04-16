import fs from 'fs/promises';
import path from 'path';

/** Root for user-uploaded files served as static assets: `/uploads/...` */
export function getUploadsRoot(): string {
  return path.join(process.cwd(), 'public', 'uploads');
}

export async function ensureUploadsSubdir(...segments: string[]): Promise<string> {
  const dir = path.join(getUploadsRoot(), ...segments);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Write a file under `public/uploads/` and return the URL path (always starts with `/uploads/`).
 * @param relativePath path under uploads, e.g. `product/123-photo.jpg`
 */
export async function writeBufferToPublicUploads(relativePath: string, data: Buffer): Promise<string> {
  const safe = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const fullPath = path.join(getUploadsRoot(), safe);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, data);
  return `/uploads/${safe}`;
}
