import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import national from '../src/data/national.json' with { type: 'json' };
import { getPublishState } from '../src/lib/publish-gate.mjs';
import { matchReport, normalizeForMatch, decideNextState } from '../src/lib/claim-match.mjs';

const article = fs.readFileSync(new URL('./fixtures/korea-kr-148961039.txt', import.meta.url), 'utf8');

test('national is published when both official reports are fresh', () => {
  assert.equal(getPublishState(national, new Date('2026-10-20T00:00:00Z')).state, 'published');
});

test('national expires 45 days after the OLDEST report, so a stale source cannot be hidden by a fresh one', () => {
  const state = getPublishState(national, new Date('2026-12-01T00:00:00Z'));
  assert.ok(state.reasons.includes('verification_expired'));
});

test('korea.kr supplemental report: every snippet is a verbatim substring of the saved article text and hash matches', () => {
  const r = national.supplementalReports[0];
  assert.equal(crypto.createHash('sha256').update(r.snapshotText, 'utf8').digest('hex'), r.snapshotHash);
  const res = matchReport(r, article);
  assert.deepEqual(res.missing, []);
  assert.ok(res.allMatched);
});

test('matcher reports a missing claim when the official text changed', () => {
  const r = national.supplementalReports[0];
  const changed = article.replace('자산 1억 2200만 원 이하', '자산 1억 5000만 원 이하');
  assert.ok(matchReport(r, changed).missing.includes('gov_asset_youth'));
});

test('normalizer ignores whitespace and quote style only', () => {
  assert.equal(normalizeForMatch('월  최대\n20만 원'), normalizeForMatch('월 최대 20만 원'));
  assert.notEqual(normalizeForMatch('20만 원'), normalizeForMatch('30만 원'));
});

test('robot never demotes on unreachable source, never promotes on partial evidence', () => {
  assert.equal(decideNextState({ verificationStatus: 'verified' }, [{ kind: 'matched' }, { kind: 'unreachable' }]).action, 'refresh_matched_only');
  assert.equal(decideNextState({ verificationStatus: 'unverified' }, [{ kind: 'matched' }, { kind: 'unreachable' }]).action, 'none');
  assert.equal(decideNextState({ verificationStatus: 'verified' }, [{ kind: 'unreachable' }]).action, 'refresh_matched_only');
  assert.equal(decideNextState({ verificationStatus: 'verified' }, [{ kind: 'matched' }, { kind: 'mismatch' }]).action, 'demote');
  assert.equal(decideNextState({ verificationStatus: 'unverified' }, [{ kind: 'matched' }, { kind: 'matched' }]).action, 'promote_or_refresh');
});
