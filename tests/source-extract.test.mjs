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
