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

const CONTENT_HINT = /(board.?view.?content|view.?content|board.?view|view.?body|view.?con|article.?body|article.?content|bbs.?view|content.?view|id=["']contents|id=["']board-view-content|id=["']nttCn|class=["'][^"']*(?:view-cont|view-con|board_view|board-view|article-body|article-content)[^"']*["'])/i;
const NON_CONTENT_RE = /<(script|style|template|noscript|nav|header|footer|aside)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

function matchingContainer(html, openingIndex, tagName) {
  const token = new RegExp(`<\\/?${tagName}\\b[^>]*>`, 'gi');
  token.lastIndex = openingIndex;
  let depth = 0;
  let tokenMatch;
  while ((tokenMatch = token.exec(html))) {
    const closing = /^<\//.test(tokenMatch[0]);
    const selfClosing = /\/>$/.test(tokenMatch[0]);
    if (closing) depth--;
    else if (!selfClosing) depth++;
    if (depth === 0) return html.slice(openingIndex, token.lastIndex);
  }
  return '';
}

export function extractReadableText(html) {
  const source = String(html);
  const candidates = [];
  const opening = /<(main|article|section|div)\b([^>]*)>/gi;
  let match;
  while ((match = opening.exec(source))) {
    const attrs = match[2] || '';
    if (!CONTENT_HINT.test(attrs)) continue;
    const fragment = matchingContainer(source, match.index, match[1]);
    if (!fragment) continue;
    const text = cleanHtmlText(fragment);
    if (text.length) candidates.push(text);
  }
  // Prefer a specific content container. Remove common page chrome before fallback
  // so a menu-heavy municipal page does not look readable merely due to navigation.
  const preferred = candidates.sort((a, b) => b.length - a.length)[0] || '';
  if (preferred.length >= 180) return preferred;
  const fallback = cleanHtmlText(source.replace(NON_CONTENT_RE, ' '));
  return preferred.length > fallback.length ? preferred : fallback;
}

export function classifySourceInspection({ ok, text = '', error = '' }, minChars = 300) {
  if (!ok) return { state: 'access_failed', publishable: false, reason: error || 'request_failed' };
  const length = String(text).trim().length;
  if (length < minChars) return { state: 'extraction_failed', publishable: false, reason: `too_little_readable_text_${length}` };
  return { state: 'readable', publishable: true, reason: '' };
}
