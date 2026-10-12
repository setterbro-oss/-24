// 공식 공고의 변경 여부를 감시합니다. 변경 내용을 자동으로 정책 데이터에 덮어쓰지 않습니다.
// 공식 페이지 구조/표현이 바뀌면 의미를 잘못 해석할 수 있으므로 알림 후 검증 대기 상태로 둡니다.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const national = readJson('src/data/national.json');
const regions = readJson('src/data/regions.json');
const statePath = path.join(root, 'src/data/source-monitor-state.json');
const reportPath = path.join(root, 'source-monitor-report.md');
const sources = [
  { id: 'national-main', label: national.sourceTitle, url: national.sourceUrl },
  ...(national.sources || []).filter((s) => !/\\.pdf(?:$|[?#])/i.test(s.url)).map((s, i) => ({ id: `national-ref-${i + 1}`, label: s.label, url: s.url })),
  ...regions.filter((r) => !/\\.pdf(?:$|[?#])/i.test(r.sourceUrl)).map((r) => ({ id: `region-${r.slug}`, label: r.sourceTitle, url: r.sourceUrl })),
];
const timeoutMs = 15000;
const maxBytes = 2 * 1024 * 1024;
const cleanText = (html) => html
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/\s+/g, ' ').trim();
async function inspect(source) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(source.url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'user-agent': 'YouthRent24-OfficialNoticeMonitor/1.0 (+source-change-check)' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get('content-type') || '';
    if (!/text\/html|text\/plain|application\/pdf/i.test(contentType)) throw new Error(`unsupported content-type: ${contentType}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > maxBytes) throw new Error(`response exceeds ${maxBytes} bytes`);
    const body = cleanText(bytes.toString('utf8'));
    if (body.length < 300) throw new Error(`too little readable text (${body.length} chars)`);
    return { id: source.id, label: source.label, url: source.url, ok: true,
      hash: crypto.createHash('sha256').update(body).digest('hex'), length: body.length,
      checkedAt: new Date().toISOString() };
  } catch (error) {
    return { id: source.id, label: source.label, url: source.url, ok: false,
      error: String(error?.message || error), checkedAt: new Date().toISOString() };
  } finally { clearTimeout(timer); }
}
const previous = fs.existsSync(statePath) ? readJson('src/data/source-monitor-state.json') : null;
const oldById = new Map((previous?.sources || []).map((s) => [s.id, s]));
const current = [];
const changed = [];
const failed = [];
for (const source of sources) {
  const result = await inspect(source);
  current.push(result);
  const old = oldById.get(source.id);
  if (!result.ok) failed.push(result);
  else if (old?.ok && old.hash !== result.hash) changed.push({ ...result, previousHash: old.hash });
  else if (old && !old.ok && result.ok) changed.push({ ...result, previousHash: '이전 확인 실패' });
  else if (!old && previous) changed.push({ ...result, previousHash: '신규 출처' });
}
const firstRun = !previous;
// 출처가 바뀌었거나 접근할 수 없으면 연결된 페이지의 검증 상태를 자동으로 해제합니다.
// 이 동작은 수치 데이터를 바꾸지 않고, 검토 전 색인 노출만 막는 보수적 보호장치입니다.
const affectedIds = new Set([...changed, ...failed].map((s) => s.id));
let quarantined = 0;
if (affectedIds.has('national-main') || [...affectedIds].some((id) => id.startsWith('national-ref-'))) {
  if (national.verificationStatus === 'verified') {
    national.verificationStatus = 'unverified';
    national.verifiedAt = '';
    fs.writeFileSync(path.join(root, 'src/data/national.json'), JSON.stringify(national, null, 2) + '\n');
    quarantined++;
  }
}
for (const region of regions) {
  if (affectedIds.has(`region-${region.slug}`) && region.verificationStatus === 'verified') {
    region.verificationStatus = 'unverified';
    region.verifiedAt = '';
    fs.writeFileSync(path.join(root, 'src/data/regions.json'), JSON.stringify(regions, null, 2) + '\n');
    quarantined++;
  }
}
fs.writeFileSync(statePath, JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), sources: current }, null, 2) + '\n');
const lines = [
  '# 공식 공고 변경 감시 보고서', '',
  `- 확인 시각: ${new Date().toISOString()}`,
  `- 출처 수: ${sources.length}`,
  `- 변경 감지: ${firstRun ? 0 : changed.length}`,
  `- 접근 실패: ${failed.length}`, `- 색인 차단으로 전환한 페이지: ${quarantined}`, '',
  firstRun ? '최초 기준값을 저장했습니다. 다음 실행부터 변경 여부를 비교합니다.' :
    changed.length ? '## 변경된 출처 — 사실 데이터 자동 수정 금지, 원문 재검증 필요' : '변경 감지된 출처가 없습니다.',
  ...changed.map((s) => `- **${s.label}** (${s.id})\n  - URL: ${s.url}\n  - 이전 SHA-256: ${s.previousHash}\n  - 현재 SHA-256: ${s.hash}`),
  ...(failed.length ? ['', '## 접근 실패 — 변경 없음으로 간주하지 마세요', ...failed.map((s) => `- **${s.label}** (${s.id}): ${s.error}\n  - URL: ${s.url}`)] : []),
  '', '## 운영 규칙', '해시 변경은 페이지 내용이 달라졌다는 신호일 뿐, 지원 기준이 바뀌었다는 확정 판정이 아닙니다. 스크립트는 재산·소득·신청기간 숫자를 추측해 자동 수정하지 않습니다. 변경 또는 접근 실패가 있으면 GitHub Issue 알림을 만들고 해당 페이지는 검증 상태를 사람이 원문 대조하기 전까지 `unverified`로 유지하세요.',
];
fs.writeFileSync(reportPath, lines.join('\n') + '\n');
const output = process.env.GITHUB_OUTPUT;
if (output) fs.appendFileSync(output, `changed=${firstRun ? 0 : changed.length}\nfailed=${failed.length}\nquarantined=${quarantined}\nfirst_run=${firstRun}\n`);
console.log(`SOURCE MONITOR: ${sources.length} sources, changed=${firstRun ? 0 : changed.length}, failed=${failed.length}, quarantined=${quarantined}, firstRun=${firstRun}`);
if (failed.length) process.exitCode = 2;
