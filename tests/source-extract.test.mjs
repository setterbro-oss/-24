import test from 'node:test';
import assert from 'node:assert/strict';
import { extractReadableText, classifySourceInspection } from '../src/lib/source-extract.mjs';

test('extracts Korean notice text from a local-government board content container', () => {
  const paragraphs = Array.from({ length: 5 }, (_, i) => `<p>2026년 청년월세 지원 공고의 세부 안내 문장 ${i + 1}입니다. 신청 기간과 지원 대상은 공식 원문에서 확인해야 합니다.</p>`).join('');
  const html = `<html><body><div class="board-view-content">${paragraphs}</div><footer>로그인 메뉴</footer></body></html>`;
  const text = extractReadableText(html);
  assert.match(text, /신청 기간과 지원 대상/);
  assert.ok(text.length > 180);
});

test('keeps a short or blocked response non-publishable instead of calling it unchanged', () => {
  assert.equal(classifySourceInspection({ ok: true, text: '페이지를 찾을 수 없습니다' }).state, 'extraction_failed');
  assert.equal(classifySourceInspection({ ok: false, error: 'HTTP 403' }).state, 'access_failed');
  assert.equal(classifySourceInspection({ ok: false, error: 'HTTP 403' }).publishable, false);
});

test('extracts HTML entities and ignores scripts/styles', () => {
  const text = extractReadableText('<html><script>fake claim</script><style>.x{display:none}</style><main><p>월 최대 20만원 &amp; 최대 24회</p></main></html>');
  assert.match(text, /월 최대 20만원 & 최대 24회/);
  assert.doesNotMatch(text, /fake claim|display:none/);
});

test('extracts nested article text without truncating at the first nested div', () => {
  const body = `<div class="board-view-content"><div class="inner"><p>${'청년월세 지원 신청기간과 대상에 관한 공식 안내 문장입니다. '.repeat(12)}</p></div><div><p>${'소득 기준과 지원금 안내를 확인하세요. '.repeat(10)}</p></div></div>`;
  const text = extractReadableText(`<html><body>${body}<footer>${'메뉴 링크 '.repeat(60)}</footer></body></html>`);
  assert.match(text, /소득 기준과 지원금 안내/);
  assert.ok(text.length > 300);
});

test('recognizes common Korean government bulletin selectors and strips navigation noise', () => {
  const article = `<div id="board-view-content"><h2>청년월세 지원 안내</h2><p>${'공식 지원 대상과 신청 기간은 공고 원문을 확인해야 합니다. '.repeat(9)}</p></div>`;
  const text = extractReadableText(`<html><body><nav>${'로그인 메뉴 '.repeat(30)}</nav>${article}<footer>${'관련 사이트 '.repeat(30)}</footer></body></html>`);
  assert.match(text, /청년월세 지원 안내/);
  assert.doesNotMatch(text, /로그인 메뉴/);
});
