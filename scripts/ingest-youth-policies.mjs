
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRecord, isRentPolicy, FIELD } from '../src/lib/youth-api.mjs';
import { todayKst } from '../src/lib/claim-match.mjs';

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(name);
const getArg = (name) => {
  const prefix = `--${name}=`;
  const arg = args.find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : '';
};

const PROBE = hasFlag('--probe');
const DRY_RUN = hasFlag('--dry-run');
const FIXTURE = getArg('fixture');

const API_KEY = process.env.YOUTH_API_KEY || '';
const API_URL =
  process.env.YOUTH_API_URL ||
  'https://www.youthcenter.go.kr/go/ythip/getPlcy';

const DETAIL_TEMPLATE =
  process.env.YOUTH_DETAIL_URL_TEMPLATE || '';

const MAX_PAGES = boundedInteger(
  process.env.YOUTH_API_MAX_PAGES,
  5,
  1,
  30
);

const PAGE_SIZE = boundedInteger(
  process.env.YOUTH_API_PAGE_SIZE,
  100,
  1,
  100
);

const DATA_PATH = path.join(ROOT, 'src/data/regions.json');
const NATIONAL_PATH = path.join(ROOT, 'src/data/national.json');
const DRAFTS_PATH = path.join(ROOT, 'data/drafts');

function boundedInteger(value, fallback, min, max) {
  if (value === undefined || value === '') return fallback;

  const parsed = Number(value);

  if (
    !Number.isSafeInteger(parsed) ||
    parsed < min ||
    parsed > max
  ) {
    throw new Error(
      `잘못된 정수 설정: ${value} (허용 범위 ${min}~${max})`
    );
  }

  return parsed;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJsonAtomically(filePath, data) {
  const tempPath = `${filePath}.tmp`;

  try {
    fs.writeFileSync(
      tempPath,
      JSON.stringify(data, null, 2) + '\n',
      'utf8'
    );

    // 같은 파일 시스템 내에서 교체해 중간 쓰기 상태를 줄입니다.
    fs.renameSync(tempPath, filePath);
  } finally {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}

function extractList(json) {
  const candidates = [
    json?.result?.youthPolicyList,
    json?.youthPolicyList,
    json?.data?.youthPolicyList,
    json?.data,
    json?.items,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  // 목록이 비어 있다는 사실과 API 응답 형식이 바뀐 상황을 구분합니다.
  const knownEmpty =
    json?.result?.youthPolicyList === null ||
    json?.result?.youthPolicyList === undefined;

  if (
    knownEmpty &&
    (json?.result?.totalCount === 0 ||
      json?.result?.totalCnt === 0 ||
      json?.totalCount === 0)
  ) {
    return [];
  }

  throw new Error(
    'API 응답에서 정책 배열을 찾지 못했습니다. --probe로 응답 구조를 확인하세요.'
  );
}

function validateApiUrl(raw) {
  const url = new URL(raw);

  if (url.protocol !== 'https:') {
    throw new Error('API URL은 HTTPS여야 합니다.');
  }

  if (url.username || url.password) {
    throw new Error('API URL에 계정 정보를 넣을 수 없습니다.');
  }

  return url;
}

async function fetchAllPolicies() {
  if (FIXTURE) {
    const fixturePath = path.resolve(ROOT, FIXTURE);

    if (!fs.existsSync(fixturePath)) {
      throw new Error(`Fixture 파일을 찾을 수 없습니다: ${FIXTURE}`);
    }

    const fixture = readJson(fixturePath);
    const list = extractList(fixture);

    console.log(`[FIXTURE] ${list.length}건을 읽었습니다.`);
    return list;
  }

  if (!API_KEY) {
    console.log(
      '[SKIP] YOUTH_API_KEY가 없습니다. 기존 데이터를 변경하지 않습니다.'
    );

    return null;
  }

  const baseUrl = validateApiUrl(API_URL);
  const extraParams = new URLSearchParams(
    process.env.YOUTH_API_EXTRA_QUERY || ''
  );

  // API 키를 로그에 노출하지 않습니다.
  if (extraParams.has('apiKeyNm')) {
    throw new Error(
      'YOUTH_API_EXTRA_QUERY에 인증키를 넣지 마세요. YOUTH_API_KEY를 사용하세요.'
    );
  }

  const all = [];
  const seenIds = new Set();

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = new URL(baseUrl);

    url.searchParams.set('apiKeyNm', API_KEY);
    url.searchParams.set('pageNum', String(page));
    url.searchParams.set('pageSize', String(PAGE_SIZE));
    url.searchParams.set('rtnType', 'json');

    for (const [key, value] of extraParams) {
      url.searchParams.set(key, value);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let response;

    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'user-agent': 'YouthRent24PolicyIngest/2.1',
        },
        signal: controller.signal,
      });
    } catch (error) {
      const reason =
        error?.name === 'AbortError'
          ? '요청 시간 초과'
          : '네트워크 요청 실패';

      throw new Error(`페이지 ${page}: ${reason}`);
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(
        `페이지 ${page}: API HTTP ${response.status}`
      );
    }

    const rawText = await response.text();

    let json;

    try {
      json = JSON.parse(rawText);
    } catch {
      throw new Error(
        `페이지 ${page}: JSON 파싱 실패. API 응답 형식과 인증 상태를 확인하세요.`
      );
    }

    const list = extractList(json);

    if (list.length === 0) break;

    for (const item of list) {
      const id = String(item?.[FIELD.id] ?? '').trim();

      // ID가 없는 행은 임의 ID를 만들어 등록하지 않습니다.
      if (id) {
        if (seenIds.has(id)) continue;
        seenIds.add(id);
      }

      all.push(item);
    }

    console.log(
      `[FETCH] page=${page}, rows=${list.length}, total=${all.length}`
    );

    if (list.length < PAGE_SIZE) break;
  }

  return all;
}

function normalizeSlug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function factSignature(record) {
  return JSON.stringify(
    (record.facts || [])
      .map((fact) => [
        String(fact.label || '').trim(),
        String(fact.value || '').trim(),
      ])
      .sort(([a], [b]) => a.localeCompare(b))
  );
}

function isUsableRecord(record) {
  return (
    record &&
    typeof record.slug === 'string' &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug) &&
    typeof record.name === 'string' &&
    record.name.trim().length >= 2 &&
    typeof record.sourceUrl === 'string' &&
    typeof record.applyUrl === 'string' &&
    Array.isArray(record.facts) &&
    record.facts.length >= 4 &&
    Array.isArray(record.body) &&
    record.body.some(
      (paragraph) =>
        typeof paragraph === 'string' &&
        paragraph.trim().length > 0
    ) &&
    record.verificationReport?.allClaimsMatch === false &&
    Array.isArray(record.verificationReport?.claims) &&
    record.verificationReport.claims.length > 0
  );
}

function main() {
  const items = globalThis.__youthRentItems;

  if (items === null) {
    return;
  }

  if (!Array.isArray(items)) {
    throw new Error('수집 결과가 배열이 아닙니다.');
  }

  const today = todayKst();
  const national = readJson(NATIONAL_PATH);
  const existing = readJson(DATA_PATH);

  if (!Array.isArray(existing)) {
    throw new Error('regions.json은 배열이어야 합니다.');
  }

  const nationalClaims = Object.fromEntries(
    (national.verificationReport?.claims || []).map((claim) => [
      claim.type,
      claim,
    ])
  );

  const nationalComparisonClaims = {
    age_range: nationalClaims.age_range,
    monthly_limit_krw: nationalClaims.monthly_limit_krw,
    max_months: nationalClaims.max_months,
  };

  const publishedSlugs = new Set(existing.map((record) => record.slug));

  const priorDrafts = new Map();
  if (fs.existsSync(DRAFTS_PATH)) for (const file of fs.readdirSync(DRAFTS_PATH).filter((x) => x.endsWith('.json'))) {
    try { const draft = readJson(path.join(DRAFTS_PATH, file)); priorDrafts.set(draft.slug, draft); } catch { /* report malformed drafts below */ }
  }

  const fresh = new Map();
  const skipped = Object.create(null);
  const existingFactSignatures = new Set(
    existing.map(factSignature)
  );
  for (const draft of priorDrafts.values()) {
    if (!draft.reviewState || draft.reviewState !== 'editorial_review') existingFactSignatures.add(factSignature(draft));
  }

  const skip = (reason) => {
    skipped[reason] = (skipped[reason] || 0) + 1;
  };

  for (const item of items) {
    if (!isRentPolicy(item)) {
      skip('not_rent_policy');
      continue;
    }

    const id = normalizeSlug(item?.[FIELD.id]);

    if (!id) {
      skip('missing_policy_id');
      continue;
    }

    let result;

    try {
      result = buildRecord(item, {
        today,
        nationalClaims: nationalComparisonClaims,
        detailUrlOf: (row) => {
          if (!DETAIL_TEMPLATE) return '';

          const rowId = String(row?.[FIELD.id] ?? '');

          if (!rowId) return '';

          return DETAIL_TEMPLATE.replace(
            '{id}',
            encodeURIComponent(rowId)
          );
        },
      });
    } catch {
      skip('record_build_failed');
      continue;
    }

    if (result?.skip) {
      skip(result.skip);
      continue;
    }

    const record = result?.record;

    if (!isUsableRecord(record)) {
      skip('invalid_record_shape');
      continue;
    }

    if (publishedSlugs.has(record.slug)) {
      skip('already_published_slug');
      continue;
    }

    // 같은 정책 ID의 중복 행은 한 건만 사용합니다.
    if (fresh.has(record.slug)) {
      skip('duplicate_policy_id');
      continue;
    }

    // 기존 레코드가 있어도 근거가 부족하거나 기간이 끝난 정책을
    // 강제로 공개하지 않습니다. 기존 publish gate가 최종 판정합니다.
    fresh.set(record.slug, record);
  }

  // 동일한 사실 목록을 가진 API 후보는 하나만 남깁니다.
  const uniqueApiRecords = [];
  const signatures = new Set();

  for (const record of fresh.values()) {
    const signature = factSignature(record);

    if (signatures.has(signature) || existingFactSignatures.has(signature)) {
      skip('duplicate_api_facts');
      continue;
    }

    signatures.add(signature);
    uniqueApiRecords.push(record);
  }

  const changed = [];
  for (const record of uniqueApiRecords) {
    const prior = priorDrafts.get(record.slug);
    // Preserve human edits and evidence in a reviewed draft across refreshes.
    if (prior && prior.reviewState === 'editorial_review') continue;
    const draft = { ...record, verificationStatus: 'unverified', verifiedAt: '', reviewState: 'candidate', candidateUpdatedAt: today };
    const file = path.join(DRAFTS_PATH, `${record.slug}.json`);
    fs.mkdirSync(DRAFTS_PATH, { recursive: true });
    writeJsonAtomically(file, draft);
    changed.push(record.slug);
  }

  const summary = {
    sourceItems: items.length,
    matchingPolicies: items.filter(isRentPolicy).length,
    candidatesWritten: changed.length,
    candidatesPreservedForEditorialReview: uniqueApiRecords.length - changed.length,
    skipped,
    dryRun: DRY_RUN,
  };

  console.log('[INGEST SUMMARY]');
  console.log(JSON.stringify(summary, null, 2));

  if (!changed.length) {
    console.log('[NO CHANGE] 새 검토 후보가 없습니다.');
    return;
  }

  if (DRY_RUN) {
    console.log(
      '[DRY RUN] 변경 내용을 저장하지 않았습니다.'
    );
    return;
  }

  console.log(`[DRAFTS] 검토 후보 ${changed.length}개 저장: ${changed.join(', ')}`);
}

async function run() {
  const items = await fetchAllPolicies();

  if (items === null) return;

  if (PROBE) {
    const first = items[0] || {};
    const keys = new Set(Object.keys(first));

    console.log(`[PROBE] items=${items.length}`);
    console.log('[PROBE] 응답 키:', [...keys].join(', '));
    console.log(
      '[PROBE] FIELD 매핑:',
      JSON.stringify(FIELD, null, 2)
    );

    for (const [logicalName, fieldName] of Object.entries(FIELD)) {
      if (!keys.has(fieldName)) {
        console.log(
          `[PROBE WARNING] ${logicalName}: 응답에 ${fieldName} 필드가 없습니다.`
        );
      }
    }

    console.log(
      '[PROBE] 이 검사는 응답 구조만 확인합니다. 정책의 사실 검증이나 공개 승인을 의미하지 않습니다.'
    );

    return;
  }

  globalThis.__youthRentItems = items;

  try {
    main();
  } finally {
    delete globalThis.__youthRentItems;
  }
}

run().catch((error) => {
  // 인증키 및 요청 URL의 쿼리 값은 출력하지 않습니다.
  console.error(`[INGEST ERROR] ${error.message}`);
  process.exitCode = 1;
});
