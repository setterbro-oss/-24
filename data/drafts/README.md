# 초안 큐

공식 원문 URL과 공고 내용이 항목별로 확인되기 전에는 `src/data/regions.json`의 공개 데이터로 승격하지 않습니다.

- `youth-api-candidates.json`은 온통청년 API에서 수집한 **비공개 후보 대기열**입니다.
- 후보의 `verificationStatus`는 `unverified`이며, `verificationReport`가 없는 것이 정상입니다.
- API의 요약/지원 필드는 공식 원문을 직접 대조한 증거가 아닙니다. `candidateEvidence`의 `reviewStatus`도 모두 `needs_official_source_review`로 남습니다.
- `reviewChecklist`를 따라 원문에서 대상·지원 금액·소득·신청 기간·중복 제한·선정 방식 등을 확인하고, 사용자에게 필요한 독립적인 설명을 편집합니다.
- 검증 후에도 자동 승격하지 않습니다. 사람이 `src/data/regions.json`에 편집한 레코드를 추가하고, 각 claim의 `sourceSnippet`을 원문 발췌와 일치시키며, `verificationReport.snapshotHash`를 실제 `snapshotText`의 SHA-256으로 계산해야 합니다.
- 초안 큐는 `src/pages/`에서 읽지 않으므로 공개 페이지, 사이트맵, 광고 슬롯에 노출되지 않습니다.

`npm run ingest:youth -- --probe`는 API 응답 구조를 확인합니다. `npm run ingest:youth:dry`는 후보 요약만 출력하고 파일을 쓰지 않습니다.
