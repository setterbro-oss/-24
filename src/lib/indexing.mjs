// 어떤 페이지를 검색엔진에 노출할지 결정하는 규칙입니다.
// 레이아웃(noindex 메타), sitemap, 빌드 검사가 모두 이 파일을 공유합니다.
export const MIN_FACTS_FOR_INDEX = 4;
export const MIN_BODY_FOR_INDEX = 1;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function hasSpecificSource(record) {
  try {
    const u = new URL(record.sourceUrl);
    const pathLen = u.pathname.replace(/\/+$/, '').length;
    return u.protocol === 'https:' && (pathLen > 0 || u.search.length > 1) && record.sourceUrl !== record.applyUrl;
  } catch {
    return false;
  }
}

export function isVerified(record) {
  return (
    record?.verificationStatus === 'verified' &&
    DATE_RE.test(record.verifiedAt || '') &&
    DATE_RE.test(record.effectiveFrom || '') &&
    hasSpecificSource(record)
  );
}

// 전국 공통 가이드(national.json)
export function isGuideIndexable(national) {
  return isVerified(national) && Array.isArray(national.facts) && national.facts.length >= MIN_FACTS_FOR_INDEX;
}

// 지역 페이지(regions.json 항목)
export function isRegionIndexable(region) {
  return (
    isVerified(region) &&
    Array.isArray(region.facts) &&
    region.facts.length >= MIN_FACTS_FOR_INDEX &&
    Array.isArray(region.body) &&
    region.body.length >= MIN_BODY_FOR_INDEX
  );
}

export function isHomeIndexable(national, regions) {
  return isGuideIndexable(national) || regions.some(isRegionIndexable);
}
