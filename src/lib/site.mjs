// 사이트 주소의 단일 기준입니다. canonical, sitemap, robots.txt가 모두 이 값을 씁니다.
// 주소를 바꾸려면 Cloudflare 빌드 환경 변수 SITE_URL 을 설정하세요.
export const DEFAULT_SITE_URL = 'https://24.setterbro.workers.dev';

export function normalizeSiteUrl(raw) {
  const value = String(raw ?? '').trim() || DEFAULT_SITE_URL;
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`[SITE_URL_INVALID] 올바른 URL이 아닙니다: ${value}`);
  }
  if (url.protocol !== 'https:') throw new Error('[SITE_URL_INVALID] SITE_URL은 https:// 로 시작해야 합니다.');
  if (url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw new Error('[SITE_URL_INVALID] SITE_URL에는 경로·쿼리·계정 정보를 넣을 수 없습니다. 예: https://example.com');
  }
  return url.origin;
}

export const SITE_URL = normalizeSiteUrl(process.env.SITE_URL);
