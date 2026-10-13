import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
const root = process.cwd();
test('national evidence hash matches the stored snapshot text', () => {
  const data = JSON.parse(fs.readFileSync(path.join(root, 'src/data/national.json'), 'utf8'));
  const actual = crypto.createHash('sha256').update(data.verificationReport.snapshotText).digest('hex');
  assert.equal(actual, data.verificationReport.snapshotHash);
});
test('each national claim excerpt exists in the stored evidence snapshot', () => {
  const data = JSON.parse(fs.readFileSync(path.join(root, 'src/data/national.json'), 'utf8'));
  assert.ok(data.verificationReport.claims.length > 0);
  const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  for (const claim of data.verificationReport.claims) assert.ok(normalize(data.verificationReport.snapshotText).includes(normalize(claim.sourceSnippet)), claim.id);
});
test('guide displays independence notice before substantive guidance', () => {
  const guide = fs.readFileSync(path.join(root, 'src/pages/guide.astro'), 'utf8');
  const notice = guide.indexOf('정부·지자체 공식 사이트가 아닌 독립 정보 서비스');
  const heading = guide.indexOf('<h1>국토교통부 청년월세 지원 가이드');
  assert.ok(notice >= 0 && heading > notice);
});
