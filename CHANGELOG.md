# Changelog

## 1.9.0
- 중앙 `getPublishState()` 게이트로 색인·sitemap·광고·내부 링크의 공개 기준 통합.
- 45일 확인 기한, 공식 도메인, 적용기간, source URL 일치, snapshot hash 및 근거 claim 보고서 요구.
- 미검증/강등 페이지용 `X-Robots-Tag: noindex, nofollow` 헤더 자동 생성.
- 하드코딩된 calc/eligibility 필드를 데이터에서 제거하고 검증된 claim에서만 도구 값을 읽도록 변경.
- 미검증 페이지 홈 카드 및 지역 비교 링크 제외.
- 방문 링크 색상 통일 및 sticky footer 적용.
- 24개 테스트 통과. Astro 전체 빌드는 npm 설치 시간 초과로 이 환경에서 검증하지 못함.
