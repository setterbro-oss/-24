// 온통청년 청년정책 API → src/data/regions.json (official_api 레코드만 갱신, 수동 레코드는 그대로)
// 필요: GitHub Secret YOUTH_API_KEY (온통청년 오픈API 인증키). 예) node scripts/ingest-youth-policies.mjs --probe
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRecord, isRentPolicy, FIELD } from '../src/lib/youth-api.mjs';
import { todayKst } from '../src/lib/claim-match.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const probe = args.includes('--probe');
const fixture = (args.find((a) => a.startsWith('--fixture=')) || '').split('=')[1];
const KEY = process.env.YOUTH_API_KEY || '';
const API_URL = process.env.YOUTH_API_URL || 'https://www.youthcenter.go.kr/go/ythip/getPlcy'; // 공식 문서의 요청주소로 확인 후 설정
const DETAIL_TEMPLATE = process.env.YOUTH_DETAIL_URL_TEMPLATE || ''; // 예: https://…/ytpPolicyDtl?plcyNo={id} (공식 상세 URL 규칙 확인 후 설정)
const MAX_PAGES = 30, PAGE = 100;
const rd = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

const pick = (json) => json?.result?.youthPolicyList || json?.youthPolicyList || json?.data || json?.items || [];
async function fetchAll() {
  if (fixture) return pick(JSON.parse(fs.readFileSync(fixture, 'utf8')));
  if (!KEY) { console.error('YOUTH_API_KEY 가 없습니다. 건너뜁니다(기존 자료 유지).'); process.exit(0); }
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = new URL(API_URL);
    url.searchParams.set('apiKeyNm', KEY); url.searchParams.set('pageNum', String(page));
    url.searchParams.set('pageSize', String(PAGE)); url.searchParams.set('rtnType', 'json');
    for (const [k, v] of new URLSearchParams(process.env.YOUTH_API_EXTRA_QUERY || '')) url.searchParams.set(k, v);
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`API HTTP ${res.status}`);
    const list = pick(await res.json());
    all.push(...list);
    if (list.length < PAGE) break;
  }
  return all;
}

const items = await fetchAll();
if (probe) {
  console.log(`items=${items.length}`);
  console.log('첫 항목 키:', Object.keys(items[0] || {}).join(', '));
  const expected = Object.values(FIELD);
  const keys = new Set(Object.keys(items[0] || {}));
  console.log('FIELD 매핑 중 응답에 없는 키:', expected.filter((k) => !keys.has(k)).join(', ') || '없음');
  process.exit(0);
}

const today = todayKst();
const national = rd('src/data/national.json');
const regions = rd('src/data/regions.json');
const claimsOf = (rec) => Object.fromEntries((rec.verificationReport?.claims || []).map((c) => [c.type, c]));
const nationalClaims = { age_range: claimsOf(national).age_range, monthly_limit_krw: claimsOf(national).monthly_limit_krw, max_months: claimsOf(national).max_months };
const detailUrlOf = (item) => (DETAIL_TEMPLATE ? DETAIL_TEMPLATE.replace('{id}', encodeURIComponent(String(item[FIELD.id] ?? ''))) : '');

const manual = regions.filter((r) => r.sourceType !== 'official_api');
const prev = new Map(regions.filter((r) => r.sourceType === 'official_api').map((r) => [r.slug, r]));
const fresh = new Map(); const skipped = {};
for (const item of items.filter(isRentPolicy)) {
  const out = buildRecord(item, { today, nationalClaims, detailUrlOf });
  if (out.skip) { skipped[out.skip] = (skipped[out.skip] || 0) + 1; continue; }
  fresh.set(out.record.slug, out.record);
}
// API 에서 사라진 항목은 삭제하지 않고 비공개(unverified)로 보관합니다(404 급증 방지).
const retired = [...prev.values()].filter((r) => !fresh.has(r.slug)).map((r) => ({ ...r, verificationStatus: 'unverified', verifiedAt: '' }));
const next = [...manual, ...fresh.values(), ...retired];
// 서로 다른 정책이 같은 facts 를 갖는 경우(복제 페이지)는 두 번째부터 제외합니다.
const seen = new Set(); const deduped = next.filter((r) => { const sig = JSON.stringify(r.facts.map((f) => [f.label, f.value])); if (seen.has(sig)) { skipped.duplicate_facts = (skipped.duplicate_facts || 0) + 1; return false; } seen.add(sig); return true; });
fs.writeFileSync(path.join(root, 'src/data/regions.json'), JSON.stringify(deduped, null, 2) + '\n');
console.log(`INGEST: api_items=${items.length}, rent_policies=${fresh.size}, retired=${retired.length}, skipped=${JSON.stringify(skipped)}`);
