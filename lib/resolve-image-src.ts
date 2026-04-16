/** Resolve stored image paths for display: absolute URLs, `/uploads/...`, or site-relative paths. */
export function resolvePublicImageSrc(src: string): string {
  if (src == null || !String(src).trim()) return '/placeholder-image.svg';
  if (/^https?:\/\//.test(src) || /^data:/.test(src) || src.startsWith('blob:')) return src;

  let path = src.trim().replace(/^\/+/, '');
  // Strip accidental `public/` prefix (sometimes stored from filesystem paths)
  if (path.startsWith('public/')) path = path.slice('public/'.length);
  // Legacy folder name from older uploads
  path = path.replace(/^uploads\/products\//, 'uploads/product/');

  const withSlash = path.startsWith('/') ? path : `/${path}`;
  return withSlash;
}
