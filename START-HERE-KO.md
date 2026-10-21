# 청년월세24 v1.12.0 시작 안내

## 검토 대기 → 승인 → 배포

자동 후보 검토와 Cloudflare 배포 설정은 [OPERATIONS-KO.md](./OPERATIONS-KO.md)를 따라 진행하세요.

1. ZIP을 풀어 저장소의 파일을 반영하고 `main`에 반영합니다.
2. GitHub 저장소 `Settings → Actions → General`에서 워크플로에 `Read and write permissions`를 허용합니다.
3. `Settings → Rules → Rulesets`에서 `main`에 PR 필수 및 독립 승인 1명 이상을 설정합니다.
4. `Settings → Secrets and variables → Actions`에 온통청년 API 키(선택)와 Cloudflare의 토큰·Account ID를 등록하고, Pages 프로젝트 이름 변수를 등록합니다.
5. `Actions → Candidate Intake (review pending) → Run workflow`로 후보 수집 PR을 만듭니다.
6. 후보 PR에서 `review-report.md`와 공식 공고를 대조하고, 편집 콘텐츠 및 claim별 근거를 보완한 뒤 검수 상태를 `editorial_review`로 표시해 병합합니다.
7. `Actions → Approve reviewed candidate (opens deployment PR) → Run workflow`에서 slug를 선택 입력하고 확인 문구를 지정합니다. 게시 게이트 통과 시 승인 PR이 열립니다.
8. 승인 PR의 변경 파일과 검사 결과를 별도 검토자가 확인하고 승인·병합하면 `main` 배포 작업이 Cloudflare Pages에 게시합니다.

API 응답만으로는 사실 검증, 700자 고유 콘텐츠, 광고/색인 적합성을 자동 판정하지 않습니다. 자세한 필수 설정, 불가 조건, 저장소 비밀값은 `OPERATIONS-KO.md`를 참조하세요.

## 이번 버전 변경점
- `src/lib/source-extract.mjs`: 중첩된 HTML 컨테이너를 끝까지 읽도록 개선하고, `board-view-content`, `nttCn` 등 국내 공공 게시판 선택자를 추가했습니다. 탐색 메뉴·헤더·푸터·사이드바는 fallback 본문에서 제외합니다.
- `scripts/adsense-policy-lint.mjs`: 독립 사이트 고지, 광고 클릭 유도/보장 문구, 공식 발췌문 해시, claim 발췌의 증거 스냅샷 포함 여부를 검사합니다. 빌드 전 자동 실행하며 GitHub Actions 요약에도 결과를 남깁니다.
- `src/pages/guide.astro`: 독립 정보 사이트임을 첫 화면에서 명확히 알립니다.
- `tests/policy-lint.test.mjs` 및 `tests/source-extract.test.mjs`: 근거 무결성, 고지 위치, 중첩 컨테이너와 탐색 노이즈 테스트를 추가했습니다.
- `package.json`: 버전을 1.12.0으로 올리고 정책 린트를 빌드 단계에 연결했습니다.

## GitHub에서 적용
1. 저장소 `https://github.com/setterbro-oss/-24`를 엽니다.
2. `Add file → Upload files` 또는 GitHub 웹 편집기로 압축을 푼 파일의 변경 사항을 반영합니다. 저장소의 `.github/workflows/validate.yml`도 함께 업데이트합니다.
3. `Actions → Validate and Build → Run workflow`를 실행하거나 main에 커밋합니다.
4. `Run tests`, `Validate data`, `Build and verify site` 단계가 모두 초록색인지 확인합니다.
5. `AdSense / publication safety lint` 요약에서 정책 린트가 PASS인지 확인합니다.

## 중요한 한계
- 이 검사는 자동 탐지 가능한 위험 신호와 저장된 근거의 무결성을 검사할 뿐, AdSense 승인이나 정책 위험 0을 보장하지 않습니다.
- 서울시·강남구를 포함한 지역 자료는 각각의 공식 원문과 근거가 확인되기 전까지 미검증 상태를 유지합니다. 접수처 전화번호나 국토부 공통 기준만 결합해서 지역 사업을 VERIFIED로 승격하지 않습니다.
- 강남구 원문이 HTTP 오류, 차단, 짧은 텍스트 또는 JS 렌더링으로 읽히지 않으면 실패로 보고하며, 자동으로 변경 없음/검증 완료로 취급하지 않습니다.
- 본 ZIP은 코드 테스트 41/41 및 데이터/정책 린트 검사를 통과했지만, Astro 전체 빌드는 이 실행 환경에서 의존성을 설치할 수 없어 별도로 확인해야 합니다. GitHub Actions에서 전체 빌드 PASS를 확인하기 전에는 배포 성공이라고 간주하지 마세요.
