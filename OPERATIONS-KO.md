# 검토 대기 → 승인 → 배포 운영 안내

## 흐름

1. 매주 월요일 또는 수동 실행으로 온통청년 API에서 후보만 가져옵니다.
2. 수집기는 `data/drafts/*.json`만 만들고 `review-report.md`에 출처 접근 여부, 중복, 후보 날짜, 현재 게시 게이트 차단 사유를 씁니다. 자동 수집이 `src/data/regions.json`을 수정하지 않습니다.
3. `Candidate Intake (review pending)`이 검토용 PR을 엽니다. 이 PR은 초안 추가만 하고 배포 대상 페이지를 만들지 않습니다.
4. 담당자는 PR의 `review-report.md`와 공식 원문을 직접 확인하고 초안 JSON을 보완합니다. 원문 주장과 항목별로 대조한 근거, 자체 작성한 고유 설명(700자 이상), 비교 행 3개 이상을 마련합니다. API가 만든 초안은 `verificationReport`를 그대로 두면 게이트에서 거부됩니다.
5. 편집 검수를 마친 JSON에서 `reviewState`를 `editorial_review`로 바꾸고 후보 PR을 병합합니다. 병합은 검토 대기 자료만 저장합니다.
6. GitHub에서 `Actions → Approve reviewed candidate (opens deployment PR) → Run workflow`로 이동해 해당 `slug`를 입력하고 확인 문구를 선택합니다. 이 단계는 기존 게시 게이트를 통과하는 후보만 게시 승인 PR로 승격합니다.
7. 게시 승인 PR의 검사들이 통과하면 별도 권한을 가진 검토자가 `Files changed`와 근거를 확인하고 `Review changes → Approve`를 누른 뒤 `Merge pull request`를 누릅니다. `main`에 병합된 커밋만 Cloudflare Pages에 배포됩니다.

> 수동 승인 문구는 요청자의 확인 표시이며, 사실 확인의 증거가 아닙니다. 승인 스크립트도 원문 사실을 독립적으로 판정하지 않습니다. 모든 출처 claim의 수동 대조 기록과 본문 품질을 PR에서 검토해야 합니다.

## GitHub 설정 (처음 한 번)

### 1. 워크플로 권한

저장소에서 `Settings → Actions → General → Workflow permissions`를 열고 `Read and write permissions`를 선택한 뒤 `Save`를 누릅니다. 이는 자동 후보 PR과 승인 PR을 만드는 데 필요합니다.

### 2. `main` 보호

`Settings → Rules → Rulesets → New ruleset → New branch ruleset`에서 대상 브랜치 `main`을 지정하고 `Require a pull request before merging` 및 `Require approvals`를 켭니다. 검토자 1명 이상을 지정하고 검토자가 PR 작성자와 달라야 합니다. Actions 검사도 필수로 선택합니다. 저장소가 규칙을 지원하는 공개 저장소인지 확인하세요. 보호 규칙 없이 직접 `main`에 푸시하면 PR 승인 단계가 보장되지 않습니다.

### 3. API 후보 수집(선택)

1. 공공데이터포털에서 한국고용정보원 온통청년 API 키를 발급합니다.
2. `Settings → Secrets and variables → Actions → New repository secret`에서 이름 `YOUTH_API_KEY`, 값 발급 키를 저장합니다.
3. 같은 화면의 `Variables` 탭에서 API 문서를 확인해 `YOUTH_API_URL`과 상세 링크 템플릿 `YOUTH_DETAIL_URL_TEMPLATE`을 설정합니다. URL 템플릿에는 정책 ID 자리에 `{id}`를 넣습니다.
4. `Actions → Candidate Intake (review pending) → Run workflow`를 선택합니다. API 키가 없으면 수집은 건너뛰며 기존 초안을 바꾸지 않습니다.

### 4. Cloudflare Pages 배포

1. Cloudflare 대시보드에서 기존 Pages 프로젝트 이름을 확인합니다. 프로젝트의 실제 빌드 출력 디렉터리는 `dist`여야 합니다.
2. 배포 권한 범위를 최소화한 Cloudflare API 토큰을 만들고 Account ID를 확인합니다.
3. GitHub `Settings → Secrets and variables → Actions → New repository secret`에서 `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`를 저장합니다.
4. `Variables → New repository variable`에서 `CF_PAGES_PROJECT`를 기존 Pages 프로젝트 이름으로 저장합니다.
5. `Actions → Deploy approved main to Cloudflare Pages`의 수동 실행으로 첫 연결을 확인합니다. 이후 `main` 병합이 검증 빌드와 Pages 배포를 시작합니다.

Cloudflare Pages 프로젝트가 이미 같은 저장소의 Git 자동 배포를 사용한다면 중복 배포를 막기 위해 Cloudflare 대시보드의 Git 자동 배포를 끄고 이 워크플로만 사용하세요.

## 검토 기준 및 거부되는 제안

- `src/lib/publish-gate.mjs`가 기존 기준을 단일 판정합니다: 최근 45일 이내 확인, 구체적인 공식 HTTPS 출처, claim별 보고서와 스냅샷, 사실 4개 이상, 고유 본문 700자 이상, API 자료는 비교 행 3개 이상.
- 공개 페이지는 게시 게이트를 통과해야 색인·사이트맵·광고에서 사용할 수 있습니다. 미검증 초안은 이 데이터 경로에 들어가지 않습니다.
- 이전 제안의 “API 응답을 matched로 표시하고 생성 문장으로 700자를 채우기”와 “서울 자료 즉시 verified 처리”는 반영하지 않았습니다. API가 반환했다는 사실은 공고 원문과 주장이 일치한다는 증거가 아닙니다. 출처 스냅샷만으로는 편집 검수나 사실 검증을 대신할 수 없습니다.
- 자동화는 후보 발견, 중복 제거, 출처 URL 접근 점검, 게이트 차단 사유 보고까지 합니다. HTTP 성공은 원문 최신성이나 정확성을 증명하지 않습니다.
- 승인된 변경도 PR 검사 및 보호 브랜치의 별도 검토·병합을 거쳐야 배포됩니다.

## 로컬 확인 명령

```text
npm test
npm run check:data
npm run check:freshness
npm run review:candidates
npm run build
```
