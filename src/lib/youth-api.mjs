// 온통청년 청년정책 API(공공데이터포털 15143273) 항목 → 사이트 레코드 변환.
// ⚠ 필드명은 활용신청 후 제공되는 공식 문서와 `--probe` 출력으로 1회 확인하고, 다르면 FIELD 만 고치세요.

export const FIELD = {
  id: 'plcyNo', name: 'plcyNm', summary: 'plcyExplnCn', support: 'plcySprtCn', agency: 'sprvsnInstCdNm',
  applyMethod: 'plcyAplyMthdCn', applyPeriod: 'aplyYmd', applyUrl: 'aplyUrlAddr', refUrl: 'refUrlAddr1',
  minAge: 'sprtTrgtMinAge', maxAge: 'sprtTrgtMaxAge', incomeEtc: 'earnEtcCn', extraQual: 'addAplyQlfcCndCn',
  target: 'ptcpPrpTrgtCn', selection: 'srngMthdCn', docs: 'sbmsnDcmntCn', category: 'lclsfNm',
  bizStart: 'bizPrdBgngYmd', bizEnd: 'bizPrdEndYmd',
};
const s = (v) => (v === undefined || v === null ? '' : String(v).replace(/\s+/g, ' ').trim());
const get = (item, key) => s(item?.[FIELD[key]]);
const ymd = (v) => { const t = s(v).replace(/[^0-9]/g, ''); return /^\d{8}$/.test(t) ? `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}` : ''; };
const isOfficialUrl = (u) => { try { const h = new URL(u); return h.protocol === 'https:' && /(^|\.)(go\.kr|or\.kr|korea\.kr)$/.test(h.hostname) && h.pathname.length > 1; } catch { return false; } };

// 청년 주거 정책 후보를 수집하되, 이 함수의 true는 공개 승인이나 사실 검증을 뜻하지 않습니다.
// 서로 다른 사업 유형을 후보 큐에 모으고, 각 사업은 공식 원문 대조 후 별도로 편집·승인합니다.
export function isRentPolicy(item) {
  const text = [
    get(item, 'name'), get(item, 'summary'), get(item, 'support'),
    get(item, 'target'), get(item, 'extraQual'),
  ].join(' ');
  const category = get(item, 'category');
  const housingContext = /주거|복지|금융|생활/.test(category) || /주거|월세|임차|전세|보증금/.test(text);
  const housingProgram = /월세|임차료|주거비|전세보증금\s*반환보증|반환보증료|보증료\s*지원|임차보증금.*대출|대출이자|주거급여|주택바우처/.test(text);
  return housingContext && housingProgram;
}

const LABELS = [
  ['support', '지원 내용', 'support_content'], ['target', '지원 대상', 'support_target'],
  ['extraQual', '추가 자격 요건', 'extra_qualification'], ['incomeEtc', '소득 요건', 'income_condition'],
  ['applyPeriod', '신청 기간', 'application_period'], ['applyMethod', '신청 방법', 'application_method'],
  ['selection', '선정 방식', 'selection_method'], ['docs', '제출 서류', 'documents'],
];

export function buildRecord(item, { today, nationalClaims = {}, detailUrlOf = () => '' }) {
  const id = get(item, 'id').toLowerCase().replace(/[^a-z0-9]/g, '');
  const name = get(item, 'name');
  const agency = get(item, 'agency');
  if (!id || !name) return { skip: 'missing_id_or_name' };
  const sourceUrl = [get(item, 'refUrl'), detailUrlOf(item)].find(isOfficialUrl) || '';
  if (!sourceUrl) return { skip: 'no_official_detail_url' };

  const facts = [];
  const min = get(item, 'minAge'), max = get(item, 'maxAge');
  if (min && max && min !== '0' && max !== '0') facts.push({ label: '지원 연령', value: `만 ${min}세 ~ ${max}세` });
  if (agency) facts.push({ label: '주관 기관', value: agency });
  for (const [key, label, type] of LABELS) { const v = get(item, key); if (v) facts.push({ label, value: v }); }

  // API 응답은 후보 데이터이지, 사람이 원문과 대조한 증거가 아닙니다.
  // 따라서 API 필드값을 verificationReport.claims[].status="matched"로 위장하지 않습니다.
  const candidateEvidence = facts.map((fact) => ({
    label: fact.label,
    value: fact.value,
    sourceField: LABELS.find(([, label]) => label === fact.label)?.[0] || (fact.label === '지원 연령' ? 'minAge/maxAge' : fact.label === '주관 기관' ? 'agency' : 'unknown'),
    reviewStatus: 'needs_official_source_review',
  }));

  const rows = [];
  const nAge = nationalClaims.age_range, nMonthly = nationalClaims.monthly_limit_krw, nMonths = nationalClaims.max_months;
  if (min && max && nAge) rows.push({ label: '대상 연령(후보 비교)', national: `만 ${nAge.value}세`, local: `API 후보값: 만 ${min}~${max}세 (원문 대조 필요)` });
  if (get(item, 'support') && nMonthly && nMonths) rows.push({ label: '지원 내용(후보 비교)', national: `월 최대 ${Number(nMonthly.value).toLocaleString('ko-KR')}원, 최대 ${nMonths.value}개월`, local: `API 후보값: ${get(item, 'support').slice(0, 160)} (원문 대조 필요)` });
  if (get(item, 'incomeEtc')) rows.push({ label: '소득 요건(후보 비교)', national: '전국 사업 공고의 별도 소득 기준', local: `API 후보값: ${get(item, 'incomeEtc').slice(0, 160)} (원문 대조 필요)` });
  if (get(item, 'applyPeriod')) rows.push({ label: '신청 기간(후보 비교)', national: '현재 접수 상태는 최신 전국 공고에서 확인', local: `API 후보값: ${get(item, 'applyPeriod').slice(0, 120)} (원문 대조 필요)` });
  if (get(item, 'extraQual')) rows.push({ label: '추가 자격 요건(후보 비교)', national: '전국 사업 공고의 별도 자격 기준', local: `API 후보값: ${get(item, 'extraQual').slice(0, 160)} (원문 대조 필요)` });

  const from = ymd(get(item, 'bizStart')) || '';
  const to = ymd(get(item, 'bizEnd')) || '';
  const summaryText = get(item, 'summary');
  const supportText = get(item, 'support');
  const body = [
    summaryText,
    supportText,
    get(item, 'target') ? `API상 대상 설명(원문 대조 전): ${get(item, 'target')}` : '',
  ].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index);

  return {
    record: {
      slug: `rent-${id}`, name, sourceType: 'official_api',
      description: `${agency ? `${agency}의 ` : ''}「${name}」 API 후보 자료입니다. 공식 상세 공고 및 조건 대조 전이므로 공개용 설명이 아닙니다.`.slice(0, 200),
      applyUrl: isOfficialUrl(get(item, 'applyUrl')) && get(item, 'applyUrl') !== sourceUrl ? get(item, 'applyUrl') : 'https://www.youthcenter.go.kr/',
      sourceTitle: `온통청년 - ${name}`, sourceUrl,
      verificationStatus: 'unverified', verifiedAt: '', effectiveFrom: from, effectiveTo: to,
      facts, comparison: rows, body, candidateEvidence,
      reviewChecklist: [
        '상세 공식 공고 원문을 브라우저에서 직접 열어 확인',
        '대상·금액·소득·기간·중복 제한을 원문 문구와 항목별 대조',
        'API 요약과 다른 점 및 사용자에게 필요한 해설을 직접 작성',
        '신청 종료 여부와 최신 수정일 확인',
        '편집 검수 후에만 regions.json으로 수동 승격',
      ],
      editorialNote: '비공개 후보 자료입니다. API 필드값은 사실 검증 증거가 아니며, 공식 상세 공고 대조와 사람의 편집 검수가 끝나기 전에는 게시·색인·광고 대상이 아닙니다.',
    },
  };
}
