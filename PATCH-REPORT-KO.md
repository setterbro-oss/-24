# 청년월세24 안전 확장 패치 보고서

## 적용한 변경

1. `src/lib/youth-api.mjs`
   - 월세 외에도 전세보증금 반환보증료, 임차보증금 대출이자, 주거급여, 주택바우처 등 청년 주거정책 후보를 수집하도록 필터 범위를 넓혔습니다.
   - API 필드값을 사람이 대조한 것처럼 `verificationReport.allClaimsMatch=true` / `status=matched`로 기록하던 방식을 제거했습니다.
   - 일반 문장을 덧붙여 700자를 채우지 않고, API에서 온 설명만 후보로 저장합니다.
   - 후보는 항상 `verificationStatus: unverified`이며 검토 체크리스트가 포함됩니다.

2. `scripts/ingest-youth-policies.mjs`
   - 기존처럼 `src/data/regions.json`을 직접 수정하지 않습니다.
   - API 결과는 `data/drafts/youth-api-candidates.json`에만 저장합니다.
   - 테스트 fixture는 `--dry-run` 또는 `--probe` 없이 파일을 쓸 수 없게 막았습니다.

3. `.github/workflows/data-refresh.yml`
   - 매일 온통청년 API 후보를 수집하되 공개 데이터 파일은 변경하지 않습니다.
   - 초안 큐 검증 후 해당 큐 파일만 커밋합니다.
   - 기존 `.github/workflows/official-source-monitor.yml`은 원문 변경 감시와 이슈 알림을 담당하므로 삭제하지 않았습니다.

4. `scripts/validate-drafts.mjs`, `package.json`
   - 초안의 공식 HTTPS 상세 URL, 중복 slug, `unverified` 상태, 검증 보고서 미포함 여부를 검사하는 `npm run check:drafts`를 추가했습니다.
   - `npm run ingest:youth:dry` 명령을 추가했습니다.

5. `tests/youth-api.test.mjs`, `data/drafts/README.md`, `OPERATIONS-KO.md`, `README.md`
   - 확장된 후보 필터와 비공개 기본값을 테스트하고 운영 절차를 문서화했습니다.

## 검증 결과

- `npm test`: 54/54 통과
- `npm run check:data`: 통과
- `npm run lint:policy`: 통과
- `npm run check:drafts`: 통과 (초안 큐가 아직 없으므로 정상적으로 건너뜀)
- `node scripts/ingest-youth-policies.mjs --fixture=tests/fixtures/youth-api-sample.json --dry-run`: 3개 후보를 확인했고 파일을 쓰지 않음
- `npm run build`: Astro 실행 파일이 설치되어 있지 않아 `astro: not found`로 끝났습니다. npm 설치도 이 실행 환경에서 시간 초과되어 전체 Astro 빌드는 확인하지 못했습니다.

## 의도적으로 하지 않은 변경

- 서울시 자료를 저장된 발췌문만으로 자동 `verified`로 승격하지 않았습니다. 해당 페이지의 2026년 접수는 저장된 발췌상 5월 19일에 종료된 것으로 보여, 공개하려면 현재 상태를 명확히 설명하고 비교 수치까지 별도로 편집 검토해야 합니다.
- 강남구 자료를 자동 승인하지 않았습니다. 저장소의 감시 기록은 해당 페이지에서 읽을 수 있는 텍스트가 부족했다고 기록합니다.
- API 후보를 자동 공개하거나 광고를 자동 활성화하지 않았습니다.
- 700자 문턱을 통과시키기 위한 반복적·일반적 문장을 생성하지 않았습니다.

## 다음 실행 순서

1. 저장소에 파일을 반영하고 `YOUTH_API_KEY`를 GitHub Actions Secret에 등록합니다.
2. Actions → **Collect Youth Housing Policy Candidates** → **Run workflow**를 실행합니다.
3. `data/drafts/youth-api-candidates.json`에서 실제 후보와 공식 상세 URL을 확인합니다.
4. 원문을 직접 열어 사실을 대조하고, 독립적인 설명을 작성한 뒤 수동 검수된 자료만 `src/data/regions.json`으로 승격합니다.
5. `npm test`, `npm run check:data`, `npm run lint:policy`, `npm run build`가 모두 통과한 뒤 배포합니다.

> 이 패치는 저품질 자동 게시 위험을 줄이도록 설계되었지만, 애드센스 승인을 보장하지 않습니다. 검색 노출·광고 게재 여부는 실제 페이지의 품질과 Google의 별도 심사에 달려 있습니다.
