import { getPublishState, getVerifiedClaim } from './publish-gate.mjs';
export { getPublishState, getVerifiedClaim };
export const MIN_FACTS_FOR_INDEX = 4;
export const MIN_BODY_FOR_INDEX = 1;

export function hasSpecificSource(record) {
  try {
    const u = new URL(record.sourceUrl);
    const pathLen = u.pathname.replace(/\/+$/, '').length;
    return u.protocol === 'https:' && (pathLen > 0 || u.search.length > 1) && record.sourceUrl !== record.applyUrl;
  } catch { return false; }
}
export function isVerified(record, now = new Date()) { return getPublishState(record, now).state === 'published'; }
export function isGuideIndexable(national, now = new Date()) {
  return isVerified(national, now) && Array.isArray(national.facts) && national.facts.length >= MIN_FACTS_FOR_INDEX;
}
export function isRegionIndexable(region, now = new Date()) {
  return isVerified(region, now) && Array.isArray(region.facts) && region.facts.length >= MIN_FACTS_FOR_INDEX &&
    Array.isArray(region.body) && region.body.length >= MIN_BODY_FOR_INDEX;
}
export function isHomeIndexable(national, regions, now = new Date()) {
  return isGuideIndexable(national, now) || regions.some((region) => isRegionIndexable(region, now));
}
