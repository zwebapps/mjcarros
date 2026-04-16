/** Resolve stored image paths for display: absolute URLs, `/uploads/...`, or site-relative paths. */
export function resolvePublicImageSrc(src: string): string {
  if (src == null || !String(src).trim()) return '/placeholder-image.svg';
  const raw = String(src).trim();
  if (/^https?:\/\//.test(raw) || /^data:/.test(raw) || raw.startsWith('blob:')) return raw;

  let path = raw.replace(/\\/g, '/').replace(/^\/+/, '');
  // Strip accidental `public/` prefix (sometimes stored from filesystem paths)
  if (path.startsWith('public/')) path = path.slice('public/'.length);
  // Legacy folder name from older uploads
  path = path.replace(/^uploads\/products\//, 'uploads/product/');
  // Path saved only as `product/...` or `category/...` under public/uploads
  if (!path.startsWith('uploads/') && /^(product|category)\//.test(path)) {
    path = `uploads/${path}`;
  }

  const withSlash = path.startsWith('/') ? path : `/${path}`;
  return withSlash;
}
