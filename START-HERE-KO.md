# 먼저 읽으세요 — v1.2.0 적용 방법

## 0. 이번 버전에서 고친 것

| 문제 | 고친 방법 |
|---|---|
| canonical 주소가 `youth-rent-24.pages.dev`로 나옴 | 기본 주소를 `https://24.setterbro.workers.dev`로 통일하고, 모든 페이지가 이 한 곳(`src/lib/site.mjs`)에서 주소를 가져옵니다. 빌드 검사가 주소 불일치를 잡아냅니다. |
| 지역 10곳의 숫자가 전부 같았음(복사 페이지) | 근거 없는 공통 수치를 모두 삭제했습니다. 전국 공통 가이드 1개 + 공식 공고로 근거를 찾은 지역(서울시, 강남구)만 남겼습니다. 항목이 똑같은 지역이 생기면 빌드가 실패합니다. |
| 출처가 포털 메인 주소였음 | 공고 원문 주소로 바꿨습니다. 포털 메인 주소로는 `verified`가 되지 않습니다. |
| 계산기가 동작하지 않을 위험 | 스크립트에 `lang="ts"`가 붙어 브라우저에서 오류가 날 수 있었습니다. 순수 JS로 바꾸고 계산 로직을 테스트했습니다. |
| robots.txt에 sitemap 줄 없음 | 사이트 주소에서 자동 생성합니다. |
| 캐시 설정 오타(`/assets/*`) | Astro 실제 경로 `/_astro/*`로 수정했습니다. |
| 화면에 개발자용 안내문이 노출됨 | 연락처·개인정보 페이지의 "설정 필요" 문구를 제거하고 이 문서로 옮겼습니다. |

새로 생긴 기능: 기본 요건 자가진단, 국토부 사업 vs 서울시 사업 비교표, 매월 데이터 신선도 점검(GitHub Actions).

## 1. 중요: 지금 모든 페이지는 "색인 제외" 상태입니다

데이터는 공식 공고에서 옮겨 적은 **초안**입니다. 사람이 원문과 대조해 `verified`로 바꾸기 전에는 검색엔진에 노출되지 않습니다. 이것이 정상입니다.

> **정정:** 이전 안내에서 "2026년부터 상시 신청"이라고 설명했습니다. 복지로 공지에는 2026년 신규 신청 기간이 **3.30~5.29**로 명시되어 있어 블로그들의 "상시" 표현과 다릅니다. 이 사이트는 공식 공지 기준으로 작성했고, 가이드 FAQ에도 이 차이를 적었습니다.

## 2. GitHub에 올리기 (기존 저장소 덮어쓰기)

1. ZIP을 풀면 `youth-rent-24` 폴더가 나옵니다. **폴더 안의 파일 전체**(숨김 폴더 `.github` 포함)를 GitHub 저장소 루트에 업로드합니다. (`Add file` → `Upload files`, 같은 이름은 덮어써집니다.)
2. 저장소에서 아래 파일을 **직접 삭제**합니다. (파일 열기 → 오른쪽 위 `…` → `Delete file` → Commit)
   - `public/robots.txt` (새 방식과 충돌)
   - `.github/workflows/ci.yml` 가 있다면 삭제 (`validate.yml`만 사용)
3. 상단 `Actions` 탭에서 `Validate and Build`가 **초록색 체크**가 되는지 확인합니다. 빨간색이면 로그 맨 위 오류 한 줄을 알려 주세요.

## 3. Cloudflare 확인

배포는 GitHub에 올리면 자동으로 다시 됩니다. 끝나면 직접 확인하세요.

1. `https://24.setterbro.workers.dev/robots.txt` 를 열어 맨 아래에 `Sitemap: https://24.setterbro.workers.dev/sitemap-index.xml` 이 있는지 봅니다.
2. 사이트에서 마우스 오른쪽 → `페이지 소스 보기` → `canonical`을 검색해 주소가 `24.setterbro.workers.dev`인지 봅니다.
3. `/guide/` 페이지에서 자가진단과 계산기에 숫자를 넣어 결과가 바뀌는지 봅니다. (`-`만 보이면 알려 주세요.)

다른 주소(자체 도메인 등)로 바꿀 때만 Cloudflare 프로젝트 → `Settings` → `Variables and Secrets`(빌드 변수)에 `SITE_URL` = `https://내도메인` 을 추가하고 재배포합니다. GitHub Actions도 같은 값을 쓰려면 저장소 `Settings` → `Secrets and variables` → `Actions` → `Variables`에 같은 이름으로 추가하세요.

## 4. 공식 공고와 대조해 `verified`로 바꾸기 (가장 중요)

전국 가이드부터 하세요.

1. `src/data/national.json`을 열고 `sourceUrl` 주소를 브라우저에서 엽니다.
2. `facts`의 각 줄(대상, 금액, 소득·재산 기준, 신청 기간 등)이 원문과 같은지 한 줄씩 비교하고, 다르면 원문대로 고칩니다. 강남구 공고, 전주시 공고 링크는 `sources`에 있습니다.
3. 모두 맞으면 같은 파일에서 아래 두 줄을 바꿉니다.
   - `"verificationStatus": "verified"`
   - `"verifiedAt": "오늘 날짜(예: 2026-10-12)"`
4. `Commit changes` → Actions 초록 체크 → 자동 배포. 이때부터 가이드와 홈이 색인 허용되고 sitemap에 들어갑니다.

`src/data/regions.json`의 서울시·강남구도 같은 방법으로 하되, `effectiveFrom`(공고 적용 시작일)도 채웁니다. 확인하지 못한 항목이 있으면 `unverified`로 두세요.

## 5. 연락처 넣기

`src/data/site.json`의 `"contactEmail": ""` 에 실제로 확인하는 이메일을 넣습니다. 문의 페이지에 자동 표시됩니다. 비어 있으면 광고가 켜지지 않도록 막아 둡니다.

## 6. 지역 추가하기

1. `docs/region-template.json`을 복사해 `src/data/regions.json`의 목록 끝에 붙입니다.
2. 공식 공고에서 전국 사업과 **다른 내용**을 찾아 `facts`와 `body`를 직접 채웁니다.
3. 다른 지역과 항목이 같으면 빌드가 실패합니다. 전국 사업과 다른 점이 없는 지역은 만들지 마세요.
4. 한 번에 1~3곳씩 추가하세요.

## 7. Google Search Console

가이드가 `verified`가 된 뒤에 등록합니다. `search.google.com/search-console` → URL 접두어 → `https://24.setterbro.workers.dev` → 소유권 확인 → 사이트맵 `sitemap-index.xml` 제출. 색인은 보장되지 않습니다.

## 8. 광고는 마지막

광고는 꺼져 있습니다. 검색 유입이 생기고, 연락처가 있고, 개인정보처리방침을 실제 광고 설정에 맞게 고친 뒤에 검토하세요. `workers.dev` 주소로는 애드센스 승인이 어려울 수 있으니 신청 전에 애드센스 도움말에서 사이트 주소 조건을 확인하세요.

## 9. 이 환경에서 못 해 본 것

이 ZIP을 만든 환경에서는 npm 설치가 막혀 **Astro 전체 빌드는 실행하지 못했습니다.** 데이터 검증, 단위 테스트 17개, 빌드 검사 스크립트의 통과·실패 동작은 직접 실행해 확인했습니다. 첫 빌드는 GitHub Actions나 내 PC에서 확인해야 합니다. 로컬에서 하려면:

```bash
npm install
npm test
npm run build
```
