# 청년월세24

GitHub + Cloudflare 정적 배포용 Astro 사이트입니다. D1, Workers 코드, 유료 API는 사용하지 않습니다. 사용법은 `START-HERE-KO.md`를 먼저 보세요.

## 구조

```text
src/data/national.json        전국 공통 사업(국토교통부 청년월세) 데이터와 검증 상태
src/data/regions.json         지역별 고유 사업 데이터와 검증 상태
src/data/site.json            사이트 이름, 문의 이메일
src/lib/site.mjs              사이트 주소(SITE_URL)의 단일 기준
src/lib/indexing.mjs          색인 허용 규칙 (레이아웃·sitemap·빌드 검사가 공유)
src/lib/calc.mjs              월세 계산 로직
src/lib/eligibility.mjs       기본 요건 자가진단 로직
src/pages/guide.astro         전국 가이드
src/pages/[region].astro      지역 페이지 템플릿
src/pages/robots.txt.ts       robots.txt 자동 생성
scripts/validate-data.mjs     데이터 형식·중복 내용·출처 검사
scripts/verify-build.mjs      빌드 결과(canonical, noindex, sitemap, robots) 검사
scripts/check-freshness.mjs   확인일이 오래된 verified 데이터 점검
```

## 색인 규칙

페이지는 아래를 모두 만족할 때만 `index`가 되고 sitemap에 들어갑니다. 하나라도 빠지면 `noindex`입니다.

- `verificationStatus`가 `verified`
- `verifiedAt`, `effectiveFrom`이 `YYYY-MM-DD`
- `sourceUrl`이 포털 메인이 아닌 공고 원문 주소이고 `applyUrl`과 다름
- `facts` 4개 이상 (지역 페이지는 직접 쓴 `body` 1문단 이상도 필요)

지역끼리 `facts`가 완전히 같으면 데이터 검사에서 실패합니다. 홈은 가이드나 지역 페이지 중 하나라도 색인 허용일 때만 `index`입니다.

## 명령어

| 명령 | 하는 일 |
|---|---|
| `npm test` | 단위 테스트 (계산, 자가진단, 색인 규칙, 데이터 규칙) |
| `npm run check:data` | 데이터 검사 |
| `npm run build` | 데이터 검사 → 빌드 → 결과물 검사 |
| `npm run check:freshness` | verified 데이터의 확인일이 60일 이내인지 점검 |

## 사이트 주소

기본값은 `https://24.setterbro.workers.dev`입니다. 바꾸려면 빌드 환경 변수 `SITE_URL`을 `https://도메인` 형식(경로 없이)으로 설정합니다. canonical, sitemap, robots.txt가 모두 이 값을 따르며, 다른 주소가 섞이면 빌드 검사가 실패합니다.

## 광고

기본 비활성입니다. 아래가 모두 맞아야 광고 스크립트가 로드됩니다.

- `PUBLIC_ADS_ENABLED=true`, 올바른 `PUBLIC_ADSENSE_ID=ca-pub-…`
- `site.json`에 유효한 `contactEmail`
- 색인 허용 페이지이고 페이지가 `hasAds`를 켠 경우 (현재 모든 페이지 꺼짐)

광고를 켜기 전에 개인정보처리방침을 실제 설정에 맞게 고치고, 광고 영역에 고정 높이(CLS 방지)를 확보하세요. 승인과 수익은 코드로 보장할 수 없습니다.

## 선택: 404 상태 코드

Cloudflare가 Workers 정적 자산으로 배포하는 경우 존재하지 않는 주소에 404 페이지를 보여 주려면 프로젝트에 `wrangler.jsonc`로 `assets.not_found_handling: "404-page"`를 설정할 수 있습니다. Worker 이름이 기존과 달라지면 새 Worker가 생기므로, 설정 전에 Cloudflare 문서를 확인하세요.


## 공식 공고 자동 감시

`.github/workflows/official-source-monitor.yml`은 매주 월요일 공식 HTML 출처를 확인합니다. 원문 내용 해시가 달라지거나 출처에 접근하지 못하면 GitHub Issue와 Actions artifact에 보고서를 남기고, 마지막으로 확인한 해시를 저장합니다.

**중요한 한계:** 자동 감시는 원문 변경을 감지할 뿐, 재산·소득 기준이나 신청 기간이 실제로 바뀌었는지 의미를 정확히 판독하지 않습니다. PDF는 이 HTML 감시에서 제외합니다. HTML 출처 필터는 `.pdf` 확장자 판별을 적용하고, 응답 MIME 유형이 HTML/텍스트가 아니면 실패로 보고합니다. 따라서 기준 수치를 무인으로 덮어쓰지 않으며, 변경이 발견된 페이지는 원문 검토 후 `facts` 등을 수정하고 `verificationStatus`, `verifiedAt`, `effectiveFrom`을 갱신해야 합니다. 확인되지 않은 수치를 자동 게시하는 것은 복지 정보 오류와 검색/광고 정책 위험을 높입니다.

Issue 생성에 실패하면 저장소의 `Settings → Actions → General → Workflow permissions`에서 `Read and write permissions`를 허용하세요. `data-review` 라벨이 없어도 워크플로는 라벨 없이 Issue 생성을 재시도합니다. 출처 HTML 구조 변경으로 감시가 실패할 수 있으므로 Actions 결과도 확인하세요.


## v1.5.0 광고 게재 안전장치

`src/components/AdSlot.astro`는 게시자 ID·광고 슬롯 ID·`PUBLIC_ADS_ENABLED=true`가 모두 유효할 때만 본문 광고를 렌더링합니다. `Layout.astro`도 같은 조건에 더해 페이지 색인 허용과 연락처 유효성을 요구합니다. 광고 기본값은 OFF이며, 검증되지 않은 데이터는 색인·광고에서 제외됩니다. 광고 슬롯은 CLS 완화를 위해 최소 높이를 예약하지만, 이는 승인·수익·광고 표시를 보장하지 않습니다. 광고 설정 안내는 `START-HERE-KO.md` 12절을 참고하세요.
