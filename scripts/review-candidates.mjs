import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPublishState } from '../src/lib/publish-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'data/drafts');
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];
const lines = ['# 자동 수집 후보 검토 보고서', '', `실행일(UTC): ${new Date().toISOString()}`, '', '> API 수집은 후보 발견만 의미합니다. API 응답은 사실 검증으로 취급하지 않으며, 초안은 색인·광고에 사용하지 않습니다.', ''];
const slugs = new Set();
const sources = new Set();
for (const file of files) {
  const record = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  const problems = [];
  if (slugs.has(record.slug)) problems.push('중복 slug'); slugs.add(record.slug);
  if (sources.has(record.sourceUrl)) problems.push('중복 출처 URL'); sources.add(record.sourceUrl);
  if (record.verificationStatus !== 'unverified') problems.push('초안 상태가 unverified가 아님');
  if (record.verificationReport?.allClaimsMatch !== false) problems.push('API를 사실 검증으로 표시');
  const gate = getPublishState(record);
  lines.push(`## ${record.slug} — ${record.name}`, '', `- 출처: ${record.sourceUrl}`, `- 신청: ${record.applyUrl}`, `- 초안 갱신일: ${record.candidateUpdatedAt || '없음'}`, `- 항목: ${record.facts?.length || 0}; 본문: ${(record.body || []).join(' ').length}자; 비교 행: ${record.comparison?.length || 0}`, `- 게시 게이트(초안 그대로): ${gate.state}; 차단 사유: ${gate.reasons.join(', ') || '없음'}`, `- 추가 확인: ${problems.join(', ') || '형식 중복 검사 통과'}`, '- 사실 확인: 필요 — 공식 원문을 직접 열어 각 주장과 대조하고 보고서를 교체하세요.', '');
  try {
    const response = await fetch(record.sourceUrl, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(12000) });
    lines.push(`- 출처 접근 점검: HTTP ${response.status} (${response.url || record.sourceUrl}); 이 응답은 내용의 정확성이나 최신성을 증명하지 않습니다.`, '');
  } catch (error) {
    lines.push(`- 출처 접근 점검: 실패 (${error.name || 'network error'}); 원문을 직접 확인하세요.`, '');
  }
}
if (!files.length) lines.push('검토 후보가 없습니다.', '');
fs.writeFileSync(path.join(root, 'review-report.md'), `${lines.join('\n')}\n`);
console.log(`Review report written for ${files.length} candidate(s).`);
