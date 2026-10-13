# 청년월세24 v1.10.0 — 적용 안내

## 이번 버전에서 바뀐 점

- 홈 화면에 게시 게이트와 독립된 읽기 전용 검증 현황 보드를 추가했습니다. 공개 가능·대조 진행·보류 건수는 실제 레코드의 기존 게이트 결과에서 계산합니다.
- 공개 가능한 자료가 0건이면 빈 "먼저 확인하세요"/"지자체별 정보" 제목을 렌더링하지 않고, 공개 가능한 자료가 없다는 안내를 표시합니다. 미검증 데이터의 링크·요약·지원 수치는 홈 카드로 노출하지 않습니다.
- `/about/#data-status`에서 동일한 보드의 상세 항목을 확인할 수 있고, 모바일에서는 표를 카드로 전환합니다.
- `src/pages/[region].astro`의 `facts` 조건부 섹션에서 빌드를 막던 닫는 중괄호 누락을 수정했습니다.
- `verify-build.mjs`에 홈의 빈 섹션·빈 상태 안내·현황 보드 검사를 추가했습니다.
- 회귀 테스트 5개를 추가했습니다.

- 단일 게시 게이트 `src/lib/publish-gate.mjs` 추가: 검증 상태, 45일 최신성, 공식기관 도메인, 원문 스냅샷 해시, 항목별 근거 문장, facts 4개 이상, 본문 700자 이상을 한 번에 확인합니다.
- 미통과 페이지는 `noindex,nofollow`, sitemap 제외, 광고 스크립트 제외, 홈 카드/내부 링크 제외 처리합니다.
- `public/_headers`에 draft/demoted 경로의 `X-Robots-Tag: noindex, nofollow`를 자동 생성합니다. `robots.txt`는 해당 경로를 Disallow 하지 않습니다.
- `national.json`의 `calc`, `eligibility`와 지역 JSON의 `calc` 중복 수치를 제거했습니다. 계산기·자가진단은 검증된 `verificationReport.claims[]` 값이 존재할 때만 표시합니다.
- 공식 원문 변경 감시는 수치를 자동 수정하지 않습니다. 변경/접근 실패는 검토 대상으로 남깁니다.
- 방문 링크 색상과 푸터 하단 배경을 통일했습니다.

## 현재 데이터 상태

전국 가이드, 서울시, 강남구 레코드는 모두 `unverified`입니다. 이 상태는 의도적입니다. 공식 원문과 모든 핵심 수치의 항목별 근거가 실제로 대조되기 전에는 검색 색인, 광고, 홈 카드, 계산기/자가진단을 열지 않습니다. 이 ZIP은 승인이나 수익을 보장하지 않습니다.

## GitHub 적용

1. ZIP 압축을 풉니다.
2. 저장소 `https://github.com/setterbro-oss/-24`의 `main` 브랜치에서 `Add file → Upload files`를 선택합니다.
3. 압축 해제한 폴더 내부의 모든 파일을 업로드합니다. `.github` 폴더도 포함해야 합니다.
4. 기존 파일과 같은 이름은 덮어쓰고, 삭제된 파일은 GitHub에서 별도로 삭제합니다. 특히 `national.json`과 `regions.json`은 반드시 새 버전으로 교체합니다.
5. `Commit changes` 후 `Actions → Validate and Build`를 열고 최신 실행을 확인합니다.

## 확인 순서

1. `npm test` — 단위 테스트.
2. `npm run check:data` — 데이터 스키마 및 검증 상태.
3. `npm run build` — 헤더 생성 → 데이터 검사 → Astro 빌드 → dist 검증.
4. 배포 후 `https://24.setterbro.workers.dev/guide/` 소스에서 `robots`가 `noindex,nofollow`인지 확인합니다.
5. `/sitemap-index.xml`에서 `/guide/`, `/seoul/`, `/gangnam/`이 빠져 있는지 확인합니다.
6. `/about/#data-status`에서 내부 검증 현황을 확인합니다.
7. Cloudflare 응답 헤더에서 draft 경로에 `X-Robots-Tag: noindex, nofollow`가 있는지 확인합니다.

## 데이터를 정식 공개로 승격할 때 필요한 필드

`verificationReport`는 다음을 모두 포함해야 합니다.

- `sourceUrl`: 레코드 `sourceUrl`과 완전히 동일한 공식 원문 주소
- `checkedAt`: 원문을 확인한 날짜
- `snapshotHash`: 해당 원문 스냅샷의 SHA-256 64자리 해시
- `allClaimsMatch: true`
- `claims[]`: 각 항목의 `id`, `type`, `value`, `unit`, `anchor`, `sourceSnippet`, `verifiedAt`, `status: "matched"`

그 밖에도 `verifiedAt`은 현재 기준 45일 이내여야 하고, `effectiveTo`가 지났거나 잘못된 날짜이면 공개되지 않습니다. 단지 URL이 열리거나 값이 숫자라는 이유만으로 자동 승격하지 마세요. 자동 감시는 원문 변경을 찾아낼 뿐, 의미를 잘못 해석해 지원 기준을 자동 수정하지 않습니다.

## 자동 대조 범위 및 주의사항

이번 ZIP은 홈 현황 UI와 빌드 오류/검증 테스트를 개선한 버전입니다. 공식 원문 해시 감시는 기존대로 변경·접근 실패를 탐지하지만, 원문 의미를 자동으로 완벽히 해석해 `verified`로 승격하는 기능은 추가하지 않았습니다. 숫자·기간·소득·연령을 단순 키워드나 문자열 일치만으로 자동 승격시키면 다른 연도 공고 또는 문맥이 다른 숫자를 잘못 승인할 수 있기 때문입니다. 따라서 `unverified` 자료는 그대로 비공개 상태입니다.

## 설정 및 빌드 한계

- 정식 사이트 주소는 `SITE_URL=https://24.setterbro.workers.dev`입니다. 다른 도메인을 쓰면 Cloudflare와 GitHub Actions 변수에 같은 값을 넣으세요.
- 광고는 기본 비활성 상태로 유지하세요. 검증 완료는 애드센스 승인이나 수익을 보장하지 않습니다.
- 현재 작업 환경에서 GitHub 접근과 npm 레지스트리 연결이 불가능해 Astro 의존성을 설치하지 못했습니다. `node --test tests/*.test.mjs`는 29/29 통과했고 핵심 스크립트 `node --check`도 통과했지만, Astro 전체 빌드는 검증하지 못했습니다. GitHub Actions의 `Validate and Build`가 통과하기 전에는 배포 검증 완료라고 간주하지 마세요.
