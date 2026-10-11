import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'src/data/regions.json');
const regions = JSON.parse(fs.readFileSync(file, 'utf8'));
const errors = [];
const slugs = new Set();
const requiredText = ['name', 'description', 'incomeLimit', 'office', 'applyUrl', 'sourceUrl', 'verificationStatus'];
if (!Array.isArray(regions) || regions.length === 0) errors.push('regions.json must be a non-empty array');
for (const [i, r] of regions.entries()) {
  const at = `regions.json[${i}] (${r?.slug ?? 'no-slug'})`;
  for (const key of ['slug', ...requiredText]) {
    if (typeof r?.[key] !== 'string' || !r[key].trim()) errors.push(`${at}: missing/invalid ${key}`);
  }
  if (typeof r?.slug === 'string') {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.slug)) errors.push(`${at}: slug must be lowercase ASCII with optional hyphens`);
    if (slugs.has(r.slug)) errors.push(`${at}: duplicate slug`);
    slugs.add(r.slug);
  }
  for (const key of ['monthlyLimit', 'maxSupport', 'depositLimit', 'monthlyRentLimit']) {
    if (!Number.isSafeInteger(r?.[key]) || r[key] < 0) errors.push(`${at}: ${key} must be a non-negative safe integer`);
  }
  for (const key of ['applyUrl', 'sourceUrl']) {
    try {
      const url = new URL(r[key]);
      if (url.protocol !== 'https:' || url.username || url.password) errors.push(`${at}: ${key} must be HTTPS without credentials`);
    } catch { errors.push(`${at}: ${key} must be an absolute URL`); }
  }
  if (!['unverified', 'verified'].includes(r?.verificationStatus)) errors.push(`${at}: verificationStatus must be unverified or verified`);
  if (r?.verificationStatus === 'verified') {
    if (!r.verifiedAt || !/^\d{4}-\d{2}-\d{2}$/.test(r.verifiedAt)) errors.push(`${at}: verified records require verifiedAt YYYY-MM-DD`);
    if (!r.sourceUrl || r.sourceUrl === r.applyUrl) errors.push(`${at}: verified records must provide a specific sourceUrl distinct from general application portal`);
    if (!r.effectiveFrom || !/^\d{4}-\d{2}-\d{2}$/.test(r.effectiveFrom)) errors.push(`${at}: verified records require effectiveFrom YYYY-MM-DD`);
    if (r.effectiveTo && !/^\d{4}-\d{2}-\d{2}$/.test(r.effectiveTo)) errors.push(`${at}: effectiveTo must be YYYY-MM-DD or empty`);
  }
}
if (errors.length) {
  console.error('DATA VALIDATION FAILED');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`DATA VALIDATION PASSED: ${regions.length} regions; verified=${regions.filter((r) => r.verificationStatus === 'verified').length}; unverified=${regions.filter((r) => r.verificationStatus !== 'verified').length}`);
