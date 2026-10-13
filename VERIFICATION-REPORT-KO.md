# v1.11.0 공식 근거 검증 기록

- 대상: 전국 공통 `src/data/national.json`
- 공식 원문: https://www.bokjiro.go.kr/ssis-tbu/cms/pc/customer/notice/1309500_1141.html
- 원문 등록일: 2026-03-20
- 검토 기록일: 2026-10-13
- 확인 방식: 공식 복지로 공지의 검색 색인에 노출된 원문 텍스트와 해당 공지의 URL/제목을 대조하고, 아래 발췌를 `verificationReport.snapshotText`에 보존했습니다.
- 해시 범위: `snapshotHash`는 `snapshotText` 문자열의 UTF-8 SHA-256입니다. 원본 웹페이지 HTML 응답 바이트의 해시가 아니며, 그 자체가 외부 출처의 진위를 증명하지는 않습니다.
- 상태: 전국 레코드는 게시 게이트 통과 조건을 갖춥니다. 신규 접수는 2026-05-29 16:00에 종료됐다는 사실을 본문과 FAQ에 명시합니다.
- 주의: 이 기록은 개인별 수급 자격을 확정하지 않습니다. 재산 기준 등 원문 발췌에서 직접 확인되지 않는 수치는 전국 공통 facts에서 제외했습니다.

## 확인된 항목

`verificationReport.claims[]`의 각 항목은 `id`, `type`, `value`, `unit`, `anchor`, `sourceSnippet`, `verifiedAt`, `status`를 가집니다. 현재 10개 항목의 상태는 `matched`입니다.

| Claim ID | 확인값 | 공식 공지의 근거 문구 |
|---|---|---|
| `application_start_date` | 2026-03-30 | 2026년 3월 30일(월) 09시 ~ 2026년 5월 29일(금) 16시 |
| `application_end_date` | 2026-05-29 16:00 | 2026년 3월 30일(월) 09시 ~ 2026년 5월 29일(금) 16시 |
| `age_range` | 19~34세 | 19~34세 부모님과 별도 거주 무주택 청년 |
| `eligible_birth_years` | 1991~2007년생 | '26년 신청 가능 출생연도 : 1991년 ~ 2007년생 |
| `income_limits` | 청년가구 60% 이하, 원가구 100% 이하 | (원가구) 기준 중위소득 100% 이하, (청년가구) 기준 중위소득 60% 이하 |
| `monthly_limit_krw` | 월 200,000원 | 월 20만원씩 최대 24개월(회) 간 지원; 실제 납부하는 월세의 최대 20만원까지 지원 |
| `max_months` | 최대 24회 | 월 20만원씩 최대 24개월(회) 간 지원(생애 1회) |
| `national_new_beneficiaries` | 전국 60,000명 예정 | '26년도 신규 수혜자 전국 6만명 모집 예정(지역별로 선정 인원수가 다름) |
| `new_beneficiary_end_date` | 2028-12 | '26년 신규 수혜자는 '28년 12월까지만 지원 |
| `contact_phone` | 1599-0001 | 전담 콜센터 국토교통부 ☎1599-0001 |

## 서울시와 강남구

- `src/data/regions.json`의 서울시와 강남구는 별도 원문을 독립적으로 검증해야 합니다.
- 둘 다 `verificationStatus: "unverified"`, 빈 `verifiedAt`으로 유지했습니다.
- 강남구 게시판의 추출기는 본문 컨테이너 추출을 개선했지만, 현재 실행 환경에서는 공식 사이트에 직접 HTTP 요청을 할 수 없어 Issue #1의 실시간 접근/추출 성공 여부를 재현하지 못했습니다. 모니터에서 다시 읽을 수 없으면 계속 실패로 기록해야 하며, 이 ZIP은 강남구를 검증 완료로 승격시키지 않습니다.

## 로컬 검사 결과

- `node --test tests/*.test.mjs`: 36/36 PASS
- `node scripts/validate-data.mjs`: PASS
- `node scripts/check-freshness.mjs`: PASS
- `node scripts/build-headers.mjs`: PASS
- `npm run build`: Astro 의존성 미설치로 `astro: not found`에서 중단. 이 실행 환경은 네트워크/DNS가 차단되어 `npm install`을 수행할 수 없었습니다. 따라서 전체 Astro 빌드 성공이라고 주장하지 않습니다.
