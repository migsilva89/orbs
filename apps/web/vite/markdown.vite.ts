import type { Plugin } from 'vite';

const RAW_HTML = 'rehype-raw';
const RAW_HTML_STUB = `\0${RAW_HTML}`;

export function createMarkdownPlugin(): Plugin {
  return {
    name: 'markdown-without-raw-html',
    enforce: 'pre',
    resolveId: (id) => (id === RAW_HTML ? RAW_HTML_STUB : null),
    load: (id) => (id === RAW_HTML_STUB ? 'export default function rehypeRaw() {}' : null),
  };
}
