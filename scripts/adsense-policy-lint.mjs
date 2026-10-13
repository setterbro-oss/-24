// Build-time safety lint. This is a policy-risk detector, not an AdSense approval predictor.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { getPublishState } from '../src/lib/publish-gate.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const national = read('src/data/national.json');
const regions = read('src/data/regions.json');
const layout = fs.readFileSync(path.join(root, 'src/layouts/Layout.astro'), 'utf8');
const guide = fs.readFileSync(path.join(root, 'src/pages/guide.astro'), 'utf8');
const issues = [];
const report = national.verificationReport;
if (!/정부·지자체 공식 사이트가 아닌 독립 정보 서비스/.test(guide)) issues.push('guide: independent-site notice must appear near the top of the page');
if (!/정부·지자체의 공식 기관이 아닌 독립 정보 안내 사이트/.test(layout)) issues.push('layout: footer independence disclaimer missing');
if (/무조건|100% 승인|수급을 보장|반드시 지급/.test(guide)) issues.push('guide: risky guarantee wording detected');
if (/광고를\s*클릭|광고\s*눌러/.test(guide)) issues.push('guide: ad-click solicitation detected');
if (report?.snapshotText && report?.snapshotHash) {
  const actual = crypto.createHash('sha256').update(report.snapshotText).digest('hex');
  if (actual !== report.snapshotHash) issues.push('national: snapshotHash does not match snapshotText');
  for (const [i, claim] of (report.claims || []).entries()) {
    const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();
    if (!claim.sourceSnippet || !normalize(report.snapshotText).includes(normalize(claim.sourceSnippet))) issues.push(`national: claims[${i}] sourceSnippet is not present in snapshotText after whitespace normalization`);
  }
}
const records = [{ id: 'national', record: national }, ...regions.map((record) => ({ id: `region:${record.slug}`, record }))];
const now = new Date();
const rows = records.map(({ id, record }) => ({ id, state: getPublishState(record, now).state, reasons: getPublishState(record, now).reasons }));
for (const row of rows) {
  if (row.state === 'published' && row.reasons.length) issues.push(`${row.id}: inconsistent publish gate`);
}
const summary = [
  '### AdSense / publication safety lint',
  '',
  '| Record | Gate state | Gate reasons |',
  '|---|---|---|',
  ...rows.map((row) => `| ${row.id} | ${row.state} | ${row.reasons.join(', ') || '—'} |`),
  '',
  `Policy lint: **${issues.length ? 'FAIL' : 'PASS'}**`,
  ...issues.map((issue) => `- ${issue}`),
  '',
  '> This lint checks known risk signals and evidence integrity. It cannot guarantee AdSense approval or zero policy risk.'
].join('\n');
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
if (issues.length) process.exitCode = 1;
