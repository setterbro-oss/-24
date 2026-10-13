import { getPublishState } from './publish-gate.mjs';

const REASON_LABELS = {
  status_not_verified: '공식 원문 대조 전',
  invalid_verified_at: '검증일 확인 필요',
  verification_expired: '확인일 45일 초과',
  effective_period_expired: '적용 기간 만료',
  invalid_effective_from: '적용 시작일 확인 필요',
  source_not_official_specific_url: '공식 세부 출처 확인 필요',
  verification_report_incomplete: '항목별 근거 대조 기록 미완성',
  insufficient_facts: '근거 항목 기준 미충족',
  insufficient_unique_content: '본문 품질 기준 미충족',
};

function recordState(record, now) {
  const result = getPublishState(record, now);
  if (result.state === 'published') return { state: 'published', reasons: [] };
  // Unverified records are in progress; previously claimed verified records that
  // fail any gate are held. This is informational only and never changes the gate.
  return {
    state: record?.verificationStatus === 'verified' ? 'held' : 'inProgress',
    reasons: result.reasons.map((reason) => REASON_LABELS[reason] || '검증 조건 미충족').slice(0, 2),
  };
}

export function getVerificationSummary(records, now = new Date()) {
  const items = records.map((record) => {
    const result = recordState(record, now);
    const claims = Array.isArray(record?.verificationReport?.claims) ? record.verificationReport.claims : [];
    const claimsMatched = claims.filter((claim) => claim?.status === 'matched').length;
    return {
      id: record.slug || record.id || record.name,
      name: record.name || '이름 미지정 자료',
      scope: record.scope || (record.slug === 'national' ? '전국' : '지역'),
      state: result.state,
      claimsMatched,
      claimsTotal: claims.length,
      verifiedAt: result.state === 'published' ? record.verifiedAt : '',
      reasons: result.reasons,
    };
  });
  const published = items.filter((item) => item.state === 'published').length;
  const inProgress = items.filter((item) => item.state === 'inProgress').length;
  const held = items.filter((item) => item.state === 'held').length;
  const checkedDates = records
    .map((record) => record?.verificationReport?.checkedAt)
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value || ''))
    .sort();
  return {
    total: items.length,
    published,
    inProgress,
    held,
    lastCheckedAt: checkedDates.at(-1) || '',
    items,
  };
}
