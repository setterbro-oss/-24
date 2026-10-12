import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_URL } from '../src/lib/site.mjs';
import { isGuideIndexable, isRegionIndexable, isHomeIndexable } from '../src/lib/indexing.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const national = read('src/data/national.json');
const regions = read('src/data/regions.json');
const site = read('src/data/site.json');
const errors = [];

if (!fs.existsSync(dist)) {
  console.error('BUILD VERIFICATION FAILED\n- dist 폴더가 없습니다. 먼저 astro build를 실행하세요.');
  process.exit(1);
}

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
const files = walk(dist);
const rel = (f) => path.relative(dist, f).split(path.sep).join('/');
const has = (r) => fs.existsSync(path.join(dist, r));
const text = (r) => fs.readFileSync(path.join(dist, r), 'utf8');

// 1) 필수 산출물
const routes = ['', 'guide', 'about', 'privacy', 'contact', 'editorial-policy', 'corrections', ...regions.map((r) => r.slug)];
for (const route of routes) {
  const file = route ? `${route}/index.html` : 'index.html';
  if (!has(file)) errors.push(`Missing build output: ${file}`);
}
for (const file of ['404.html', 'robots.txt', 'ads.txt', 'sitemap-index.xml', 'build-id.txt', '_headers']) {
  if (!has(file)) errors.push(`Missing build output: ${file}`);
}

// 2) 모든 HTML: canonical 주소·스크립트 속성 검사
const noindexRe = /<meta[^>]+name="robots"[^>]+content="noindex,nofollow"/i;
for (const f of files.filter((x) => x.endsWith('.html'))) {
  const r = rel(f);
  const html = fs.readFileSync(f, 'utf8');
  const m = html.match(/<link rel="canonical" href="([^"]+)"/);
  if (!m) {
    errors.push(`${r}: canonical tag missing`);
  } else {
    let u;
    try { u = new URL(m[1]); } catch { errors.push(`${r}: canonical is not a URL: ${m[1]}`); }
    if (u && u.origin !== SITE_URL) errors.push(`${r}: canonical origin ${u.origin} != SITE_URL ${SITE_URL}`);
    if (u && r !== '404.html') {
      const expected = r === 'index.html' ? '/' : `/${r.replace(/index\.html$/, '')}`;
      if (u.pathname !== expected) errors.push(`${r}: canonical path ${u.pathname} != ${expected}`);
    }
  }
  // lang="ts" 같은 속성이 붙은 script는 가공되지 않아 브라우저에서 오류가 납니다.
  if (/<script[^>]+\blang=/i.test(html)) errors.push(`${r}: <script lang=...> found (inline TypeScript will break in browsers)`);
  if (SITE_URL !== 'https://youth-rent-24.pages.dev' && html.includes('youth-rent-24.pages.dev')) errors.push(`${r}: stale youth-rent-24.pages.dev address found`);
}

// 3) 페이지별 색인 허용/제외
function checkRobots(file, shouldIndex, label) {
  if (!has(file)) return;
  const html = text(file);
  const isNoindex = noindexRe.test(html);
  if (shouldIndex && isNoindex) errors.push(`${file}: ${label} is published but marked noindex`);
  if (!shouldIndex && !isNoindex) errors.push(`${file}: ${label} is not published and must be noindex,nofollow`);
  if (!shouldIndex && (/<ins\b[^>]*class=[\"'][^\"']*\badsbygoogle\b/i.test(html) || /<script\b[^>]*src=[\"']https:\/\/pagead2?\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/i.test(html))) errors.push(`${file}: draft/demoted page contains ad markup or loader`);
}
checkRobots('index.html', isHomeIndexable(national, regions), 'home');
checkRobots('guide/index.html', isGuideIndexable(national), 'guide');
for (const region of regions) {
  checkRobots(`${region.slug}/index.html`, isRegionIndexable(region), region.slug);
  if (has(`${region.slug}/index.html`)) {
    const h1 = new RegExp(`<h1[^>]*>\\s*${region.name}\\s+청년\\s+월세지원\\s+정보\\s*</h1>`);
    if (!h1.test(text(`${region.slug}/index.html`))) errors.push(`${region.slug}/index.html: expected H1 missing`);
  }
}
for (const page of ['about', 'privacy', 'contact', 'editorial-policy', 'corrections']) {
  if (has(`${page}/index.html`) && noindexRe.test(text(`${page}/index.html`))) errors.push(`${page}/index.html: utility page unexpectedly noindex`);
}
if (has('404.html') && !noindexRe.test(text('404.html'))) errors.push('404.html: must be noindex');

// 4) robots.txt 및 ads.txt
if (has('robots.txt')) {
  const lines = text('robots.txt').split(/\r?\n/).map((l) => l.trim());
  if (!lines.includes(`Sitemap: ${SITE_URL}/sitemap-index.xml`)) errors.push(`robots.txt: missing "Sitemap: ${SITE_URL}/sitemap-index.xml"`);
}
if (has('ads.txt')) {
  const adsTxt = text('ads.txt');
  const configuredId = process.env.PUBLIC_ADSENSE_ID ?? '';
  if (/^ca-pub-\d{16}$/.test(configuredId)) {
    const expected = `google.com, ${configuredId.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0`;
    if (!adsTxt.split(/\r?\n/).includes(expected)) errors.push(`ads.txt: missing configured publisher declaration`);
  } else if (/^google\.com,\s*pub-/m.test(adsTxt)) {
    errors.push('ads.txt: publisher declaration exists while no valid publisher ID is configured');
  }
}

// 5) sitemap은 색인 허용 페이지와 정확히 일치해야 합니다.
const expectedPaths = new Set(['/about/', '/privacy/', '/contact/', '/editorial-policy/', '/corrections/']);
if (isHomeIndexable(national, regions)) expectedPaths.add('/');
if (isGuideIndexable(national)) expectedPaths.add('/guide/');
for (const region of regions) if (isRegionIndexable(region)) expectedPaths.add(`/${region.slug}/`);

const sitemapFiles = files.map(rel).filter((n) => /^sitemap.*\.xml$/.test(n));
const locs = sitemapFiles
  .filter((n) => n !== 'sitemap-index.xml')
  .flatMap((n) => [...text(n).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
const sitemapPaths = new Set();
for (const loc of locs) {
  const u = new URL(loc);
  if (u.origin !== SITE_URL) errors.push(`sitemap: origin mismatch ${loc}`);
  sitemapPaths.add(u.pathname);
}
for (const p of expectedPaths) if (!sitemapPaths.has(p)) errors.push(`sitemap: missing ${p}`);
for (const p of sitemapPaths) if (!expectedPaths.has(p)) errors.push(`sitemap: unexpected (noindex) page ${p}`);


if (has('_headers')) {
  const headersText = text('_headers');
  const draftRoutes = [];
  if (!isHomeIndexable(national, regions)) draftRoutes.push('/');
  if (!isGuideIndexable(national)) draftRoutes.push('/guide/');
  for (const region of regions) if (!isRegionIndexable(region)) draftRoutes.push(`/${region.slug}/`);
  for (const route of draftRoutes) {
    const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`(?:^|\\n)${escaped}\\n\\s+X-Robots-Tag: noindex, nofollow`, 'm').test(headersText)) errors.push(`_headers: missing X-Robots-Tag noindex,nofollow for ${route}`);
  }
}

// 6) 광고 기본 비활성 확인
if (process.env.PUBLIC_ADS_ENABLED !== 'true') {
  for (const f of files.filter((x) => x.endsWith('.html'))) {
    const html = fs.readFileSync(f, 'utf8');
    // CSS 클래스명(.adsbygoogle)만 있는 경우는 광고 마크업이 아닙니다. 실제 광고 요소/로더만 검사합니다.
    if (/<ins\b[^>]*class=[\"'][^\"']*\badsbygoogle\b/i.test(html) || /<script\b[^>]*src=[\"']https:\/\/pagead2?\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/i.test(html)) {
      errors.push(`${rel(f)}: ad markup or AdSense loader present while ads are disabled`);
    }
  }
}

if (!site.contactEmail) console.warn('BUILD WARNING: src/data/site.json의 contactEmail이 비어 있습니다. 광고를 켜기 전에 채우세요.');

if (errors.length) {
  console.error('BUILD VERIFICATION FAILED');
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}
console.log(`BUILD VERIFICATION PASSED: ${routes.length} pages, canonical=${SITE_URL}, sitemap=${sitemapPaths.size} urls, robots.txt checked.`);
