// Lightweight HTML extraction for official notice pages. It prefers likely article
// containers (including common Korean local-government board templates), then falls
// back to visible page text. It never infers facts from URLs or page titles.
const decodeEntities = (text) => text
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
  .replace(/&#(\d+);/g, (_, n) => { const cp = Number(n); return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ' '; })
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => { const cp = parseInt(n, 16); return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ' '; });

export function cleanHtmlText(html) {
  return decodeEntities(String(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(?:p|div|li|tr|td|th|h[1-6]|section|article|br|dd|dt)>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/[\u200b\ufeff]/g, '')
    .replace(/\s+/g, ' ').trim();
}

const CONTAINER_RE = /<(main|article|section|div)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
const CONTENT_HINT = /(board.?view.?content|view.?content|board.?view|view.?body|view.?con|article.?body|article.?content|bbs.?view|content.?view|#contents|id=["']contents)/i;

export function extractReadableText(html) {
  const source = String(html);
  const candidates = [];
  let match;
  CONTAINER_RE.lastIndex = 0;
  while ((match = CONTAINER_RE.exec(source))) {
    const attrs = match[2] || '';
    if (CONTENT_HINT.test(attrs)) {
      const text = cleanHtmlText(match[3]);
      if (text.length) candidates.push(text);
    }
  }
  // Pick the longest likely article container to avoid choosing a tiny nested wrapper.
  const preferred = candidates.sort((a, b) => b.length - a.length)[0] || '';
  const fallback = cleanHtmlText(source);
  return preferred.length >= 180 ? preferred : fallback;
}

export function classifySourceInspection({ ok, text = '', error = '' }, minChars = 300) {
  if (!ok) return { state: 'access_failed', publishable: false, reason: error || 'request_failed' };
  const length = String(text).trim().length;
  if (length < minChars) return { state: 'extraction_failed', publishable: false, reason: `too_little_readable_text_${length}` };
  return { state: 'readable', publishable: true, reason: '' };
}
