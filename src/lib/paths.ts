/**
 * Prefix a site-relative path with the configured base, so links work both at
 * a domain root (Vercel) and under a sub-path (GitHub Pages: /jose-villa-site/).
 */
export function withBase(path: string, base: string = import.meta.env.BASE_URL): string {
  const b = base.endsWith('/') ? base : `${base}/`;
  return b + path.replace(/^\/+/, '');
}
