import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildRecord, isRentPolicy } from '../src/lib/youth-api.mjs';
import { getPublishState } from '../src/lib/publish-gate.mjs';

const sample = JSON.parse(fs.readFileSync(new URL('./fixtures/youth-api-sample.json', import.meta.url), 'utf8')).result.youthPolicyList;
const national = { age_range: { value: '19~34' }, monthly_limit_krw: { value: 200000 }, max_months: { value: 24 } };
const today = '2026-10-20';
const now = new Date('2026-10-20T00:00:00Z');

test('only rent-related housing policies are selected', () => {
  assert.deepEqual(sample.filter(isRentPolicy).map((x) => x.plcyNo), ['TEST000001', 'TEST000002', 'TEST000004']);
});

test('complete rent policy becomes an unverified candidate with a comparison table', () => {
  const { record } = buildRecord(sample[0], { today, nationalClaims: national });
  assert.equal(record.slug, 'rent-test000001');
  assert.equal(record.sourceType, 'official_api');
  assert.ok(record.comparison.length >= 3);
  assert.equal(record.verificationStatus, 'unverified');
  assert.equal(record.verificationReport.allClaimsMatch, false);
  assert.ok(record.verificationReport.claims.every((claim) => claim.status === 'unreachable'));
  assert.notEqual(getPublishState(record, now).state, 'published');
  for (const c of record.verificationReport.claims) assert.ok(record.verificationReport.snapshotText.includes(c.sourceSnippet), c.id);
});

test('expired API program remains an unverified unpublished candidate', () => {
  const { record } = buildRecord(sample[1], { today, nationalClaims: national });
  const state = getPublishState(record, now);
  assert.notEqual(state.state, 'published');
  assert.ok(state.reasons.includes('status_not_verified'));
});

test('thin records are skipped instead of generating a low-value page', () => {
  assert.equal(buildRecord(sample[3], { today, nationalClaims: national }).skip, 'fewer_than_4_facts');
});

test('record without an official detail URL is skipped', () => {
  const item = { ...sample[0], refUrlAddr1: '' };
  assert.equal(buildRecord(item, { today, nationalClaims: national }).skip, 'no_official_detail_url');
});

test('API record with too few comparison rows is not indexable (added-value rule)', () => {
  const { record } = buildRecord(sample[0], { today, nationalClaims: national });
  const thin = { ...record, comparison: record.comparison.slice(0, 2) };
  assert.ok(getPublishState(thin, now).reasons.includes('insufficient_added_value'));
});

test('short copy-only record is blocked by the minimum-content gate (thin page protection)', () => {
  const item = { ...sample[0], plcyExplnCn: '월세 지원', plcySprtCn: '월 10만원 월세', plcyAplyMthdCn: '온라인', ptcpPrpTrgtCn: '' };
  const { record } = buildRecord(item, { today, nationalClaims: national });
  assert.ok(getPublishState(record, now).reasons.includes('insufficient_unique_content'));
});
