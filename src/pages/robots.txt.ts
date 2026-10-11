import type { APIRoute } from 'astro';
import { SITE_URL } from '../lib/site.mjs';

// 사이트 주소(SITE_URL)에서 sitemap 줄을 자동으로 만듭니다. public/robots.txt는 사용하지 않습니다.
export const GET: APIRoute = ({ site }) => {
  const origin = (site ?? new URL(SITE_URL)).origin;
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap-index.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
