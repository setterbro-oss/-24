# 청년월세24 v1.12.0 시작 안내

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
