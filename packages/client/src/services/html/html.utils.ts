import { ARTIFACT, reactionEmoji } from '@repo/contracts/universal';
import { HTML_BOOTSTRAP, HTML_KIT } from './html.constants';
import type { HtmlReplySegment } from '../../types/html.types';

export function htmlReplyContent(content: string): string | undefined {
  if (/^(?:[\t ]*\r?\n)*(?: {4}|\t)/.test(content)) {
    return undefined;
  }

  const value = content.trim();
  const fence = /^(`{3,}|~{3,})[\t ]*(?:html|htm)(?:[\t ][^\n]*)?\r?\n([\s\S]*?)\r?\n(`+|~+)[\t ]*$/i.exec(value);

  if (fence?.[3].startsWith(fence[1])) {
    return fence[2];
  }

  if (/^<(?:!doctype\s+html\b|[a-z][\w-]*(?:\s|\/?>))/i.test(value) && value.endsWith('>')) {
    return value;
  }

  return undefined;
}

export function htmlTitle(html: string): string | undefined {
  const heading = /<title[^>]*>([\s\S]*?)<\/title>|<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i.exec(html);

  const title = (heading?.[1] ?? heading?.[2] ?? '').replaceAll(/<[^>]*>/g, '').replaceAll(/\s+/g, ' ').trim();

  return title === '' ? undefined : title;
}

export function htmlEmoji(html: string): string {
  const content = /<meta\s+name=["']emoji["']\s+content=["']([^"']+)["']/i.exec(html)?.[1]?.trim();
  const parsed = reactionEmoji.safeParse(content);

  return parsed.success ? parsed.data : ARTIFACT.emojiDefault;
}

export function htmlDocument(html: string) {
  return `<!doctype html><html><head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>:root{color-scheme:light dark}
html{background:var(--background,transparent);color:var(--foreground,inherit);font-family:Inter,system-ui,sans-serif;font-size:14px;line-height:1.375;letter-spacing:-0.01em;font-feature-settings:'cv11','salt','ss01','ss03','cv01','cv02','cv03','cv04','cv05','cv06','cv07','cv08','cv09','cv10';-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
body{margin:0}*,*::before,*::after{box-sizing:border-box}img,svg,canvas{max-width:100%}
:is(button,select,summary,[role=button],[role=tab],[role=option],[role=menuitem]):not(:disabled,[aria-disabled=true]){cursor:pointer}
${HTML_KIT}</style>
<script>${HTML_BOOTSTRAP}</script>
</head><body>${html}</body></html>`;
}

export function htmlReplySegments(content: string): HtmlReplySegment[] {
  const fences = [...content.matchAll(/^(`{3,}|~{3,})[\t ]*(?:html|htm)\b[^\n]*\n[\s\S]*?\n\1[\t ]*$/gim)];
  const segments: HtmlReplySegment[] = [];
  let index = 0;

  for (const fence of fences) {
    const html = htmlReplyContent(fence[0]);

    if (html !== undefined) {
      segments.push({ kind: 'markdown', text: content.slice(index, fence.index) }, { kind: 'html', text: html });
      index = fence.index + fence[0].length;
    }
  }

  segments.push({ kind: 'markdown', text: content.slice(index) });

  return segments.filter((segment) => segment.text.trim() !== '');
}
