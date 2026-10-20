
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

import national from '../src/data/national.json' with { type: 'json' };
import regions from '../src/data/regions.json' with { type: 'json' };
import { getVerificationSummary } from '../src/lib/verification-status.mjs';

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');

test('verification summary derives counts from the existing publish gate without mutating records', () => {
  const records = [
    { ...national, slug: 'national', scope: '전국' },
    ...regions,
  ];
  const before = structuredClone(records);

  const summary = getVerificationSummary(records);

  assert.equal(summary.total, records.length);
  assert.equal(
    summary.published + summary.inProgress + summary.held,
    summary.total,
  );
  assert.deepEqual(records, before);
  assert.ok(summary.items.every((item) =>
    ['published', 'inProgress', 'held'].includes(item.state),
  ));

  // Unverified national data must not be counted as published.
  if (national.verificationStatus !== 'verified') {
    assert.notEqual(summary.items[0].state, 'published');
  }
});

test('homepage hides empty publish sections but retains a factual verification board', () => {
  const home = read('../src/pages/index.astro');

  assert.match(home, /<VerificationBoard variant="compact"/);
  assert.match(home, /hasPublishedGuides\s*\?/);
  assert.match(home, /현재 공개 가능한 자료가 없습니다/);
  assert.match(home, /publishedRegions\.length > 0/);
  assert.doesNotMatch(
    home,
    /<h2 id="start-title">먼저 확인하세요<\/h2>\s*<div class="grid-list">\s*<\/div>/,
  );
});

test('status board does not print facts, descriptions, or source links for non-published records', () => {
  const board = read('../src/components/VerificationBoard.astro');

  assert.match(board, /item\.state === 'published' \? '게시 게이트 통과'/);
  assert.match(board, /item\.reasons\.join/);
  assert.doesNotMatch(
    board,
    /item\.description|item\.facts|item\.sourceUrl|item\.applyUrl/,
  );
  assert.match(board, /상태 표시는 읽기 전용 현황/);
});

test('region page conditional section syntax is balanced around facts section', () => {
  const regionPage = read('../src/pages/[region].astro');

  assert.match(regionPage, /<\/section>\}\s*\{indexable && region\.comparison/);
});

test('about page reuses the same full status board', () => {
  const about = read('../src/pages/about.astro');

  assert.match(about, /<VerificationBoard variant="full"/);
  assert.match(about, /id="data-status"/);
});


test('national record verification report contains explicit claim-level evidence and a reproducible fingerprint', () => {
  assert.ok(national.verificationReport, 'verificationReport must exist');
  assert.equal(national.verificationReport.sourceUrl, national.sourceUrl);

  assert.ok(Array.isArray(national.verificationReport.claims));
  assert.ok(national.verificationReport.claims.length >= 8);

  assert.ok(
    national.verificationReport.claims.every((claim) =>
      claim.status === 'matched' &&
      typeof claim.sourceSnippet === 'string' &&
      claim.sourceSnippet.trim().length > 0 &&
      typeof claim.anchor === 'string' &&
      claim.anchor.trim().length > 0
    ),
    'Every verified claim must contain a matching status, source excerpt, and anchor'
  );

  assert.equal(
    crypto
      .createHash('sha256')
      .update(national.verificationReport.snapshotText, 'utf8')
      .digest('hex'),
    national.verificationReport.snapshotHash,
    'snapshotHash must match snapshotText'
  );
});

test('verified national record carries reproducible evidence', () => {
  if (national.verificationStatus !== 'verified') return; // unverified: nothing to prove

  // If the record is marked verified, require reproducible evidence.
  assert.ok(national.verificationReport);
  assert.equal(national.verificationReport.sourceUrl, national.sourceUrl);
  assert.ok(Array.isArray(national.verificationReport.claims));
  assert.ok(national.verificationReport.claims.length >= 8);
  assert.ok(
    national.verificationReport.claims.every((claim) =>
      claim.status === 'matched' &&
      typeof claim.sourceSnippet === 'string' &&
      claim.sourceSnippet.trim().length > 0 &&
      typeof claim.anchor === 'string' &&
      claim.anchor.trim().length > 0,
    ),
  );
  assert.equal(
    crypto
      .createHash('sha256')
      .update(national.verificationReport.snapshotText, 'utf8')
      .digest('hex'),
    national.verificationReport.snapshotHash,
  );
});

test('expired effective period fails closed', async () => {
  const { getPublishState } = await import('../src/lib/publish-gate.mjs');

  const expired = {
    ...national,
    verificationStatus: 'verified',
    effectiveTo: '2026-10-01',
  };

  const state = getPublishState(expired, new Date('2026-10-13T12:00:00Z'));

  assert.notEqual(state.state, 'published');
  assert.ok(state.reasons.includes('effective_period_expired'));
});

test('Seoul and Gangnam remain independently unverified until their own evidence is checked', () => {
  const seoul = regions.find((r) => r.slug === 'seoul');
  const gangnam = regions.find((r) => r.slug === 'gangnam');

  assert.ok(seoul, 'Seoul region record must exist');
  assert.ok(gangnam, 'Gangnam region record must exist');
  assert.equal(seoul.verificationStatus, 'unverified');
  assert.equal(gangnam.verificationStatus, 'unverified');
  assert.notEqual(seoul.sourceUrl, gangnam.sourceUrl);
  assert.equal(seoul.verifiedAt, '');
  assert.equal(gangnam.verifiedAt, '');
});

test('stale verification date fails closed after the 45-day window', async () => {
  const { getPublishState } = await import('../src/lib/publish-gate.mjs');

  // Supply a synthetic verified record with a stale evidence date.
  // This test verifies the gate, not the current national source evidence.
  const stale = {
    ...national,
    verificationStatus: 'verified',
    verifiedAt: '2026-08-01',
    verificationReport: {
      ...(national.verificationReport ?? {}),
      checkedAt: '2026-08-01',
      claims: (national.verificationReport?.claims ?? []).map((claim) => ({
        ...claim,
        verifiedAt: '2026-08-01',
      })),
    },
  };

  const state = getPublishState(stale, new Date('2026-10-13T12:00:00Z'));

  assert.notEqual(state.state, 'published');
  assert.ok(state.reasons.includes('verification_expired'));
});
