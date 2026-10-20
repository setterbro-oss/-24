// 단일 게시 게이트: 색인·사이트맵·광고·내부 링크가 같은 판정을 사용합니다.
export const MAX_VERIFICATION_AGE_DAYS = 45;
export const MIN_FACTS_FOR_PUBLISH = 4;
export const MIN_BODY_CHARS_FOR_PUBLISH = 700;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validDate(value) {
  if (!DATE_RE.test(value || '')) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function officialSource(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && !u.username && !u.password && u.pathname.replace(/\/+$/, '').length > 0 &&
      (u.hostname === 'go.kr' || u.hostname.endsWith('.go.kr') || u.hostname === 'or.kr' || u.hostname.endsWith('.or.kr') ||
        u.hostname === 'korea.kr' || u.hostname.endsWith('.korea.kr')); // korea.kr = 대한민국 정책브리핑(정부 공식 누리집)
  } catch { return false; }
}
function contentText(record) {
  const values = [record?.description, ...(record?.body || []), ...(record?.facts || []).map((x) => `${x?.label || ''} ${x?.value || ''}`), ...(record?.faq || []).map((x) => `${x?.q || ''} ${x?.a || ''}`), ...(record?.howToApply || [])];
  return values.filter((x) => typeof x === 'string').join(' ').replace(/\s+/g, ' ').trim();
}
function claimOk(claim) {
  return claim && claim.status === 'matched' &&
    typeof claim.id === 'string' && claim.id.trim() && typeof claim.type === 'string' && claim.type.trim() &&
    claim.value !== undefined && typeof claim.unit === 'string' && typeof claim.anchor === 'string' && claim.anchor.trim() &&
    typeof claim.sourceSnippet === 'string' && claim.sourceSnippet.trim() && validDate(claim.verifiedAt);
}
function singleReportOk(report) {
  return report?.allClaimsMatch === true && validDate(report.checkedAt) && /^[a-f0-9]{64}$/i.test(report.snapshotHash || '') &&
    Array.isArray(report.claims) && report.claims.length > 0 && report.claims.every(claimOk);
}
// 주 보고서(verificationReport)는 record.sourceUrl 과 같아야 하고,
// 보조 보고서(supplementalReports[])는 sources[] 에 적힌 공식 URL 이어야 합니다.
function allReports(record) {
  const extras = Array.isArray(record?.supplementalReports) ? record.supplementalReports : [];
  return [record?.verificationReport, ...extras];
}
function reportMatches(record) {
  const primary = record?.verificationReport;
  if (!primary || primary.sourceUrl !== record?.sourceUrl || !singleReportOk(primary)) return false;
  if (record.supplementalReports === undefined) return true;
  if (!Array.isArray(record.supplementalReports)) return false;
  const allowed = new Set((record.sources || []).map((s) => s?.url));
  return record.supplementalReports.every((r) => officialSource(r?.sourceUrl) && allowed.has(r.sourceUrl) && singleReportOk(r));
}
function oldestReportAgeDays(record, now) {
  const ages = allReports(record).filter((r) => r && validDate(r.checkedAt))
    .map((r) => (now.getTime() - new Date(`${r.checkedAt}T00:00:00.000Z`).getTime()) / 86400000);
  return ages.length ? Math.max(...ages) : 0;
}
// API 원천 레코드는 공식 문구를 그대로 복사한 것만으로는 색인하지 않습니다(대량 복사 콘텐츠 방지).
// 전국 사업과의 비교표 등 자체 가공 항목이 있어야 합니다.
export const MIN_COMPARISON_ROWS_FOR_API_RECORD = 3;

export function getPublishState(record, now = new Date()) {
  const reasons = [];
  if (record?.verificationStatus !== 'verified') reasons.push('status_not_verified');
  if (!validDate(record?.verifiedAt)) reasons.push('invalid_verified_at');
  else {
    const age = (now.getTime() - new Date(`${record.verifiedAt}T00:00:00.000Z`).getTime()) / 86400000;
    if (age < 0 || age > MAX_VERIFICATION_AGE_DAYS) reasons.push('verification_expired');
  }
  if (record?.effectiveTo && (!validDate(record.effectiveTo) || record.effectiveTo < now.toISOString().slice(0, 10))) reasons.push('effective_period_expired');
  if (!validDate(record?.effectiveFrom)) reasons.push('invalid_effective_from');
  if (!officialSource(record?.sourceUrl) || record?.sourceUrl === record?.applyUrl) reasons.push('source_not_official_specific_url');
  if (!reportMatches(record)) reasons.push('verification_report_incomplete');
  else if (oldestReportAgeDays(record, now) > MAX_VERIFICATION_AGE_DAYS && !reasons.includes('verification_expired')) reasons.push('verification_expired');
  if (record?.sourceType === 'official_api' && (!Array.isArray(record.comparison) || record.comparison.length < MIN_COMPARISON_ROWS_FOR_API_RECORD)) reasons.push('insufficient_added_value');
  if (!Array.isArray(record?.facts) || record.facts.length < MIN_FACTS_FOR_PUBLISH) reasons.push('insufficient_facts');
  if (contentText(record).length < MIN_BODY_CHARS_FOR_PUBLISH) reasons.push('insufficient_unique_content');
  if (reasons.length) return { state: record?.verificationStatus === 'verified' ? 'demoted' : 'draft', reasons };
  return { state: 'published', reasons: [] };
}

export function getVerifiedClaim(record, type, now = new Date()) {
  if (getPublishState(record, now).state !== 'published') return undefined;
  const claims = record?.verificationReport?.claims || [];
  const claim = claims.find((x) => x.type === type && x.status === 'matched' && x.value !== undefined && x.value !== null);
  return claim;
}
