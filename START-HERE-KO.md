# 먼저 읽으세요 — 업로드 및 배포 순서

## 0. 이 ZIP이 적용한 변경 사항

- 지역별 페이지 템플릿 누락 보완: `src/pages/[region].astro`
- 입력값 검증을 추가한 월세 산술 계산기
- 지역 데이터 검증 스크립트와 자동 테스트
- 빌드 결과물·미검증 페이지 noindex·sitemap 제외 확인
- GitHub Actions 자동 검사/빌드
- 문의 페이지, 404 페이지, robots.txt, 보안 헤더
- 애드센스 기본 비활성화
- 공식 공고 대조 전 모든 지역을 `unverified`로 표시하고 색인에서 제외

## 1. 내 컴퓨터에서 먼저 검사

1. ZIP을 다운로드한 뒤 압축을 풉니다.
2. VS Code에서 압축을 푼 폴더를 엽니다.
3. `Terminal` → `New Terminal`을 선택합니다.
4. 다음을 한 줄씩 실행합니다.

```bash
node -v
npm -v
npm install
npm test
npm run build
```

성공 기준: `npm test`의 모든 테스트 통과, `npm run build` 마지막에 `BUILD VERIFICATION PASSED`가 표시됨. `dist` 폴더가 생성되어야 합니다. 현재 실행 환경에서는 외부 npm 패키지를 다운로드할 수 없어 Astro 전체 빌드 실행까지 검증하지 못했습니다. 실제 첫 빌드는 사용자 PC 또는 GitHub/Cloudflare에서 반드시 확인해야 합니다.

## 2. GitHub 업로드

1. github.com에서 `+` → `New repository`를 눌러 `youth-rent-24` 저장소를 만듭니다.
2. ZIP 자체를 올리는 것이 아니라, **압축을 푼 내부 파일**을 저장소 루트에 올립니다. `.github/workflows/ci.yml`의 `.github` 폴더도 포함해야 합니다.
3. 최상위에 `package.json`, `astro.config.mjs`, `src`, `public`, `.github`, `scripts`, `tests`가 보여야 합니다.
4. 가능하면 먼저 로컬에서 `npm install`을 실행해 생성된 `package-lock.json`도 커밋합니다.
5. GitHub의 `Actions` 탭을 열고 `Validate and build`가 성공하는지 확인합니다. 실패하면 로그의 첫 번째 오류부터 해결해야 합니다.

## 3. Cloudflare Pages 연결

1. dash.cloudflare.com → `Workers & Pages` → `Create application`으로 이동합니다.
2. Pages의 GitHub 연동을 선택하고 `youth-rent-24` 저장소를 연결합니다.
3. 빌드 명령은 `npm run build`, 출력 폴더는 `dist`, 루트 디렉터리는 기본값(`/`)으로 설정합니다.
4. 배포를 시작합니다. 빌드가 실패하면 공개 사이트가 완성된 것이 아니므로 오류 로그를 확인합니다.
5. 배포가 성공하면 제공된 `*.pages.dev` 주소를 열어 홈·지역 페이지·서비스 안내·개인정보·문의·404를 직접 확인합니다.

## 4. 공개 전 필수 작업

- `src/data/regions.json`의 각 지역별 지원금, 소득·재산 기준, 연령, 거주·임대차 조건, 신청 기간, URL을 공식 공고 원문과 하나씩 대조합니다.
- `sourceUrl`에는 포털 메인 페이지가 아닌 해당 사업의 구체적인 공고 원문 URL을 기록합니다.
- 확인 후 `verifiedAt`, `effectiveFrom`, `effectiveTo`를 채우고 `verificationStatus`를 `verified`로 변경합니다. 확인하지 않은 지역을 색인시키기 위해 임의 변경하지 마세요.
- `src/pages/contact.astro`에 실제로 관리되는 문의 이메일/연락 방법을 넣습니다.
- `src/pages/privacy.astro`를 실제 운영 설정에 맞게 검토합니다.
- 이 사이트는 공공기관 공식 사이트가 아닙니다. 소속을 오해하게 만드는 표현을 사용하지 마세요.

검증 전에는 홈과 지역 페이지가 `noindex`이며 지역 페이지는 sitemap에서 제외됩니다. 공식 데이터 검증을 끝내고 고유한 실질 콘텐츠를 만든 뒤에만 색인 허용을 고려하세요.

## 5. Google Search Console

배포 주소가 안정화되고 색인할 콘텐츠의 출처 검증을 마친 뒤 Search Console에서 소유권을 확인하고 `https://실제도메인/sitemap-index.xml`을 제출합니다. 기본 `pages.dev` 주소를 쓰면 그 주소로 제출합니다. sitemap 제출은 색인이나 순위를 보장하지 않습니다.

## 6. 광고 설정은 마지막

광고는 꺼진 상태가 기본입니다. 이 프로젝트의 모든 페이지는 `hasAds={false}`이므로 ID를 입력하거나 환경 변수만 바꾼다고 광고가 표시되지는 않습니다. 애드센스 정책, 필요한 동의 관리, 콘텐츠 품질, 실제 광고 슬롯 코드를 검토하기 전에는 켜지 마세요. 수익 또는 계정의 영구적인 정상 상태는 보장할 수 없습니다.
