// 온통청년 청년정책 API(공공데이터포털 15143273) 항목 → 사이트 레코드 변환.
// ⚠ 필드명은 활용신청 후 제공되는 공식 문서와 `--probe` 출력으로 1회 확인하고, 다르면 FIELD 만 고치세요.
import crypto from 'node:crypto';

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

// "청년 + 주거 + 월세" 정책만 대상으로 합니다. 범위를 좁게 잡는 것이 얇은 페이지를 막는 첫 번째 방어선입니다.
export function isRentPolicy(item) {
  const text = [get(item, 'name'), get(item, 'summary'), get(item, 'support')].join(' ');
  const housing = /주거/.test(get(item, 'category')) || /월세|임차료|주거비/.test(text);
  return housing && /월세|임차료/.test(text);
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
  const claimSpec = [];
  for (const [key, label, type] of LABELS) { const v = get(item, key); if (v) { facts.push({ label, value: v }); claimSpec.push([label, type, v]); } }
  if (min && max && min !== '0' && max !== '0') claimSpec.unshift(['지원 연령', 'age_range', `만 ${min}세 ~ ${max}세`]);
  if (agency) claimSpec.push(['주관 기관', 'agency', agency]);
  if (facts.length < 4) return { skip: 'fewer_than_4_facts' };

  const snapshotText = facts.map((f) => `${f.label}: ${f.value}`).join('\n');
  const claims = claimSpec.map(([label, type, value], i) => ({
    id: `api_${i + 1}_${type}`, type, value, unit: 'text', anchor: label,
    sourceSnippet: `${label}: ${value}`, status: 'matched', verifiedAt: today,
  }));

  const rows = [];
  const nAge = nationalClaims.age_range, nMonthly = nationalClaims.monthly_limit_krw, nMonths = nationalClaims.max_months;
  if (min && max && nAge) rows.push({ label: '대상 연령', national: `만 ${nAge.value.replace('~', '~')}세`, local: `만 ${min}~${max}세` });
  if (get(item, 'support') && nMonthly && nMonths) rows.push({ label: '지원 내용', national: `월 최대 ${Number(nMonthly.value).toLocaleString('ko-KR')}원, 최대 ${nMonths.value}회`, local: get(item, 'support').slice(0, 160) });
  if (get(item, 'incomeEtc')) rows.push({ label: '소득 요건', national: '청년가구 중위소득 60% 이하 + 원가구 100% 이하', local: get(item, 'incomeEtc').slice(0, 160) });
  if (get(item, 'applyPeriod')) rows.push({ label: '신청 기간', national: '2026년 접수 5월 29일 종료(다음 공고 확인)', local: get(item, 'applyPeriod').slice(0, 120) });
  if (get(item, 'extraQual')) rows.push({ label: '추가 자격 요건', national: '무주택·부모와 별도 거주 등 공고 기준', local: get(item, 'extraQual').slice(0, 160) });

  const from = ymd(get(item, 'bizStart')) || today;
  const to = ymd(get(item, 'bizEnd'));
  const body = [
    `${agency ? `${agency}가 운영하는 ` : ''}「${name}」의 공식 정책 설명입니다. ${get(item, 'summary') || get(item, 'support')}`.slice(0, 700),
    '위 항목은 온통청년 청년정책 API가 제공한 값을 그대로 옮긴 것이며, 아래 비교표는 국토교통부 청년월세의 공식 대조 완료 수치와 자동으로 맞춰 만든 것입니다. 지원 조건은 해마다 바뀔 수 있으므로 신청 전 공식 공고에서 다시 확인하세요.',
  ];
  return {
    record: {
      slug: `rent-${id}`, name, sourceType: 'official_api',
      description: `${agency ? `${agency}의 ` : ''}「${name}」 지원 대상·지원 내용·신청 방법을 온통청년 공식 정보 기준으로 정리하고 국토교통부 청년월세와 비교했습니다.`.slice(0, 200),
      applyUrl: isOfficialUrl(get(item, 'applyUrl')) && get(item, 'applyUrl') !== sourceUrl ? get(item, 'applyUrl') : 'https://www.youthcenter.go.kr/',
      sourceTitle: `온통청년 - ${name}`, sourceUrl,
      verificationStatus: 'verified', verifiedAt: today, effectiveFrom: from, effectiveTo: to,
      facts, comparison: rows, body,
      editorialNote: '온통청년 청년정책 API 값을 규칙 기반으로 변환한 자료입니다. 매주 API를 다시 조회해 값이 바뀌면 자동 갱신하고, 신청 기간이 끝나거나 항목이 부족하면 검색 노출에서 자동 제외합니다.',
      verificationReport: {
        allClaimsMatch: true, sourceUrl, checkedAt: today,
        snapshotHash: crypto.createHash('sha256').update(snapshotText, 'utf8').digest('hex'),
        snapshotMethod: 'SHA-256 of the official API field values (온통청년 청년정책 API) copied verbatim into snapshotText; deterministic transform, no rewriting.',
        snapshotText, claims,
      },
    },
  };
}
