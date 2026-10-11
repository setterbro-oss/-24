import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const regions = JSON.parse(fs.readFileSync(path.join(root, 'src/data/regions.json'), 'utf8'));
const errors = [];
function requireFile(rel) {
  if (!fs.existsSync(path.join(dist, rel))) errors.push(`Missing build output: ${rel}`);
}
requireFile('index.html');
requireFile('about/index.html');
requireFile('privacy/index.html');
requireFile('contact/index.html');
requireFile('robots.txt');
requireFile('sitemap-index.xml');
const homeHtmlPath = path.join(dist, 'index.html');
if (fs.existsSync(homeHtmlPath)) {
  const homeHtml = fs.readFileSync(homeHtmlPath, 'utf8');
  const hasVerifiedRegion = regions.some((r) => r.verificationStatus === 'verified');
  const homeNoindex = /<meta[^>]+name="robots"[^>]+content="noindex,follow"/i.test(homeHtml);
  if (!hasVerifiedRegion && !homeNoindex) errors.push('index.html: home must be noindex until at least one region is verified');
}
for (const region of regions) {
  const rel = `${region.slug}/index.html`;
  requireFile(rel);
  const target = path.join(dist, rel);
  if (!fs.existsSync(target)) continue;
  const html = fs.readFileSync(target, 'utf8');
  if (!html.includes(`<h1>${region.name} 청년 월세지원 정보</h1>`)) errors.push(`${rel}: expected H1 missing`);
  const hasNoindex = /<meta[^>]+name="robots"[^>]+content="noindex,follow"/i.test(html);
  if (region.verificationStatus !== 'verified' && !hasNoindex) errors.push(`${rel}: unverified region must be noindex`);
  if (region.verificationStatus === 'verified' && hasNoindex) errors.push(`${rel}: verified region unexpectedly noindex`);
}
const sitemapFiles = fs.readdirSync(dist).filter((name) => name.startsWith('sitemap') && name.endsWith('.xml'));
const sitemapText = sitemapFiles.map((name) => fs.readFileSync(path.join(dist, name), 'utf8')).join('\n');
for (const region of regions.filter((r) => r.verificationStatus !== 'verified')) {
  if (sitemapText.includes(`/${region.slug}/`)) errors.push(`Unverified region appears in sitemap: ${region.slug}`);
}
if (errors.length) {
  console.error('BUILD VERIFICATION FAILED');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`BUILD VERIFICATION PASSED: ${regions.length} region pages, utility pages, robots.txt, sitemap checked.`);
