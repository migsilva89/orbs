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

function htmlBootstrap() {
  // A native WebView has no parent frame; it reports through the React Native bridge instead.
  const htmlPost = (message: unknown) => {
    const native = Reflect.get(window, 'ReactNativeWebView');

    if (native) {
      native.postMessage(JSON.stringify(message));
    } else {
      window.parent.postMessage(message, '*');
    }
  };

  window.addEventListener('message', (event) => {
    if (event.source !== window.parent || event.data?.type !== 'openbots.html-theme') {
      return;
    }

    document.documentElement.style.colorScheme = event.data.appearance;
    document.documentElement.classList.toggle('dark', event.data.appearance === 'dark');
    for (const [name, value] of Object.entries(event.data.tokens)) {
      document.documentElement.style.setProperty(name, String(value));
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    let previousHeight = 0;

    const htmlResize = () => {
      const height = Math.ceil(document.body.getBoundingClientRect().height);

      if (height !== previousHeight) {
        previousHeight = height;
        htmlPost({ type: 'openbots.html-height', height });
      }
    };

    new ResizeObserver(htmlResize).observe(document.body);
    htmlResize();
  });

  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a') : null;

    if (link === null) {
      return;
    }

    const href = link.getAttribute('href');

    if (href?.startsWith('#')) {
      return;
    }
    event.preventDefault();
    if (event.isTrusted && href) {
      htmlPost({ type: 'openbots.html-link', url: href });
    }
  });
}

export function htmlDocument(html: string) {
  return `<!doctype html><html><head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>:root{color-scheme:light dark}body{margin:0;background:var(--background,transparent);color:var(--foreground,inherit);font-family:system-ui,sans-serif}*,*::before,*::after{box-sizing:border-box}img,svg,canvas{max-width:100%}</style>
<script>(${htmlBootstrap.toString()})();</script>
</head><body>${html}</body></html>`;
}

/** Splits a reply into markdown and complete HTML fences, so each fence can render as a live preview. */
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
