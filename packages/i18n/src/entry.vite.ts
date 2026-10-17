import { paraglideVitePlugin } from '@inlang/paraglide-js';

export const i18nParaglideOptions = {
  outputStructure: 'locale-modules',
  emitTsDeclarations: true,
  strategy: ['globalVariable', 'baseLocale'],
} satisfies Omit<Parameters<typeof paraglideVitePlugin>[0], 'outdir' | 'project'>;

export function createI18nPlugin(options: { project: string; outdir: string }) {
  return paraglideVitePlugin({ ...i18nParaglideOptions, ...options });
}
