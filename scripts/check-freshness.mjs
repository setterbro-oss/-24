// 검증 완료(verified) 데이터의 확인일이 오래되면 실패해 알려 줍니다. 매월 자동 실행됩니다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const MAX_AGE_DAYS = Number(process.env.FRESHNESS_MAX_DAYS || 45);

const records = [
  { id: 'guide', ...read('src/data/national.json') },
  ...read('src/data/regions.json').map((r) => ({ id: r.slug, ...r })),
].filter((r) => r.verificationStatus === 'verified');

if (records.length === 0) {
  console.log('FRESHNESS: 검증 완료 데이터가 아직 없습니다.');
  process.exit(0);
}

const now = Date.now();
const stale = records.filter((r) => {
  const t = Date.parse(r.verifiedAt);
  return !Number.isFinite(t) || (now - t) / 86400000 > MAX_AGE_DAYS;
});

if (stale.length) {
  console.error(`FRESHNESS FAILED: 확인일이 ${MAX_AGE_DAYS}일을 넘은 데이터가 있습니다. 공식 공고를 다시 확인하고 verifiedAt을 갱신하세요.`);
  for (const r of stale) console.error(`- ${r.id}: verifiedAt=${r.verifiedAt} (${r.sourceUrl})`);
  process.exit(1);
}
console.log(`FRESHNESS PASSED: ${records.length}개 데이터가 ${MAX_AGE_DAYS}일 이내에 확인되었습니다.`);
