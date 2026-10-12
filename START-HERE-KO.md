# 먼저 읽으세요 — v1.5.0 (자동 감시·광고 안전장치 개선판)

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


## 10. 공식 공고 자동 감시 (v1.4.0)

- `.github/workflows/official-source-monitor.yml`이 매주 공식 HTML 공고를 확인합니다.
- 공고 페이지 내용이 바뀌거나 접근이 실패하면 GitHub Issue를 생성하고 보고서를 첨부합니다. `Actions` 탭에서도 `official-source-monitor` 실행 결과와 artifact를 확인할 수 있습니다.
- 이 자동화는 **변경 감지/알림**이지, 기준값을 자동 승인하는 기능은 아닙니다. 공고 페이지의 메뉴·광고·접수 상태 문구만 바뀌어도 알림이 날 수 있습니다.
- 재산 기준처럼 잘못 게시하면 피해가 큰 정보는 원문을 의미 단위로 검증하지 않고 자동 변경하지 않습니다. 검토 후에만 `src/data/national.json` 또는 `src/data/regions.json`을 수정하세요.
- 저장소 `Settings → Actions → General → Workflow permissions`에서 `Read and write permissions`를 허용해야 상태 파일 커밋 및 Issue 생성이 가능합니다.


## 11. `Official Notice Monitor` 수동 실행

1. GitHub 저장소를 열고 상단 `Actions` 탭을 누릅니다.
2. 왼쪽 목록에서 `Official Notice Monitor`를 선택합니다.
3. 오른쪽 `Run workflow`를 누릅니다. 브랜치는 `main`을 선택하고 초록색 `Run workflow`를 다시 누릅니다.
4. 실행 목록에서 새 실행을 열고 `Check official source changes`, `Save latest source fingerprints`, `Create one review issue...` 단계를 확인합니다.
5. 보고서는 실행 상세 페이지 아래 `Artifacts`의 `official-source-monitor-report`에서 확인할 수 있습니다. 변경/접근 실패가 있으면 열려 있는 `[공식 공고 자동 감시]` Issue에 최신 보고서가 댓글로 추가됩니다.

자동 실행은 매주 월요일 한국 시간 오전 10:17입니다. 첫 실행은 비교할 이전 해시가 없어 기준값을 저장할 수 있습니다. PDF 원문은 이 HTML 감시에서 제외되므로 PDF 공고는 별도 검증이 필요합니다.

저장소 `Settings → Actions → General → Workflow permissions`에서 `Read and write permissions`를 허용하세요. 저장소의 Issue 기능도 켜져 있어야 검토 Issue를 생성할 수 있습니다.

## 12. 광고 설정 — 검증 및 승인 이후에만

광고는 기본적으로 꺼져 있습니다. Google AdSense에서 사이트 승인을 받고, 개인정보처리방침과 적용 지역의 동의 요건을 실제 설정에 맞게 점검하기 전에는 켜지 마세요.

Cloudflare Pages 프로젝트의 `Settings → Environment variables` 또는 GitHub Actions Variables에 아래 값을 설정하고 새 배포를 실행합니다. `PUBLIC_` 변수는 브라우저에 공개되므로 비밀값을 넣지 마세요.

- `PUBLIC_ADS_ENABLED` = `true` (사이트 검토·개인정보 문구·동의 요구사항 점검 후에만)
- `PUBLIC_ADSENSE_ID` = `ca-pub-`로 시작하는 본인 게시자 ID 16자리 숫자
- `PUBLIC_ADSENSE_SLOT_CONTENT` = AdSense에서 생성한 본문 광고 단위의 슬롯 ID 숫자

Cloudflare 빌드 환경과 GitHub 검증 워크플로에서 같은 값을 써야 합니다. 광고는 `verified` 상태이고 검색 색인이 허용된 전국 가이드/지역 페이지의 본문 중간 슬롯에서만 출력됩니다. 미검증 페이지·홈·문의·개인정보·404에는 광고를 출력하지 않습니다. 광고 클릭 유도, 보상형 클릭, 콘텐츠와 광고의 혼동을 유발하는 배치는 금지합니다.

광고 설정을 켠 뒤에도 광고가 실제 표시된다는 보장은 없습니다. `PUBLIC_ADS_ENABLED=true`를 설정하기 전에 Google AdSense 정책 센터에서 사이트 상태를 확인하세요. 광고 노출·CTR·수익은 Google 심사, 방문자 구성, 경매 수요, 광고 차단 및 페이지 품질에 따라 달라집니다.

## 13. 자동화 범위와 안전 한계

- 매주 공식 HTML 출처 변경/접근 실패 감시, 보고서 생성, 검토 Issue 생성·갱신이 자동입니다.
- 검증 완료 자료의 최신성도 매주 검사합니다. 확인일이 60일을 넘으면 검토 Issue를 만들고 작업을 실패 처리해 알림을 남깁니다.
- 공식 공고의 재산·소득 숫자와 신청 기간은 원문을 의미 단위로 검증하지 않고 자동 변경하지 않습니다. 페이지 해시 변경은 메뉴·레이아웃 변경일 수도 있기 때문입니다.
- 현재 원본 데이터는 `unverified`이므로 색인 및 광고가 비활성인 것이 의도된 안전 상태입니다. 모든 페이지를 사람이 원문 대조하지 않은 채 자동으로 `verified`로 바꾸지 마세요.
- 이 ZIP은 전체 Astro 빌드/실제 Cloudflare 배포/AdSense 승인까지 증명하지 않습니다. GitHub `Validate and Build`가 초록색인지 확인한 뒤 실제 페이지 소스와 AdSense 정책 센터를 점검하세요.

## v1.7.0 추가 확인
1. `Actions` → `Official Notice Monitor`를 수동 실행합니다.
2. `monitor` 작업이 초록색이면 스크립트가 실행을 완료한 것입니다. 실제 공식 출처 접근 실패나 변경이 있으면 실행 요약/Artifact/Issue에 `검토 필요`로 표시될 수 있습니다. 초록색은 모든 공고가 최신이라고 보증하지 않습니다.
3. `source-monitor-report.md` Artifact에서 변경 출처와 관련 문구를 확인한 뒤, 공식 원문을 사람이 대조합니다. 숫자·자격·접수기간은 자동으로 덮어쓰지 않습니다.
4. AdSense 승인 후 Cloudflare Pages 빌드 변수 `PUBLIC_ADSENSE_ID`, `PUBLIC_ADS_ENABLED`, `PUBLIC_ADSENSE_SLOT_CONTENT`를 실제 값으로 설정하면 `/ads.txt`가 게시자 선언을 출력합니다. 게시자 ID를 설정하지 않으면 안내 주석만 출력합니다.
5. ZIP을 업로드하기 전에 기존 파일은 유지하고 같은 경로의 파일만 덮어씁니다. 배포 전 `Validate and Build` 성공 여부를 확인합니다.


## v1.7.0 변경사항
- 라이트 테마 및 Firefox 포함 링크/카드 대비 개선
- 홈의 내부 검증 건수 문구 제거, 서비스 안내/정정 이력으로 상태 이동
- 편집·검증 정책(`/editorial-policy/`) 및 정정 이력(`/corrections/`) 추가
- Official Notice Monitor가 스크립트 자체 실패를 성공으로 숨기지 않도록 워크플로 개선

주의: 자동 감시는 공고 변경 감지와 안전 격리를 담당합니다. HTML에서 숫자가 발견된 것만으로 정부 기준을 검증 완료 처리하지 않습니다. 지역 이름만 바꾼 226개 페이지 생성도 하지 않습니다. 검증되지 않은 수치의 자동 게시보다 미검증 유지가 안전합니다.


## AdSense 사전 자체 점검
GitHub Actions 로그 또는 로컬 Node.js 환경에서 `npm run check:adsense`를 실행하면 필수 안내 페이지, 색인 가능한 검증 데이터, 문의 이메일, 광고 설정 형식 등을 보고합니다. 이는 Google 승인 기준 전체를 대변하지 않으며 승인이나 광고 유지 여부를 보장하지 않습니다. `CHECK` 결과는 확인 후 조치하세요.
