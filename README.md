# 청년월세24 — 배포 전 검증용 Astro 사이트

이 저장소는 GitHub + GitHub Actions + Cloudflare Pages에서 정적 사이트로 배포하기 위한 프로젝트입니다. D1, Workers, 유료 API는 사용하지 않습니다.

## 꼭 알아둘 점

- 현재 `src/data/regions.json`의 지원금·보증금·월세·소득 수치는 **공식 공고와 대조가 완료되지 않은 참고 데이터**입니다. 검증 전에는 실제 지원 기준처럼 게시하거나 수급 판단에 사용하지 마세요.
- 모든 미검증 지역 페이지는 `noindex,follow`가 적용되고 sitemap에서 제외됩니다.
- 광고는 기본 비활성화이며 지역별 페이지에서도 비활성화되어 있습니다. 승인이나 수익은 보장되지 않습니다.
- 문의 페이지의 운영자 연락처, 개인정보처리방침의 실제 운영 정책, 출처·적용기간 검증을 완료하기 전에는 운영용 공개를 하지 마세요.
- 자동 생성 페이지 수를 늘리는 것보다 공식 출처에 근거한 독창적이고 유용한 정보를 먼저 확보하세요.

## 로컬 실행 (Windows)

1. Node.js 22 LTS 이상과 Git을 설치합니다.
2. ZIP을 압축 해제하고 VS Code에서 `youth-rent-24-ready` 폴더를 엽니다.
3. 메뉴 `Terminal` → `New Terminal`을 엽니다.
4. 다음 명령을 순서대로 실행합니다.

```bash
node -v
npm -v
npm install
npm test
npm run build
```

`npm run build`는 데이터 검사 → Astro 빌드 → 결과물 검사 순으로 실행됩니다. 성공 시 `dist/` 폴더가 생성됩니다. 로컬 미리보기는 `npm run preview`로 실행할 수 있습니다.

## GitHub에 업로드

### 방법 A — 웹 UI로 업로드

1. GitHub에서 새 저장소 `youth-rent-24`를 만듭니다.
2. ZIP을 먼저 그대로 업로드하지 말고, 압축을 푼 **폴더 안의 파일과 숨김 폴더 `.github`까지** 저장소 루트에 업로드합니다.
3. `npm install`을 실행하면 `package-lock.json`이 생성됩니다. 생성된 파일도 저장소에 커밋하는 것을 권장합니다. (초기 CI는 lock 파일이 아직 없어도 실행되도록 `npm install`을 사용합니다.)
4. GitHub 저장소의 루트에 `package.json`, `package-lock.json`, `astro.config.mjs`, `src/`, `public/`, `.github/workflows/ci.yml`이 보여야 합니다.

### 방법 B — Git 명령 사용

프로젝트 폴더의 터미널에서 실행합니다. `YOUR_GITHUB_USERNAME`은 본인 계정명으로 바꾸세요.

```bash
git init
git branch -M main
git add .
git commit -m "Prepare youth-rent-24 static site"
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/youth-rent-24.git
git push -u origin main
```

이미 Git 저장소가 만들어진 폴더라면 `git init`과 `git remote add origin ...`을 중복 실행하지 마세요.

## Cloudflare Pages 배포

1. Cloudflare Dashboard → **Workers & Pages** → **Create application**을 엽니다.
2. Pages의 Git 연동 옵션을 선택하고 GitHub 계정을 연결합니다.
3. `youth-rent-24` 저장소를 선택합니다.
4. 빌드 설정을 지정합니다.
   - Framework preset: Astro (선택 가능한 경우)
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/` 또는 비워 둠
   - Production branch: `main`
5. 처음에는 환경 변수 없이 배포해도 됩니다. `SITE_URL`을 설정한다면 `https://`로 시작하는 실제 도메인을 사용합니다. 기본값은 `https://youth-rent-24.pages.dev`입니다.
6. **Save and Deploy**를 누릅니다. GitHub Actions의 `Validate and build` 워크플로와 Cloudflare 빌드 로그가 모두 성공하는지 확인합니다.

Cloudflare의 메뉴 이름과 무료 플랜 한도는 변경될 수 있으므로 현재 공식 문서를 확인하세요: https://developers.cloudflare.com/pages/

## 지역 데이터를 검증하는 방법

`src/data/regions.json` 각 항목에 다음 값이 있습니다.

- `verificationStatus`: 처음에는 `unverified`로 둡니다.
- `sourceUrl`: 해당 지원사업의 구체적인 공식 공고 원문 URL이어야 합니다. 일반 포털 홈 주소만으로 검증 처리하지 마세요.
- `verifiedAt`: 공고와 데이터를 마지막으로 대조한 날짜 (`YYYY-MM-DD`).
- `effectiveFrom`: 공고의 적용 시작일 (`YYYY-MM-DD`).
- `effectiveTo`: 적용 종료일을 알고 있을 때 `YYYY-MM-DD`, 아니면 빈 문자열.

공식 공고 원문을 직접 확인한 후, 해당 지역의 금액·연령·소득·재산·거주·임대차·중복지원·신청기간·신청 URL을 실제 내용에 맞게 수정하세요. 해당 자료를 확인한 뒤에만 `verificationStatus`를 `verified`로 바꿉니다. 이 설정은 색인 허용 여부를 바꾸므로, 단순히 페이지를 색인시키기 위해 임의로 변경하면 안 됩니다.

검사 실행:

```bash
npm run check:data
npm test
npm run build
```

검증 규칙은 `scripts/validate-data.mjs`에 있으며, 빌드 후 `scripts/verify-build.mjs`가 페이지 출력, 미검증 페이지의 noindex, sitemap 제외 여부를 검사합니다.

## 검색엔진 등록

1. 빌드·배포 결과를 확인하고 실제 도메인 및 canonical 주소가 올바른지 확인합니다.
2. Google Search Console에서 사이트 소유권을 확인합니다.
3. 생성된 `sitemap-index.xml` 주소를 제출합니다. 기본 주소는 `https://YOUR_DOMAIN/sitemap-index.xml`입니다.
4. `unverified` 페이지는 sitemap에서 제외되고 noindex입니다. 검증을 완료한 고유한 콘텐츠만 색인 대상으로 전환합니다.
5. 색인은 보장되지 않습니다. 대량 URL을 무작정 제출하기보다 페이지별 유용성·독창성·정확성을 우선하세요.

## 애드센스 관련 기본값

광고는 기본적으로 꺼져 있습니다. `PUBLIC_ADS_ENABLED=true`와 올바른 `PUBLIC_ADSENSE_ID=ca-pub-` 형식이 동시에 있어야 공통 레이아웃에서 광고 스크립트가 로드될 수 있습니다. 현재 모든 페이지는 `hasAds={false}`로 구성되어 있으므로 이 값만 바꿔도 광고가 자동 삽입되지는 않습니다.

광고를 추가하기 전에 다음을 직접 검토하세요.

- 독창적인 본문과 실제 이용자에게 도움이 되는 페이지가 충분한가?
- 공식 출처, 마지막 확인일, 오류 정정 절차가 있는가?
- 개인정보처리방침에 실제 쿠키·광고·분석 동작과 연락처가 반영되어 있는가?
- 필요한 지역에서 동의 관리 및 개인정보 고지 요건을 충족하는가?
- 광고가 콘텐츠·버튼·내비게이션과 혼동되지 않으며 클릭을 유도하지 않는가?
- 광고 영역에 실제 광고 크기와 일치하는 공간을 확보해 CLS를 줄였는가?

사이트 코드만으로 애드센스 승인, 광고 유지 또는 수익을 보장할 수 없습니다. 광고를 켜기 전에 최신 애드센스 정책과 지역별 법적 요건을 확인하세요.

## 주요 파일

```text
src/data/regions.json          지역별 데이터와 검증 상태
src/pages/[region].astro       지역별 정적 페이지 템플릿
src/components/Calculator.astro 참고용 산술 계산기
src/layouts/Layout.astro       공통 레이아웃·SEO 메타·광고 기본 게이트
scripts/validate-data.mjs      데이터 형식·출처 상태 검사
scripts/verify-build.mjs       빌드 결과·noindex·sitemap 검사
tests/data.test.mjs            데이터 회귀 테스트
.github/workflows/ci.yml       GitHub Actions 자동 검사·빌드
```
