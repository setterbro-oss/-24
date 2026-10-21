import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildRecord, isRentPolicy } from '../src/lib/youth-api.mjs';
import { getPublishState } from '../src/lib/publish-gate.mjs';

const sample = JSON.parse(fs.readFileSync(new URL('./fixtures/youth-api-sample.json', import.meta.url), 'utf8')).result.youthPolicyList;
const national = { age_range: { value: '19~34' }, monthly_limit_krw: { value: 200000 }, max_months: { value: 24 } };
const today = '2026-10-20';
const now = new Date('2026-10-20T00:00:00Z');

 test('rent and youth housing policy candidates are selected without approving them', () => {
  assert.deepEqual(sample.filter(isRentPolicy).map((x) => x.plcyNo), ['TEST000001', 'TEST000002', 'TEST000004']);
  assert.equal(isRentPolicy({ plcyNo: 'GUARANTEE1', plcyNm: '청년 전세보증금 반환보증료 지원', lclsfNm: '주거', plcyExplnCn: '전세보증금 반환보증료 지원' }), true);
  assert.equal(isRentPolicy({ plcyNo: 'JOB1', plcyNm: '청년 취업 장려금', lclsfNm: '일자리', plcyExplnCn: '취업 지원' }), false);
});

test('complete API item becomes an unverified candidate with review checklist', () => {
  const { record } = buildRecord(sample[0], { today, nationalClaims: national });
  assert.equal(record.slug, 'rent-test000001');
  assert.equal(record.sourceType, 'official_api');
  assert.equal(record.verificationStatus, 'unverified');
  assert.equal(record.verifiedAt, '');
  assert.ok(record.comparison.length >= 3);
  assert.ok(record.candidateEvidence.length >= 4);
  assert.ok(record.reviewChecklist.some((item) => item.includes('공식 공고 원문')));
  assert.equal(record.verificationReport, undefined);
  assert.notEqual(getPublishState(record, now).state, 'published');
});

test('expired program remains a draft candidate and is not publishable', () => {
  const { record } = buildRecord(sample[1], { today, nationalClaims: national });
  assert.equal(record.verificationStatus, 'unverified');
  assert.notEqual(getPublishState(record, now).state, 'published');
});

test('a candidate without an official detail URL is skipped', () => {
  const item = { ...sample[0], refUrlAddr1: '' };
  assert.equal(buildRecord(item, { today, nationalClaims: national }).skip, 'no_official_detail_url');
});

test('API field values are not treated as matched source claims', () => {
  const { record } = buildRecord(sample[0], { today, nationalClaims: national });
  assert.ok(record.candidateEvidence.every((claim) => claim.reviewStatus === 'needs_official_source_review'));
  assert.equal(record.verificationReport, undefined);
});

test('short API descriptions are retained only as drafts, not padded with generic filler', () => {
  const item = { ...sample[0], plcyExplnCn: '월세 지원', plcySprtCn: '월 10만원 월세', plcyAplyMthdCn: '온라인', ptcpPrpTrgtCn: '' };
  const { record } = buildRecord(item, { today, nationalClaims: national });
  assert.ok(record.body.join(' ').length < 700);
  assert.equal(record.verificationStatus, 'unverified');
  assert.notEqual(getPublishState(record, now).state, 'published');
});
