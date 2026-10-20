# v2.0 운영 안내 (클릭 순서)

## 0. 먼저 할 일 (이것 없이는 수익 0)
1. 압축을 푼 파일을 저장소에 덮어쓰고 커밋 → Actions 의 `Validate and Build` 가 초록인지 확인.
2. `.github/workflows/official-source-monitor.yml` 파일 삭제(새 `data-refresh.yml` 이 대체).
3. Actions → `Data Refresh` → Run workflow. 끝난 뒤 `reverify-report.md` 를 열어 각 출처가 `일치` 인지 확인.
4. 배포 후 https://24.setterbro.workers.dev/ 소스 보기에서 `noindex` 가 사라졌는지 확인.

## 1. 공식 API 자동 수집 켜기(선택, 무료)
1. data.go.kr 로그인 → `한국고용정보원_온통청년_청년정책API` 활용신청(무료) → 온통청년 오픈API 인증키 발급.
2. GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret: `YOUTH_API_KEY`.
3. 같은 화면 Variables 탭: `YOUTH_API_URL`(공식 문서의 요청주소), `YOUTH_DETAIL_URL_TEMPLATE`(공식 정책 상세 URL, `{id}` 자리표시) 입력.
4. 로컬/Codespaces 에서 `YOUTH_API_KEY=키 node scripts/ingest-youth-policies.mjs --probe` → "FIELD 매핑 중 응답에 없는 키"가 나오면 `src/lib/youth-api.mjs` 의 `FIELD` 값을 문서에 맞게 수정.

## 2. 광고 켜기 (승인 후에만)
Cloudflare → Workers & Pages → 해당 프로젝트 → Settings → Build → Variables:
`PUBLIC_ADS_ENABLED=true`, `PUBLIC_ADSENSE_ID=ca-pub-…`, `PUBLIC_ADSENSE_SLOT_CONTENT=…`, `PUBLIC_ADSENSE_SLOT_END=…` 저장 후 재배포.

## 3. 매달 해야 할 사람 작업 (복지로 원문이 로봇에게 안 열리는 동안)
복지로 공지를 직접 열어 문구가 그대로인지 보고 `node scripts/reverify-claims.mjs --manual-ack=national` 실행 → 커밋.
(하지 않으면 가장 오래된 보고서 기준 45일 뒤 해당 페이지가 자동으로 noindex 가 됩니다. 의도된 안전장치입니다.)

## 4. 게시·검증 안전 규칙
- `verified` 표시는 파일 안에 저장된 근거 스냅샷과 claim 문구가 검증 게이트를 통과했다는 뜻이지, 정부기관이 사이트를 보증한다는 뜻이 아닙니다.
- 자동 수집 API의 실제 요청주소·인증 방식·필드명은 공공데이터포털에서 발급받은 최신 문서와 `--probe` 출력으로 확인한 뒤 설정합니다. API 키가 없으면 기존 데이터는 유지됩니다.
- 지역명만 바꾼 템플릿 페이지를 만들지 않습니다. 자동 생성 페이지는 공식 상세 URL, 충분한 사실 항목, 비교표, 고유 설명이 없으면 게시 게이트에서 차단됩니다.
- 임의의 지역 전화번호·지원 금액·소득 기준을 `verified`로 표시하지 않습니다. 별도 지자체 사업은 해당 지역의 구체적인 공식 공고와 근거 스냅샷이 확보되기 전까지 `unverified`로 둡니다.
- 현재 저장소에는 근거 검증이 완료된 226개 지역 데이터가 없습니다. 이 패키지는 확인하지 않은 226개 지역을 가짜로 채우지 않습니다.
- AdSense 광고는 승인 후 실제 게시자 ID와 광고 슬롯 ID를 설정할 때만 렌더링됩니다. 코드만으로 승인, 광고 노출 또는 수익을 보장할 수 없습니다.
