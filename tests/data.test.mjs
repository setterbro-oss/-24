import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const regions = JSON.parse(fs.readFileSync(path.join(root, 'src/data/regions.json'), 'utf8'));

test('region dataset is non-empty and slugs are unique', () => {
  assert.ok(regions.length > 0);
  const slugs = regions.map((r) => r.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const slug of slugs) assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
});

test('money fields are non-negative safe integers', () => {
  for (const region of regions) {
    for (const key of ['monthlyLimit', 'maxSupport', 'depositLimit', 'monthlyRentLimit']) {
      assert.ok(Number.isSafeInteger(region[key]) && region[key] >= 0, `${region.slug}.${key}`);
    }
  }
});

test('unverified regions are explicitly marked and have no verification date', () => {
  for (const region of regions.filter((r) => r.verificationStatus !== 'verified')) {
    assert.equal(region.verificationStatus, 'unverified');
    assert.equal(region.verifiedAt, '');
  }
});

test('external source links use HTTPS and contain no credentials', () => {
  for (const region of regions) {
    for (const key of ['applyUrl', 'sourceUrl']) {
      const url = new URL(region[key]);
      assert.equal(url.protocol, 'https:');
      assert.equal(url.username, '');
      assert.equal(url.password, '');
    }
  }
});
