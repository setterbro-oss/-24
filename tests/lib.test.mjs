import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSiteUrl, DEFAULT_SITE_URL } from '../src/lib/site.mjs';
import { isVerified, isGuideIndexable, isRegionIndexable, isHomeIndexable, hasSpecificSource } from '../src/lib/indexing.mjs';
import { calculateSupport } from '../src/lib/calc.mjs';
import { evaluateEligibility } from '../src/lib/eligibility.mjs';

const facts = (n) => Array.from({ length: n }, (_, i) => ({ label: `L${i}`, value: `V${i}` }));
const verifiedRegion = (over = {}) => ({
  slug: 'x', verificationStatus: 'verified', verifiedAt: '2026-10-11', effectiveFrom: '2026-03-30',
  sourceUrl: 'https://example.go.kr/notice/123', applyUrl: 'https://www.bokjiro.go.kr/', facts: facts(4), body: ['text'], ...over,
});

test('SITE_URL: default is the live workers.dev address', () => {
  assert.equal(normalizeSiteUrl(undefined), DEFAULT_SITE_URL);
  assert.equal(normalizeSiteUrl(''), 'https://24.setterbro.workers.dev');
});

test('SITE_URL: rejects http, paths and credentials', () => {
  assert.equal(normalizeSiteUrl('https://example.com/'), 'https://example.com');
  assert.throws(() => normalizeSiteUrl('http://example.com'), /https/);
  assert.throws(() => normalizeSiteUrl('https://example.com/blog'), /경로/);
  assert.throws(() => normalizeSiteUrl('https://user:pw@example.com'), /경로|계정/);
  assert.throws(() => normalizeSiteUrl('not a url'), /올바른 URL/);
});

test('indexing: unverified records are never indexable', () => {
  assert.equal(isRegionIndexable(verifiedRegion({ verificationStatus: 'unverified', verifiedAt: '' })), false);
});

test('indexing: verified but thin or portal-only records stay noindex', () => {
  assert.equal(isRegionIndexable(verifiedRegion()), true);
  assert.equal(isRegionIndexable(verifiedRegion({ facts: facts(2) })), false);
  assert.equal(isRegionIndexable(verifiedRegion({ body: [] })), false);
  assert.equal(isRegionIndexable(verifiedRegion({ sourceUrl: 'https://www.bokjiro.go.kr/' })), false);
  assert.equal(isRegionIndexable(verifiedRegion({ verifiedAt: '' })), false);
  assert.equal(hasSpecificSource({ sourceUrl: 'https://youth.seoul.go.kr', applyUrl: 'https://youth.seoul.go.kr' }), false);
});

test('indexing: guide and home follow verification state', () => {
  const nat = verifiedRegion();
  assert.equal(isGuideIndexable(nat), true);
  assert.equal(isVerified({ verificationStatus: 'unverified' }), false);
  assert.equal(isHomeIndexable({ verificationStatus: 'unverified', facts: [] }, []), false);
  assert.equal(isHomeIndexable({ verificationStatus: 'unverified', facts: [] }, [verifiedRegion()]), true);
});

test('calc: monthly amount is min(rent, limit) times months', () => {
  const base = { monthlyLimit: 200000, maxMonths: 24 };
  assert.deepEqual(calculateSupport({ rent: 450000, months: 12, ...base }), { ok: true, monthly: 200000, total: 2400000 });
  assert.deepEqual(calculateSupport({ rent: 150000, months: 6, ...base }), { ok: true, monthly: 150000, total: 900000 });
  assert.equal(calculateSupport({ rent: 0, months: 1, ...base }).total, 0);
});

test('calc: rejects invalid input', () => {
  const base = { monthlyLimit: 200000, maxMonths: 12 };
  assert.equal(calculateSupport({ rent: -1, months: 1, ...base }).ok, false);
  assert.equal(calculateSupport({ rent: NaN, months: 1, ...base }).ok, false);
  assert.equal(calculateSupport({ rent: 300000, months: 13, ...base }).ok, false);
  assert.equal(calculateSupport({ rent: 300000, months: 1.5, ...base }).ok, false);
  assert.equal(calculateSupport({ rent: 300000, months: 0, ...base }).ok, false);
});

const rules = { birthYearMin: 1991, birthYearMax: 2007, incomeLimit1p: 1538000 };

test('eligibility: all inputs satisfied gives ok', () => {
  const r = evaluateEligibility({ birthYear: 1998, livesSeparately: 'yes', ownsHome: 'no', monthlyIncome: 1200000 }, rules);
  assert.equal(r.overall, 'ok');
  assert.equal(r.items.length, 4);
});

test('eligibility: empty inputs ask for more data', () => {
  const r = evaluateEligibility({ birthYear: NaN, livesSeparately: '', ownsHome: '', monthlyIncome: null }, rules);
  assert.equal(r.overall, 'check');
});

test('eligibility: out-of-range age, homeowner, shared residence and high income fail', () => {
  assert.equal(evaluateEligibility({ birthYear: 1985, livesSeparately: 'yes', ownsHome: 'no', monthlyIncome: null }, rules).overall, 'fail');
  assert.equal(evaluateEligibility({ birthYear: 1998, livesSeparately: 'no', ownsHome: 'no', monthlyIncome: null }, rules).overall, 'fail');
  assert.equal(evaluateEligibility({ birthYear: 1998, livesSeparately: 'yes', ownsHome: 'yes', monthlyIncome: null }, rules).overall, 'fail');
  assert.equal(evaluateEligibility({ birthYear: 1998, livesSeparately: 'yes', ownsHome: 'no', monthlyIncome: 2000000 }, rules).overall, 'fail');
});

test('eligibility: boundary values are inclusive', () => {
  assert.equal(evaluateEligibility({ birthYear: 1991, livesSeparately: 'yes', ownsHome: 'no', monthlyIncome: 1538000 }, rules).overall, 'ok');
  assert.equal(evaluateEligibility({ birthYear: 2007, livesSeparately: 'yes', ownsHome: 'no', monthlyIncome: 0 }, rules).overall, 'ok');
  assert.equal(evaluateEligibility({ birthYear: 2008, livesSeparately: 'yes', ownsHome: 'no', monthlyIncome: 0 }, rules).overall, 'fail');
});
