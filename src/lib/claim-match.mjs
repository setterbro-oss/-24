// 공식 원문 텍스트 안에 claim 의 sourceSnippet 이 실제로 들어 있는지 결정론적으로 대조합니다.
// AI 해석이 아니라 "문자열 포함 여부"만 봅니다. 공백·따옴표 차이만 무시합니다.
export function normalizeForMatch(text) {
  return String(text ?? '')
    .normalize('NFKC')
    .replace(/[\u2018\u2019\u201A\u2032`´]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(/[\s\u00a0\u200b]+/g, '');
}

export function matchReport(report, sourceText) {
  const haystack = normalizeForMatch(sourceText);
  const missing = [];
  const matched = [];
  for (const claim of report?.claims || []) {
    const needle = normalizeForMatch(claim.sourceSnippet);
    (needle && haystack.includes(needle) ? matched : missing).push(claim.id);
  }
  return { matched, missing, allMatched: missing.length === 0 && matched.length > 0 };
}

export function todayKst(now = new Date()) {
  return new Date(now.getTime() + 9 * 3600000).toISOString().slice(0, 10);
}

// 한 레코드의 모든 보고서 결과(matched | mismatch | unreachable)로 다음 상태를 결정합니다.
// - mismatch(원문을 읽었는데 문구가 사라짐)만 강등합니다. 접근 실패는 "변경 없음"도 "변경됨"도 아닙니다.
// - 접근 불가 보고서가 하나라도 있으면 로봇은 새로 승격하지 않습니다(부분 증거로 승격 금지).
export function decideNextState(record, outcomes) {
  const kinds = outcomes.map((o) => o.kind);
  if (kinds.includes('mismatch')) return { action: 'demote', reason: 'source_text_changed' };
  if (kinds.every((k) => k === 'matched')) return { action: 'promote_or_refresh', reason: 'all_claims_matched' };
  if (record.verificationStatus === 'verified') return { action: 'refresh_matched_only', reason: 'some_sources_unreachable' };
  return { action: 'none', reason: 'cannot_promote_with_unreachable_source' };
}
