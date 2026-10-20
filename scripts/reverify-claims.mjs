// 매주 실행: 공식 원문을 다시 읽어 claim 문구가 그대로 있는지 확인하고, 있으면 확인일을 갱신합니다.
// 사람이 손으로 verifiedAt 을 고치지 않아도 "원문이 그대로인 동안" 공개 상태가 유지됩니다.
// 사용: node scripts/reverify-claims.mjs [--dry] [--manual-ack=national]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractReadableText } from '../src/lib/source-extract.mjs';
import { matchReport, decideNextState, todayKst } from '../src/lib/claim-match.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const ack = (args.find((a) => a.startsWith('--manual-ack=')) || '').split('=')[1] || '';
const today = todayKst();
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const national = readJson('src/data/national.json');
const regions = readJson('src/data/regions.json');

async function fetchText(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 20000);
  try {
    const res = await fetch(url, {
      signal: ctl.signal, redirect: 'follow',
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; YouthRent24-Reverify/2.0; +contact via site)', 'accept-language': 'ko-KR,ko;q=0.9', accept: 'text/html,*/*;q=0.8' },
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const text = extractReadableText(await res.text());
    if (text.length < 300) return { ok: false, error: `too little readable text (${text.length})` };
    return { ok: true, text };
  } catch (e) {
    const code = e?.cause?.code || e?.cause?.message || e?.name; // "fetch failed" 의 진짜 원인(TLS/차단/타임아웃)
    return { ok: false, error: `${e?.message || e} [${code}]` };
  } finally { clearTimeout(timer); }
}

function reportsOf(record) {
  return [record.verificationReport, ...(Array.isArray(record.supplementalReports) ? record.supplementalReports : [])].filter(Boolean);
}

async function processRecord(id, record) {
  const lines = [];
  const outcomes = [];
  for (const report of reportsOf(record)) {
    const got = await fetchText(report.sourceUrl);
    if (!got.ok) {
      const manual = ack === id;
      outcomes.push({ kind: manual ? 'matched' : 'unreachable', report, manual });
      lines.push(`- ${id} · ${report.sourceUrl} → ${manual ? '사람이 직접 확인(manual-ack)' : `접근 불가: ${got.error}`}`);
      continue;
    }
    const m = matchReport(report, got.text);
    outcomes.push({ kind: m.allMatched ? 'matched' : 'mismatch', report, missing: m.missing });
    lines.push(`- ${id} · ${report.sourceUrl} → ${m.allMatched ? `일치 ${m.matched.length}건` : `문구 없음: ${m.missing.join(', ')}`}`);
  }
  const decision = decideNextState(record, outcomes);
  lines.push(`  결정: ${decision.action} (${decision.reason})`);
  if (decision.action === 'demote') {
    record.verificationStatus = 'unverified'; record.verifiedAt = '';
  } else if (decision.action === 'promote_or_refresh' || decision.action === 'refresh_matched_only') {
    for (const o of outcomes) if (o.kind === 'matched') {
      o.report.checkedAt = today;
      for (const c of o.report.claims) c.verifiedAt = today;
      if (o.manual) o.report.checkMethod = 'manual';
    }
    const dates = reportsOf(record).map((r) => r.checkedAt).sort();
    record.verificationStatus = 'verified';
    record.verifiedAt = dates[0]; // 가장 오래된 보고서 날짜 = 레코드 확인일
  }
  return { lines, changed: decision.action !== 'none' };
}

const targets = [['national', national], ...regions.filter((r) => r.sourceType !== 'official_api' && r.verificationReport).map((r) => [r.slug, r])];
const out = ['# 공식 원문 재대조 보고서', '', `- 실행일(KST): ${today}`, ''];
for (const [id, record] of targets) { const r = await processRecord(id, record); out.push(...r.lines); }
if (!dry) {
  fs.writeFileSync(path.join(root, 'src/data/national.json'), JSON.stringify(national, null, 2) + '\n');
  fs.writeFileSync(path.join(root, 'src/data/regions.json'), JSON.stringify(regions, null, 2) + '\n');
}
fs.writeFileSync(path.join(root, 'reverify-report.md'), out.join('\n') + '\n');
console.log(out.join('\n'));
