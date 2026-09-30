import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * GitHub project pages are served from /<repo>/.
 * Local dev and user/organization sites stay at /.
 */
function resolveBase(): string {
  const configured = process.env.VITE_BASE_PATH?.trim();
  if (configured) {
    const withSlash = configured.endsWith('/') ? configured : `${configured}/`;
    return withSlash.startsWith('/') ? withSlash : `/${withSlash}`;
  }

  if (process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_REPOSITORY) {
    const repoName = process.env.GITHUB_REPOSITORY.split('/')[1] ?? '';
    if (repoName && !repoName.endsWith('.github.io')) return `/${repoName}/`;
  }

  return '/';
}

export default defineConfig({
  base: resolveBase(),
  plugins: [
    react(),
    {
      name: 'spa-fallback',
      apply: 'build',
      writeBundle() {
        const indexPath = resolve('dist/index.html');
        if (!existsSync(indexPath)) return;
        copyFileSync(indexPath, resolve('dist/404.html'));
      },
    },
  ],
});
