// AdSense 준비 상태의 자체 점검용 보고서입니다. Google의 승인/유지 여부를 예측하거나 보장하지 않습니다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isGuideIndexable, isRegionIndexable } from '../src/lib/indexing.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const national = readJson('src/data/national.json');
const regions = readJson('src/data/regions.json');
const site = readJson('src/data/site.json');
const env = process.env;
const checks = [];
const add = (name, ok, detail) => checks.push({ name, status: ok ? 'PASS' : 'CHECK', detail });
const requiredPages = [
  ['서비스 안내', 'src/pages/about.astro'],
  ['개인정보처리방침', 'src/pages/privacy.astro'],
  ['문의', 'src/pages/contact.astro'],
  ['편집·검증 정책', 'src/pages/editorial-policy.astro'],
  ['정정 이력', 'src/pages/corrections.astro'],
];
for (const [name, file] of requiredPages) add(`필수 안내 페이지: ${name}`, fs.existsSync(path.join(root, file)), file);
const verified = (isGuideIndexable(national) ? 1 : 0) + regions.filter(isRegionIndexable).length;
add('검증·색인 가능한 정보 페이지', verified > 0, `${verified}/${regions.length + 1}개만 현재 색인 규칙 통과`);
add('운영자 문의 이메일', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.contactEmail || ''), site.contactEmail || '연락처 없음');
const adsEnabled = env.PUBLIC_ADS_ENABLED === 'true';
const adsId = env.PUBLIC_ADSENSE_ID || '';
const slot = env.PUBLIC_ADSENSE_SLOT_CONTENT || '';
add('광고 설정값 형식', !adsEnabled || (/^ca-pub-\d{16}$/.test(adsId) && /^\d{5,20}$/.test(slot)), adsEnabled ? '광고 활성화 요청됨: 실제 계정·슬롯 값과 정책 설정을 확인하세요.' : '광고 비활성화 상태');
add('기본 광고 안전 설정', !adsEnabled || env.PUBLIC_ADS_ENABLED === 'true', 'PUBLIC_ADS_ENABLED로 전체 광고를 끌 수 있습니다.');
const privacy = fs.readFileSync(path.join(root, 'src/pages/privacy.astro'), 'utf8');
add('개인정보 안내의 Google 광고 관련 고지', /Google AdSense|Google 및 광고 파트너/.test(privacy), '실제 적용되는 쿠키·동의 설정과 문구가 일치하는지 검토 필요');
const report = [
  '# AdSense 준비 자체 점검', '',
  `- 실행 시각: ${new Date().toISOString()}`,
  '- 이 보고서는 기술적 사전 점검일 뿐이며 AdSense 승인, 광고 제한 방지, 수익을 보장하지 않습니다.',
  '- 페이지 수/글자 수만으로 승인 여부를 판정하지 않습니다. 독창적 가치, 정책, 사이트 접근성 및 실제 콘텐츠 품질은 별도 평가 대상입니다.', '',
  '| 점검 | 상태 | 세부 정보 |', '|---|---|---|',
  ...checks.map((c) => `| ${c.name} | ${c.status} | ${c.detail.replaceAll('|', '\\|')} |`), '',
  '## 다음 조치',
  '- `CHECK` 항목을 확인합니다.',
  '- 검증되지 않은 공고는 임의로 `verified`로 바꾸지 않습니다.',
  '- 광고를 켜기 전에 본인 계정에서 사이트 승인 상태, ads.txt 상태, 개인정보/동의 요구사항을 직접 확인합니다.',
].join('\n') + '\n';
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
if (checks.some((c) => c.name.startsWith('필수 안내 페이지') && c.status !== 'PASS')) process.exitCode = 1;
