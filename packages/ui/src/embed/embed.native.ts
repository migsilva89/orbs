import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import unpluginIcons from 'unplugin-icons';
import { FileSystemIconLoader } from 'unplugin-icons/loaders';
import type { EmbedBuild, EmbedPageParams, EmbedServer } from '../types/embed.types';
import type { BunPlugin } from 'bun';

const UI = join(import.meta.dir, '..', '..');
const BASE = '/embed/';
const FONT = /^assets\/fonts\/[\w-]+\.woff2$/u;

const plugins: BunPlugin[] = [
  unpluginIcons.bun({
    compiler: 'jsx',
    jsx: 'react',
    collectionsNodeResolvePath: UI,
    customCollections: { brands: FileSystemIconLoader(join(UI, 'src/assets/brands')) },
  }),
  {
    name: 'markdown-without-raw-html',
    setup: (build) => {
      build.onResolve({ filter: /^rehype-raw$/u }, () => ({ path: 'rehype-raw', namespace: 'embed-stub' }));
      build.onLoad({ filter: /.*/u, namespace: 'embed-stub' }, () => ({ contents: 'export default function rehypeRaw() {}', loader: 'js' }));
    },
  },
  {
    name: 'react-from-ui',
    setup: (build) => {
      build.onResolve({ filter: /^react(?:-dom)?(?:\/.*)?$/u }, (args) => ({ path: Bun.resolveSync(args.path, UI) }));
    },
  },
];

let ready: Promise<EmbedBuild> | undefined;

export async function embedPage({ artifact, theme }: EmbedPageParams): Promise<string> {
  const { server, script, styles } = await embedReady();
  const body = server.embedRender({ artifact });
  const payload = JSON.stringify({ title: artifact.title, spec: artifact.spec }).replaceAll('<', String.raw`\u003c`);

  return `<!doctype html><html lang="en" class="${theme}" style="color-scheme:${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><link rel="stylesheet" href="${BASE}${styles}"><script type="module" src="${BASE}${script}"></script></head><body class="bg-background text-foreground antialiased"><main class="mx-auto flex w-full max-w-4xl flex-col p-4"><div id="artifact">${body}</div></main><script id="artifact-payload" type="application/json">${payload}</script></body></html>`;
}

export async function embedFile(path: string): Promise<Response | null> {
  const name = path.slice(BASE.length);

  if (FONT.test(name)) {
    return new Response(Bun.file(join(UI, 'src', name)), { headers: { 'Cache-Control': 'public, max-age=86400' } });
  }

  const file = (await embedReady()).files.get(name);

  return file ? new Response(file, { headers: { 'Content-Type': file.type, 'Cache-Control': 'public, max-age=31536000, immutable' } }) : null;
}

function embedReady(): Promise<EmbedBuild> {
  ready ??= embedBuild();

  return ready;
}

async function embedBuild(): Promise<EmbedBuild> {
  const tsconfig = join(UI, 'tsconfig.json');

  const [server, client, styles] = await Promise.all([
    Bun.build({
      entrypoints: [fileURLToPath(new URL('embed.server.tsx', import.meta.url))],
      target: 'bun',
      plugins,
      tsconfig,
    }),
    Bun.build({
      entrypoints: [fileURLToPath(new URL('embed.client.tsx', import.meta.url))],
      target: 'browser',
      plugins,
      tsconfig,
      splitting: true,
      minify: true,
      naming: '[name]-[hash].[ext]',
      define: { 'process.env.NODE_ENV': '"production"' },
    }),
    embedStyles(),
  ]);

  const bundle = server.outputs.at(0);
  const script = client.outputs.find((output) => output.kind === 'entry-point')?.path.replace(/^\.\//u, '');

  if (!bundle || !script) {
    throw new AggregateError([...server.logs, ...client.logs], 'Artifact embed build failed');
  }

  // SAFETY: the server bundle is built from embed.server.tsx, which exports embedRender.
  const module = await import(URL.createObjectURL(new Blob([await bundle.text()], { type: 'text/javascript' }))) as EmbedServer;
  const files = new Map<string, Blob>(client.outputs.map((output) => [output.path.replace(/^\.\//u, ''), output]));
  const stylesName = `embed-${Bun.hash(styles).toString(16)}.css`;

  files.set(stylesName, new Blob([styles], { type: 'text/css' }));

  return {
    server: module,
    files,
    script,
    styles: stylesName,
  };
}

async function embedStyles(): Promise<string> {
  const { compile } = await import('@tailwindcss/node');
  const { Scanner } = await import('@tailwindcss/oxide');
  const base = join(UI, 'src');
  const compiler = await compile(await Bun.file(join(base, 'styles.css')).text(), { base, onDependency: () => undefined });
  const sources = compiler.root === null || compiler.root === 'none' ? [] : [{ ...compiler.root, negated: false }];
  const scanner = new Scanner({ sources: [...sources, ...compiler.sources] });

  return compiler.build(scanner.scan());
}
