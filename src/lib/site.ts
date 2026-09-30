/** Vite base, always with a trailing slash. `/` locally, `/repo/` on project pages. */
export function appBasePath(): string {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base : `${base}/`;
}

/** Public URL of this deployment, including the repository path on GitHub Pages. */
export function publicSiteUrl(): string {
  const path = appBasePath();
  if (typeof window === 'undefined') return path;
  return new URL(path, window.location.origin).href.replace(/\/$/, '');
}

export function routerBasename(): string | undefined {
  const base = appBasePath();
  if (base === '/') return undefined;
  return base.replace(/\/$/, '');
}
