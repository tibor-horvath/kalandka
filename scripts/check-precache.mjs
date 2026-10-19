// Offline guarantee: after `vite build`, every file the app can load must be in the service worker's
// precache, and every precached URL must exist. Workbox only warns (or says nothing) when a file is
// skipped, e.g. a new file type missing from globPatterns or a file over its 2 MiB limit, and one
// missing precache URL makes the whole service worker fail to install. Either way the app would
// quietly stop working offline, so the build fails instead.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const dist = process.argv[2] ?? 'dist';

/** Files that are deliberately not precached, and why. */
const NOT_PRECACHED = [
  [/^sw\.js$/, 'the service worker itself'],
  [/^workbox-[\w-]+\.js$/, 'loaded by the service worker, cached by the browser with it'],
  [/^staticwebapp\.config\.json$/, 'Azure Static Web Apps server config, never fetched by the app'],
  // Every browser that runs the app picks the .woff2; the .woff must still have that twin (checked below).
  [/\.woff$/, 'fallback font; its .woff2 twin is precached']
];

const fail = (msg) => {
  console.error(`✗ Offline check: ${msg}`);
  process.exitCode = 1;
};

/** A built file's name without Vite's 8-character content hash: fonts/a-normal-B4tNaogw.woff → fonts/a-normal.woff */
const unhashed = (f) => f.replace(/-[\w-]{8}(\.\w+)$/, '$1');

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : [relative(dist, p).split(sep).join('/')];
  });
}

const swPath = join(dist, 'sw.js');
if (!existsSync(swPath)) {
  fail(`${swPath} not found; run \`vite build\` first.`);
  process.exit();
}

const sw = readFileSync(swPath, 'utf8');
const precached = new Set([...sw.matchAll(/\{url:"([^"]+)",revision:/g)].map((m) => m[1]));
if (precached.size === 0) fail('no precache entries found in sw.js (has the Workbox output format changed?).');

const files = walk(dist);
const fileSet = new Set(files);

// 1. Every file the app may load is precached.
for (const f of files) {
  if (precached.has(f)) continue;
  const reason = NOT_PRECACHED.find(([re]) => re.test(f.split('/').pop()));
  if (!reason) {
    const kb = Math.round(statSync(join(dist, f)).size / 1024);
    fail(`${f} (${kb} KiB) is not precached. Add its type to workbox.globPatterns in vite.config.ts, or raise maximumFileSizeToCacheInBytes if it is over 2 MiB.`);
  } else if (f.endsWith('.woff') && ![...precached].some((u) => unhashed(u) === `${unhashed(f)}2`)) {
    fail(`${f} has no precached .woff2 twin, so that font would be missing offline.`);
  }
}

// 2. Every precached URL exists; one missing file and the service worker never installs.
for (const url of precached) if (!fileSet.has(url)) fail(`sw.js precaches ${url}, which is not in ${dist}/.`);

// 3. The page itself, its manifest and everything index.html links to are there for an offline start.
for (const must of ['index.html', 'manifest.webmanifest']) if (!precached.has(must)) fail(`${must} is not precached.`);
const html = readFileSync(join(dist, 'index.html'), 'utf8');
for (const [, ref] of html.matchAll(/(?:src|href)="\/?([^"#?]+)"/g)) {
  if (/^(https?:)?\/\//.test(ref)) fail(`index.html loads ${ref} from another site, which cannot work offline.`);
  else if (!precached.has(ref)) fail(`index.html links to ${ref}, which is not precached.`);
}

if (!process.exitCode) {
  const kib = Math.round([...precached].reduce((s, u) => s + statSync(join(dist, u)).size, 0) / 1024);
  console.log(`✓ Offline check: all ${precached.size} files precached (${kib} KiB), nothing missing.`);
}
