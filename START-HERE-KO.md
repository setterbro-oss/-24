# 청년월세24 v1.9.0 — 적용 안내

## 이번 버전에서 바뀐 점

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

## 설정 및 빌드 한계

- 정식 사이트 주소는 `SITE_URL=https://24.setterbro.workers.dev`입니다. 다른 도메인을 쓰면 Cloudflare와 GitHub Actions 변수에 같은 값을 넣으세요.
- 광고는 기본 비활성 상태로 유지하세요. 검증 완료는 애드센스 승인이나 수익을 보장하지 않습니다.
- 이 실행 환경에서는 npm 의존성 설치가 시간 초과되어 Astro 전체 빌드를 확인하지 못했습니다. `npm test`와 `node scripts/validate-data.mjs`는 통과했지만, GitHub Actions의 `Validate and Build` 성공을 확인하기 전에는 배포 검증 완료라고 간주하지 마세요.
