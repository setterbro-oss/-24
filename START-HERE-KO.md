# 먼저 읽으세요 — v1.3.0 (가독성 개선판)

## 0. v1.3.0에서 바뀐 것 (읽기 편하게 + 연락처)

| 변경 | 내용 |
|---|---|
| 글자 크기·줄 간격 | 기본 글자를 키우고(모바일 17px, PC 18px) 줄 간격을 넓혔습니다. 작은 글씨(12~13px)를 없앴습니다. |
| 한글 줄바꿈 | 단어 중간에서 끊기던 문제를 고쳤습니다(`word-break: keep-all`). |
| 링크 색 | 방문한 링크가 보라색으로 보이던 문제를 막고, 방문 여부와 관계없이 초록 계열로 통일했습니다. 홈 카드에도 배경·글자색을 명시했습니다. |
| 메뉴 | 터치하기 쉽게 높이를 44px로 키우고, 현재 보고 있는 메뉴를 강조합니다. |
| 가이드 상단 | "한눈에 보기 · 자가진단 · 월세 계산 · 신청 방법 · 자주 묻는 질문" 바로가기 버튼을 넣었습니다. |
| 입력창·계산기 | 입력칸을 키우고(48px), 결과 숫자를 크게 했습니다. JavaScript가 꺼진 경우 안내 문구를 보여 줍니다. |
| 문의 이메일 | `setterbro@gmail.com`을 `site.json`에 넣었습니다. 문의·개인정보 페이지에 자동 표시됩니다. |
| 출처 | `national.json`의 `sources`에 복지로 공지(PC 주소)와 전주시 안내 PDF(재산 기준 대조용)를 추가했습니다. |
| 파비콘 | 브라우저 탭 아이콘(`public/favicon.svg`)을 추가했습니다. |

데이터(대상·금액 등)는 바꾸지 않았고 모든 페이지는 여전히 `unverified`(색인 제외) 상태입니다.

> **이번 ZIP도 Astro 전체 빌드는 이 환경에서 실행하지 못했습니다.** (npm 설치 불가) 단위 테스트 17개와 데이터 검사는 통과했습니다. GitHub의 `Validate and Build`가 초록 체크인지 꼭 확인하세요.

## 적용 방법 (v1.3.0)

1. ZIP을 풀고 `youth-rent-24` 폴더 안의 **파일 전체**(숨김 폴더 `.github` 포함)를 GitHub 저장소 루트에 업로드합니다. (`Add file` → `Upload files`, 같은 이름은 덮어써집니다.)
2. 삭제할 파일은 없습니다.
3. `Actions` 탭에서 `Validate and Build`가 초록 체크인지 확인합니다. 빨간색이면 로그 맨 위 오류 한 줄을 알려 주세요.
4. 배포 후 시크릿 창에서 열어 홈·가이드·문의 페이지를 폰과 PC에서 모두 확인합니다.

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

## 5. 연락처

`src/data/site.json`의 `contactEmail`에 `setterbro@gmail.com`이 들어 있습니다. 바꾸려면 이 값만 고치세요. 비어 있으면 광고가 켜지지 않도록 막아 둡니다.

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
