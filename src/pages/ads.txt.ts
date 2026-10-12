import type { APIRoute } from 'astro';

// AdSense가 설정된 경우에만 게시자 선언을 생성합니다. 실제 계정 ID를 추측하지 않습니다.
export const GET: APIRoute = () => {
  const client = import.meta.env.PUBLIC_ADSENSE_ID ?? '';
  if (!/^ca-pub-\d{16}$/.test(client)) {
    return new Response('# AdSense publisher is not configured.\n', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
    });
  }
  const publisherId = client.replace(/^ca-/, '');
  return new Response(`google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
};
