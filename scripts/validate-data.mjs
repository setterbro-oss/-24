import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MIN_FACTS_FOR_INDEX, MIN_BODY_FOR_INDEX, hasSpecificSource } from '../src/lib/indexing.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const errors = [];
const warnings = [];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const RESERVED = new Set(['about', 'privacy', 'contact', '404', 'guide', 'robots', 'robots-txt', 'sitemap', 'sitemap-index', 'build-id', '_astro', 'api', 'admin']);
const isText = (v) => typeof v === 'string' && v.trim().length > 0;

function checkUrl(at, key, value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) errors.push(`${at}: ${key} must be HTTPS without credentials`);
  } catch {
    errors.push(`${at}: ${key} must be an absolute URL`);
  }
}

function checkFacts(at, facts, { min = 1 } = {}) {
  if (!Array.isArray(facts) || facts.length < min) {
    errors.push(`${at}: facts must be an array with at least ${min} item(s)`);
    return;
  }
  const labels = new Set();
  for (const [i, f] of facts.entries()) {
    if (!isText(f?.label) || !isText(f?.value)) errors.push(`${at}: facts[${i}] needs non-empty label and value`);
    else if (labels.has(f.label)) errors.push(`${at}: duplicate fact label "${f.label}"`);
    else labels.add(f.label);
  }
}

function checkCalc(at, calc) {
  if (calc === undefined) return;
  if (!Number.isSafeInteger(calc?.monthlyLimit) || calc.monthlyLimit <= 0) errors.push(`${at}: calc.monthlyLimit must be a positive integer`);
  if (!Number.isSafeInteger(calc?.maxMonths) || calc.maxMonths < 1 || calc.maxMonths > 60) errors.push(`${at}: calc.maxMonths must be 1..60`);
}

function checkVerification(at, r, { minFacts, requireBody }) {
  if (!['unverified', 'verified'].includes(r?.verificationStatus)) {
    errors.push(`${at}: verificationStatus must be unverified or verified`);
    return;
  }
  for (const key of ['verifiedAt', 'effectiveFrom']) {
    if (r[key] && !DATE_RE.test(r[key])) errors.push(`${at}: ${key} must be YYYY-MM-DD or empty`);
  }
  if (r.effectiveTo && !DATE_RE.test(r.effectiveTo)) errors.push(`${at}: effectiveTo must be YYYY-MM-DD or empty`);

  if (r.verificationStatus === 'unverified' && r.verifiedAt) {
    errors.push(`${at}: unverified records must not have verifiedAt`);
  }
  if (r.verificationStatus === 'verified') {
    if (!DATE_RE.test(r.verifiedAt || '')) errors.push(`${at}: verified records require verifiedAt YYYY-MM-DD`);
    if (!DATE_RE.test(r.effectiveFrom || '')) errors.push(`${at}: verified records require effectiveFrom YYYY-MM-DD`);
    if (!hasSpecificSource(r)) errors.push(`${at}: verified records need a specific sourceUrl (not a portal home, and different from applyUrl)`);
    if ((r.facts?.length ?? 0) < minFacts) errors.push(`${at}: verified records need at least ${minFacts} facts`);
    if (requireBody && (r.body?.length ?? 0) < MIN_BODY_FOR_INDEX) errors.push(`${at}: verified records need at least ${MIN_BODY_FOR_INDEX} body paragraph`);
    const report = r.verificationReport;
    if (report?.allClaimsMatch !== true || report.sourceUrl !== r.sourceUrl || !DATE_RE.test(report.checkedAt || '') || !/^[a-fA-F0-9]{64}$/.test(report.snapshotHash || '') || !Array.isArray(report.claims) || report.claims.length === 0 || !report.claims.every((c) => c?.status === 'matched' && isText(c?.id) && isText(c?.type) && c.value !== undefined && isText(c?.unit) && isText(c?.sourceSnippet) && isText(c?.anchor) && DATE_RE.test(c?.verifiedAt || ''))) errors.push(`${at}: verified records require a source-matched verificationReport with snapshot hash and fully evidenced matched claims`);
  }
}

// site.json
const site = read('src/data/site.json');
if (!isText(site.siteName)) errors.push('site.json: siteName is required');
if (site.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.contactEmail)) errors.push('site.json: contactEmail is not a valid email');
if (!site.contactEmail) warnings.push('site.json: contactEmail is empty (add a monitored email before enabling ads)');

// national.json
const national = read('src/data/national.json');
{
  const at = 'national.json';
  for (const key of ['name', 'description', 'sourceTitle', 'sourceUrl', 'applyUrl', 'editorialNote']) {
    if (!isText(national[key])) errors.push(`${at}: missing/invalid ${key}`);
  }
  for (const key of ['sourceUrl', 'applyUrl']) checkUrl(at, key, national[key]);
  checkFacts(at, national.facts, { min: MIN_FACTS_FOR_INDEX });
  if (national.calc !== undefined || national.eligibility !== undefined) errors.push(`${at}: remove duplicated calc/eligibility values; derive official numbers only from verificationReport.claims`);
  for (const key of ['exclusions', 'howToApply']) {
    if (!Array.isArray(national[key]) || national[key].length === 0 || !national[key].every(isText)) errors.push(`${at}: ${key} must be a non-empty array of text`);
  }
  if (!Array.isArray(national.faq) || national.faq.length === 0 || !national.faq.every((x) => isText(x?.q) && isText(x?.a))) errors.push(`${at}: faq must be a non-empty array of {q,a}`);
  if (!Array.isArray(national.sources) || national.sources.length === 0) errors.push(`${at}: sources must be non-empty`);
  else for (const [i, s] of national.sources.entries()) { if (!isText(s?.label)) errors.push(`${at}: sources[${i}].label missing`); checkUrl(at, `sources[${i}].url`, s?.url); }
  checkVerification(at, national, { minFacts: MIN_FACTS_FOR_INDEX, requireBody: false });
}

// regions.json
const regions = read('src/data/regions.json');
const slugs = new Set();
const factSignatures = new Map();
const verifiedSources = new Map();
if (!Array.isArray(regions) || regions.length === 0) errors.push('regions.json must be a non-empty array');

for (const [i, r] of (Array.isArray(regions) ? regions : []).entries()) {
  const at = `regions.json[${i}] (${r?.slug ?? 'no-slug'})`;
  for (const key of ['slug', 'name', 'description', 'applyUrl', 'sourceTitle', 'sourceUrl', 'editorialNote']) {
    if (!isText(r?.[key])) errors.push(`${at}: missing/invalid ${key}`);
  }
  if (isText(r?.slug)) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.slug)) errors.push(`${at}: slug must be lowercase ASCII with optional hyphens`);
    if (RESERVED.has(r.slug)) errors.push(`${at}: slug is reserved`);
    if (slugs.has(r.slug)) errors.push(`${at}: duplicate slug`);
    slugs.add(r.slug);
  }
  for (const key of ['applyUrl', 'sourceUrl']) if (isText(r?.[key])) checkUrl(at, key, r[key]);
  checkFacts(at, r?.facts, { min: 1 });
  if (r?.calc !== undefined || r?.eligibility !== undefined) errors.push(`${at}: remove duplicated calc/eligibility values; derive official numbers only from verificationReport.claims`);
  if (!Array.isArray(r?.body) || r.body.length === 0 || !r.body.every(isText)) errors.push(`${at}: body must be a non-empty array of paragraphs`);
  if (r?.comparison !== undefined) {
    if (!Array.isArray(r.comparison) || !r.comparison.every((c) => isText(c?.label) && isText(c?.national) && isText(c?.local))) errors.push(`${at}: comparison rows need label, national, local`);
  }
  checkVerification(at, r, { minFacts: MIN_FACTS_FOR_INDEX, requireBody: true });

  // 지역 이름만 바꾼 복사 페이지 방지: 항목 내용이 완전히 같은 지역은 허용하지 않습니다.
  if (Array.isArray(r?.facts)) {
    const sig = JSON.stringify(r.facts.map((f) => [f.label, f.value]));
    if (factSignatures.has(sig)) errors.push(`${at}: facts are identical to ${factSignatures.get(sig)} (duplicate content)`);
    else factSignatures.set(sig, r.slug);
  }
  if (r?.verificationStatus === 'verified' && isText(r.sourceUrl)) {
    if (verifiedSources.has(r.sourceUrl)) errors.push(`${at}: sourceUrl duplicates ${verifiedSources.get(r.sourceUrl)}`);
    else verifiedSources.set(r.sourceUrl, r.slug);
  }
}

for (const w of warnings) console.warn(`DATA WARNING: ${w}`);
if (errors.length) {
  console.error('DATA VALIDATION FAILED');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
const list = Array.isArray(regions) ? regions : [];
console.log(`DATA VALIDATION PASSED: national=${national.verificationStatus}; regions=${list.length} (verified=${list.filter((r) => r.verificationStatus === 'verified').length}, unverified=${list.filter((r) => r.verificationStatus !== 'verified').length})`);
