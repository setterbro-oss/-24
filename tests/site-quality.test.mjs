import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');

test('global theme uses a light background and explicit readable text colors', () => {
  const layout = read('../src/layouts/Layout.astro');
  assert.match(layout, /--bg:\s*#f8fafc/i);
  assert.match(layout, /--text:\s*#111827/i);
  assert.match(layout, /\.nav-container nav a:visited/);
});

test('home page does not expose internal verification count and includes primary tools', () => {
  const home = read('../src/pages/index.astro');
  assert.doesNotMatch(home, /대조가 끝난 페이지는/);
  assert.match(home, /지원 자격 간이 확인/);
  assert.match(home, /월세 계산기/);
});

test('editorial policy and corrections pages exist and are discoverable in sitemap config', () => {
  assert.match(read('../src/pages/editorial-policy.astro'), /수치 검증 원칙/);
  assert.match(read('../src/pages/corrections.astro'), /정정 및 검증 이력/);
  const config = read('../astro.config.mjs');
  assert.match(config, /\/editorial-policy\//);
  assert.match(config, /\/corrections\//);
});

test('ad slot does not encourage clicks and has a reserved layout area', () => {
  const ad = read('../src/components/AdSlot.astro');
  assert.match(ad, /min-height:\s*280px/);
  assert.match(ad, /aria-label/);
  assert.doesNotMatch(ad, /클릭해|눌러서 광고/);
});
