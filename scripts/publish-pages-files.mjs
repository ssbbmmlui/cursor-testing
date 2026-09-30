import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');

function required(path) {
  if (!existsSync(path)) {
    console.error(`Missing build output: ${path}`);
    process.exit(1);
  }
}

const appJs = resolve(dist, 'assets/app.js');
const appCss = resolve(dist, 'assets/app.css');
const favicon = resolve(dist, 'favicon.svg');
const notFound = resolve(dist, '404.html');
const games = resolve(dist, 'games');
const noJekyll = resolve(dist, '.nojekyll');

required(appJs);
required(appCss);
required(favicon);
required(notFound);
required(games);
required(noJekyll);

mkdirSync(resolve(root, 'assets'), { recursive: true });
cpSync(appJs, resolve(root, 'assets/app.js'));
cpSync(appCss, resolve(root, 'assets/app.css'));
cpSync(favicon, resolve(root, 'favicon.svg'));
cpSync(notFound, resolve(root, '404.html'));
cpSync(noJekyll, resolve(root, '.nojekyll'));
rmSync(resolve(root, 'games'), { recursive: true, force: true });
cpSync(games, resolve(root, 'games'), { recursive: true });
