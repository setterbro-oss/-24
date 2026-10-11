import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const regions = read('src/data/regions.json');
const national = read('src/data/national.json');
const RESERVED = ['about', 'privacy', 'contact', '404', 'guide', 'robots', 'sitemap'];

test('region slugs are unique, lowercase ASCII and not reserved', () => {
  const slugs = regions.map((r) => r.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const slug of slugs) {
    assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(!RESERVED.includes(slug), `${slug} is reserved`);
  }
});

test('no two regions share identical fact lists (duplicate-content guard)', () => {
  const sigs = regions.map((r) => JSON.stringify(r.facts.map((f) => [f.label, f.value])));
  assert.equal(new Set(sigs).size, sigs.length);
});

test('regions do not carry the old placeholder money fields', () => {
  for (const r of regions) {
    for (const key of ['monthlyLimit', 'maxSupport', 'depositLimit', 'monthlyRentLimit', 'incomeLimit']) {
      assert.equal(key in r, false, `${r.slug} still has ${key}`);
    }
  }
});

test('unverified records have no verifiedAt', () => {
  for (const r of [national, ...regions].filter((x) => x.verificationStatus !== 'verified')) {
    assert.equal(r.verifiedAt, '');
  }
});

test('source links use HTTPS and contain no credentials', () => {
  const urls = [national.sourceUrl, national.applyUrl, ...national.sources.map((s) => s.url)];
  for (const r of regions) urls.push(r.sourceUrl, r.applyUrl);
  for (const raw of urls) {
    const url = new URL(raw);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.username, '');
    assert.equal(url.password, '');
  }
});

test('every fact has a label and a value', () => {
  for (const r of [national, ...regions]) {
    for (const f of r.facts) {
      assert.ok(f.label.trim() && f.value.trim());
    }
  }
});
