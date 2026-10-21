# 초안 큐

공식 원문 URL과 고시번호가 확인되기 전에는 지역 JSON을 `verified`로 바꾸지 않습니다. 후보를 추가할 때는 개별 JSON을 이 폴더에 두고, `verificationReport.claims[]` 각 항목에 `id`, `type`, `value`, `unit`, `anchor`, `sourceSnippet`, `verifiedAt`, `status`를 채웁니다.

`sourceSnippet`은 원문에서 복사한 근거 문장이어야 하며 `anchor`는 해당 항목을 식별하는 원문 표현이어야 합니다. 단순히 공식 도메인 URL이 있다는 이유만으로 자동 승인하지 않습니다. 현재 데이터는 모두 `unverified`이며 의도적으로 계산기·자가진단·광고·색인 대상에서 제외됩니다.
