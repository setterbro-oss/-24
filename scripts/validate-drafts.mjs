import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'data/drafts/youth-api-candidates.json');
if (!fs.existsSync(file)) {
  console.log('DRAFT VALIDATION: no API candidate queue yet; nothing to validate.');
  process.exit(0);
}
const queue = JSON.parse(fs.readFileSync(file, 'utf8'));
const errors = [];
if (queue.schemaVersion !== 1) errors.push('schemaVersion must be 1');
if (!Array.isArray(queue.candidates)) errors.push('candidates must be an array');
const seen = new Set();
for (const [index, item] of (queue.candidates || []).entries()) {
  const label = `candidates[${index}]`;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item?.slug || '')) errors.push(`${label}: invalid slug`);
  if (typeof item?.name !== 'string' || item.name.trim().length < 2) errors.push(`${label}: missing name`);
  try {
    const url = new URL(item?.sourceUrl || '');
    if (url.protocol !== 'https:' || !/(^|\.)(go\.kr|or\.kr|korea\.kr)$/.test(url.hostname) || url.pathname.length < 2) errors.push(`${label}: sourceUrl is not a specific official HTTPS URL`);
  } catch { errors.push(`${label}: invalid sourceUrl`); }
  if (item?.verificationStatus !== 'unverified') errors.push(`${label}: candidate must remain unverified`);
  if (item?.verifiedAt) errors.push(`${label}: verifiedAt must be empty`);
  if (item?.verificationReport !== undefined) errors.push(`${label}: candidate must not carry a verificationReport`);
  if (!Array.isArray(item?.candidateEvidence)) errors.push(`${label}: candidateEvidence missing`);
  if (!Array.isArray(item?.reviewChecklist) || item.reviewChecklist.length < 3) errors.push(`${label}: reviewChecklist missing`);
  if (seen.has(item?.slug)) errors.push(`${label}: duplicate slug`);
  seen.add(item?.slug);
}
if (errors.length) {
  console.error('DRAFT VALIDATION FAILED');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`DRAFT VALIDATION PASSED: ${queue.candidates.length} unverified candidate(s); no candidate is approved for publication.`);
}
